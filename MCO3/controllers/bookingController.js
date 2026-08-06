const Reservation = require('../models/Reservation');
const Flight = require('../models/Flight');
const User = require('../models/User');
const { generateUniquePNR, generateUniqueReservationNumber, getSeatLockExpiration, isSeatLockExpired } = require('../utils/utils');

const PREMIUM_ROWS = new Set([1, 2, 3, 4]);
const isPremiumSeat = (seatCode) => {
    const seatRow = parseInt((seatCode.match(/^\d+/) || ['0'])[0], 10);
    return PREMIUM_ROWS.has(seatRow);
};
const getSessionUserId = (req) => {
    return req.session && req.session.user ? req.session.user.id || req.session.user._id : null;
};
const canAccessBooking = (req, booking) => {
    if (req.session.user.role === 'admin') { return true; }
    return String(booking.user) === String(getSessionUserId(req));
};

exports.getSeatAvailability = async (req, res) => {
    try {
        const flight = await Flight.findById(req.params.id).lean();
        if (!flight) {
            console.log('Seat availability failed: Flight not found.');
            return res.status(404).json({ success: false, message: 'Flight not found.' });
        }
        const reservations = await Reservation.find({ flight: flight._id, bookingStatus: { $ne: 'Cancelled' } }).select('seat.code');
        const occupiedSeats = reservations.map((reservation) => reservation.seat.code);
        console.log('Seat availability loaded for flight:', flight.flightNumber, 'Occupied seats:', occupiedSeats.length);
        // Bug fix: Flight has no `availableSeats` field - the real field is seatsAvailable.
        return res.status(200).json({ success: true, flightId: flight._id, seatCapacity: flight.seatCapacity, availableSeats: flight.seatsAvailable, occupiedSeats });
    } catch (error) {
        console.error('Error fetching seat availability:', error);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

exports.getBookingInformation = async (req, res) => {
    try {
        const flight = await Flight.findById(req.params.flightId).lean();
        if (!flight) {
            console.log('Booking information failed: Flight not found.');
            return res.status(404).json({ success: false, message: 'Flight not found.' });
        }
        // Bug fix: Flight has no `schedule` field - the real field is departureDateTime.
        if (new Date(flight.departureDateTime) < new Date()) {
            console.log('Booking closed: Flight already departed.');
            return res.status(400).json({ success: false, message: 'Booking is closed. This flight has already departed.' });
        }
        let user = null;
        const userId = getSessionUserId(req);
        if (userId) {
            user = await User.findById(userId).select('-password').lean();
        }
        console.log('Booking information loaded for flight:', flight.flightNumber);
        return res.status(200).json({ success: true, flight, user });
    } catch (error) {
        console.error('Error fetching booking information:', error);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

exports.createBooking = async (req, res) => {
    const { firstName, lastName, email, passport, seat, mealOption, baggage, flightId } = req.body;
    if (!firstName || !lastName || !email || !passport || !seat || !flightId) {
        console.log('Booking creation failed: Missing required fields.');
        return res.status(400).json({ success: false, message: 'Please fill in all required fields.' });
    }
    const userId = getSessionUserId(req);
    if (!userId) {
        console.log('Booking creation failed: Missing authenticated user session.');
        return res.status(401).json({ success: false, message: 'Authentication required. Please log in and try again.' });
    }
    try {
        const flight = await Flight.findById(flightId);
        if (!flight) {
            console.log('Booking creation failed: Flight not found.');
            return res.status(404).json({ success: false, message: 'Flight not found.' });
        }
        if (new Date(flight.departureDateTime) < new Date()) {
            console.log('Booking creation failed: Flight already departed.');
            return res.status(400).json({ success: false, message: 'Booking failed. This flight has already departed.' });
        }
        if (flight.seatsAvailable <= 0) {
            return res.status(409).json({ success: false, message: 'No available seats for this flight.' });
        }
        const trimmedSeat = seat.trim();
        const existingReservation = await Reservation.findOne({ flight: flightId, 'seat.code': trimmedSeat, bookingStatus: { $ne: 'Cancelled' } });
        if (existingReservation) {
            console.log('Booking creation failed: Seat already booked.');
            return res.status(409).json({ success: false, message: `Seat ${trimmedSeat} is already booked.` });
        }
        const pnr = await generateUniquePNR();
        // Bug fix: reservationNumber is required + unique on the schema, but
        // the original code never set it at all, so save() always failed.
        const reservationNumber = await generateUniqueReservationNumber();
        const mealLabel = mealOption && mealOption.label ? mealOption.label : 'None';
        const mealPrice = Number(mealOption && mealOption.price ? mealOption.price : 0);
        const baggageKg = parseInt(baggage, 10) || 0;
        const newBooking = new Reservation({
            flight: flightId,
            user: userId,
            reservationNumber,
            passengerName: `${firstName.trim()} ${lastName.trim()}`,
            email: email.trim().toLowerCase(),
            passportNumber: passport.trim(),
            seat: { code: trimmedSeat, isPremium: isPremiumSeat(trimmedSeat) },
            meal: { label: mealLabel, price: mealPrice },
            baggage: { checkedBaggageKg: baggageKg },
            // Bug fix: Flight has no `price` field - the real field is ticketPrice.
            bill: { baseFare: flight.ticketPrice, taxes: 0 },
            pnr,
            bookingStatus: 'Pending',
            seatLocked: true,
            seatLockedExpiresAt: getSeatLockExpiration()
        });
        const savedBooking = await newBooking.save();

        // Seat is held during the lock period, so take it off the flight's count.
        flight.seatsAvailable -= 1;
        await flight.save();

        console.log('Pending booking created. PNR:', savedBooking.pnr, 'Flight:', flight.flightNumber);
        return res.status(201).json({ success: true, message: 'Pending booking created successfully.', booking: savedBooking });
    } catch (error) {
        if (error.code === 11000) {
            console.log('Booking creation failed: Seat booking conflict.');
            return res.status(409).json({ success: false, message: `Seat ${seat} is already booked. Please choose another seat.` });
        }
        console.error('Booking creation error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

exports.getBookingSummary = async (req, res) => {
    try {
        const booking = await Reservation.findById(req.params.id).populate('flight').populate('user', '-password');
        if (!booking) {
            console.log('Booking summary failed: Booking not found.');
            return res.status(404).json({ success: false, message: 'Booking not found.' });
        }
        if (!canAccessBooking(req, booking)) {
            return res.status(403).json({ success: false, message: 'You do not have access to this booking.' });
        }
        console.log('Booking summary loaded. PNR:', booking.pnr);
        return res.status(200).json({ success: true, booking });
    } catch (error) {
        console.error('Error fetching booking summary:', error);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

exports.confirmBooking = async (req, res) => {
    try {
        const booking = await Reservation.findById(req.params.id);
        if (!booking) {
            console.log('Booking confirmation failed: Booking not found.');
            return res.status(404).json({ success: false, message: 'Booking not found.' });
        }
        if (!canAccessBooking(req, booking)) {
            return res.status(403).json({ success: false, message: 'You do not have access to this booking.' });
        }
        if (booking.bookingStatus === 'Cancelled') {
            return res.status(400).json({ success: false, message: 'Cancelled booking cannot be confirmed.' });
        }
        if (booking.bookingStatus === 'Confirmed') {
            return res.status(400).json({ success: false, message: 'Booking is already confirmed.' });
        }
        booking.bookingStatus = 'Confirmed';
        booking.seatLocked = false;
        booking.seatLockedExpiresAt = null;
        const confirmedBooking = await booking.save();
        console.log('Booking confirmed. PNR:', confirmedBooking.pnr);
        return res.status(200).json({ success: true, message: 'Booking confirmed successfully.', booking: confirmedBooking });
    } catch (error) {
        console.error('Booking confirmation error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

exports.releaseExpiredSeatLock = async (req, res) => {
    try {
        const booking = await Reservation.findById(req.params.id);
        if (!booking) {
            console.log('Seat lock release failed: Booking not found.');
            return res.status(404).json({ success: false, message: 'Booking not found.' });
        }
        // Bug fix: seatLocked is a plain Boolean on the schema, not an object
        // with .isLocked/.expiresAt - the original check/assignment against
        // those properties silently did nothing (assigning to a property of
        // a boolean primitive is a no-op), so a lock could never actually
        // expire or be released.
        if (booking.seatLocked && !isSeatLockExpired(booking.seatLockedExpiresAt)) {
            return res.status(400).json({ success: false, message: 'Seat lock has not expired yet.' });
        }
        const wasLocked = booking.seatLocked;
        booking.seatLocked = false;
        booking.seatLockedExpiresAt = null;
        const updatedBooking = await booking.save();

        // Give the seat back if it was actually still held.
        if (wasLocked) {
            await Flight.findByIdAndUpdate(booking.flight, { $inc: { seatsAvailable: 1 } });
        }

        console.log('Expired seat lock released. PNR:', updatedBooking.pnr);
        return res.status(200).json({ success: true, message: 'Expired seat lock released successfully.', booking: updatedBooking });
    } catch (error) {
        console.error('Seat lock release error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

exports.cancelPendingBooking = async (req, res) => {
    try {
        const booking = await Reservation.findById(req.params.id);
        if (!booking) {
            console.log('Booking cancellation failed: Booking not found.');
            return res.status(404).json({ success: false, message: 'Booking not found.' });
        }
        if (!canAccessBooking(req, booking)) {
            return res.status(403).json({ success: false, message: 'You do not have access to this booking.' });
        }
        if (booking.bookingStatus === 'Cancelled') {
            return res.status(400).json({ success: false, message: 'Booking is already cancelled.' });
        }
        if (booking.bookingStatus !== 'Pending') {
            return res.status(400).json({ success: false, message: 'Only pending bookings can be cancelled.' });
        }
        booking.bookingStatus = 'Cancelled';
        booking.cancelledAt = new Date();
        booking.seatLocked = false;
        booking.seatLockedExpiresAt = null;
        const cancelledBooking = await booking.save();

        // Cancelling frees the seat back up.
        await Flight.findByIdAndUpdate(booking.flight, { $inc: { seatsAvailable: 1 } });

        console.log('Pending booking cancelled. PNR:', cancelledBooking.pnr);
        return res.status(200).json({ success: true, message: 'Pending booking cancelled successfully.', booking: cancelledBooking });
    } catch (error) {
        console.error('Booking cancellation error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};
