const Reservation = require('../models/Reservation');
const Flight = require('../models/Flight');
const User = require('../models/User');
const { generateUniquePNR, generateUniqueReservationNumber } = require('../utils/utils');
const { logActivity } = require('../utils/auditLogger');

const PREMIUM_ROWS = new Set([1, 2, 3, 4]);
const isPremiumSeat = (seatCode) => {
    const seatRow = parseInt((seatCode.match(/^\d+/) || ['0'])[0], 10);
    return PREMIUM_ROWS.has(seatRow);
};
const getSessionUserId = (req) => {
    if (!req.session || !req.session.user) { return null; }
    return req.session.user.id || req.session.user._id;
};

// Only an admin, or the passenger who owns the reservation, may view/act on it.
// Bug fix: none of the original get/update/cancel functions checked
// ownership at all, so any logged-in passenger could look up or modify
// another passenger's reservation just by knowing its ID/PNR/number.
const canAccessReservation = (req, reservation) => {
    if (req.session.user.role === 'admin') { return true; }
    return String(reservation.user) === String(getSessionUserId(req));
};

exports.getReservations = async (req, res) => {
    try {
        const userId = getSessionUserId(req);
        const reservations = await Reservation.find({ user: userId }).populate('flight').sort({ createdAt: -1 }).lean();
        console.log('Fetched', reservations.length, 'reservations for user:', userId);
        return res.status(200).json({ success: true, count: reservations.length, reservations });
    } catch (error) {
        console.error('Error fetching reservations:', error);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

// Admin-only. Route is guarded by isAdmin middleware, so no role check needed here.
exports.getAllReservations = async (req, res) => {
    try {
        // Bug fix: original called .toSorted().lean() on the array *result*
        // of an already-awaited query, but .lean() only exists on a
        // Mongoose query, not a plain array - this threw at runtime.
        const reservations = await Reservation.find()
            .populate('flight')
            .populate('user', 'firstName lastName email role')
            .sort({ createdAt: -1 })
            .lean();
        console.log('Admin fetched all reservations. Count:', reservations.length);
        return res.status(200).json({ success: true, count: reservations.length, reservations });
    } catch (error) {
        console.error('Error fetching all reservations:', error);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

exports.getReservationById = async (req, res) => {
    try {
        const reservation = await Reservation.findById(req.params.id).populate('flight').populate('user', 'firstName lastName email role');
        if (!reservation) {
            console.log('Reservation lookup failed: Reservation not found.');
            return res.status(404).json({ success: false, message: 'Reservation not found.' });
        }
        if (!canAccessReservation(req, reservation)) {
            console.log('Reservation lookup denied: Not the owner.');
            return res.status(403).json({ success: false, message: 'You do not have access to this reservation.' });
        }
        console.log('Reservation fetched. PNR:', reservation.pnr);
        return res.status(200).json({ success: true, reservation });
    } catch (error) {
        console.error('Error fetching reservation:', error);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

exports.getReservationByPNR = async (req, res) => {
    try {
        const pnr = req.params.pnr.trim().toUpperCase();
        const reservation = await Reservation.findOne({ pnr }).populate('flight').populate('user', 'firstName lastName email role');
        if (!reservation) {
            console.log('PNR lookup failed:', pnr);
            return res.status(404).json({ success: false, message: 'Reservation not found.' });
        }
        if (!canAccessReservation(req, reservation)) {
            return res.status(403).json({ success: false, message: 'You do not have access to this reservation.' });
        }
        console.log('Reservation fetched by PNR:', pnr);
        return res.status(200).json({ success: true, reservation });
    } catch (error) {
        console.error('PNR lookup error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

exports.getReservationByNumber = async (req, res) => {
    try {
        const reservationNumber = req.params.reservationNumber.trim();
        const reservation = await Reservation.findOne({ reservationNumber }).populate('flight').populate('user', 'firstName lastName email role');
        if (!reservation) {
            console.log('Reservation number lookup failed:', reservationNumber);
            return res.status(404).json({ success: false, message: 'Reservation not found.' });
        }
        if (!canAccessReservation(req, reservation)) {
            return res.status(403).json({ success: false, message: 'You do not have access to this reservation.' });
        }
        return res.status(200).json({ success: true, reservation });
    } catch (error) {
        console.error('Reservation number lookup error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

exports.createReservation = async (req, res) => {
    const { firstName, lastName, email, passport, seat, mealOption, baggage, flightId } = req.body;
    if (!firstName || !lastName || !email || !passport || !seat || !flightId) {
        console.log('Reservation creation failed: Missing required fields.');
        return res.status(400).json({ success: false, message: 'Please fill in all required fields.' });
    }
    try {
        const flight = await Flight.findById(flightId);
        if (!flight) {
            console.log('Reservation creation failed: Flight not found.');
            return res.status(404).json({ success: false, message: 'Flight not found.' });
        }
        // Bug fix: Flight has no `schedule` field - the real field is departureDateTime.
        if (new Date(flight.departureDateTime) < new Date()) {
            console.log('Reservation creation failed: Flight already departed.');
            return res.status(400).json({ success: false, message: 'Booking failed. This flight has already departed.' });
        }
        // Bug fix: Flight has no `availableSeats` field - the real field is
        // seatsAvailable, so this check never actually fired before.
        if (flight.seatsAvailable <= 0) {
            return res.status(409).json({ success: false, message: 'No available seats for this flight.' });
        }
        const cleanSeat = seat.trim();
        const existingReservation = await Reservation.findOne({ flight: flightId, 'seat.code': cleanSeat, bookingStatus: { $ne: 'Cancelled' } });
        if (existingReservation) {
            console.log('Reservation creation failed: Seat already booked.');
            return res.status(409).json({ success: false, message: `Seat ${cleanSeat} is already booked.` });
        }
        const userId = getSessionUserId(req);
        if (!userId) {
            console.log('Reservation creation failed: Missing authenticated user session.');
            return res.status(401).json({ success: false, message: 'Authentication required. Please log in and try again.' });
        }
        const pnr = await generateUniquePNR();
        // Bug fix: reservationNumber has a `unique: true` constraint, same as
        // pnr, but this used the non-checked generator.
        const reservationNumber = await generateUniqueReservationNumber();
        const mealLabel = mealOption && mealOption.label ? mealOption.label.trim() : 'None';
        const mealPrice = Number(mealOption && mealOption.price ? mealOption.price : 0);
        const baggageKg = parseInt(baggage, 10) || 0;
        if (mealPrice < 0 || baggageKg < 0) {
            return res.status(400).json({ success: false, message: 'Meal price and baggage weight cannot be negative.' });
        }

        const newReservation = new Reservation({
            flight: flightId,
            user: userId,
            reservationNumber: reservationNumber,
            passengerName: `${firstName.trim()} ${lastName.trim()}`,
            email: email.trim().toLowerCase(),
            passportNumber: passport.trim(),
            seat: { code: cleanSeat, isPremium: isPremiumSeat(cleanSeat) },
            meal: { label: mealLabel, price: mealPrice },
            baggage: { checkedBaggageKg: baggageKg },
            // Bug fix: Flight has no `price` field - the real field is ticketPrice.
            bill: { baseFare: flight.ticketPrice, taxes: 0 },
            pnr,
            bookingStatus: 'Pending'
        });

        const savedReservation = await newReservation.save();

        // Seat is now taken, so it comes off the flight's available count.
        flight.seatsAvailable -= 1;
        await flight.save();

        console.log('New reservation created. PNR:', savedReservation.pnr, 'Reservation Number:', savedReservation.reservationNumber);
        await logActivity(req.session.user, 'Reservation Creation', `Reservation ${savedReservation.reservationNumber} (PNR ${savedReservation.pnr}) created for flight ${flight.flightNumber}.`);
        return res.status(201).json({ success: true, message: 'Reservation created successfully.', reservation: savedReservation });
    } catch (error) {
        if (error.name === 'ValidationError') {
            console.error('Reservation validation failed:', error);
            return res.status(400).json({ success: false, message: 'Invalid reservation data. Please review your input and try again.' });
        }
        if (error.code === 11000) {
            return res.status(409).json({ success: false, message: `Seat ${seat} is already booked. Please choose another seat.` });
        }
        console.error('Reservation creation error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

exports.updateSeat = async (req, res) => {
    const { seat } = req.body;
    if (!seat) {
        return res.status(400).json({ success: false, message: 'Seat is required.' });
    }
    try {
        const reservation = await Reservation.findById(req.params.id);
        if (!reservation) {
            return res.status(404).json({ success: false, message: 'Reservation not found.' });
        }
        if (!canAccessReservation(req, reservation)) {
            return res.status(403).json({ success: false, message: 'You do not have access to this reservation.' });
        }
        const cleanSeat = seat.trim();
        const existingReservation = await Reservation.findOne({ flight: reservation.flight, 'seat.code': cleanSeat, bookingStatus: { $ne: 'Cancelled' }, _id: { $ne: reservation._id } });
        if (existingReservation) {
            return res.status(409).json({ success: false, message: `Seat ${cleanSeat} is already booked.` });
        }
        reservation.seat.code = cleanSeat;
        reservation.seat.isPremium = isPremiumSeat(cleanSeat);
        const updatedReservation = await reservation.save();
        console.log('Reservation seat updated. PNR:', updatedReservation.pnr);
        return res.status(200).json({ success: true, message: 'Seat updated successfully.', reservation: updatedReservation });
    } catch (error) {
        console.error('Seat update error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

exports.getAvailableSeats = async (req, res) => {
    try {
        const reservation = await Reservation.findById(req.params.id).populate('flight');
        if (!reservation) {
            return res.status(404).json({ success: false, message: 'Reservation not found.' });
        }
        const reservations = await Reservation.find({ flight: reservation.flight._id, bookingStatus: { $ne: 'Cancelled' }, _id: { $ne: reservation._id } }).select('seat.code');
        const occupiedSeats = reservations.map((item) => { return item.seat.code; });
        console.log('Occupied seats fetched. Count:', occupiedSeats.length);
        return res.status(200).json({ success: true, occupiedSeats });
    } catch (error) {
        console.error('Available seat lookup error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

exports.confirmReservation = async (req, res) => {
    try {
        const reservation = await Reservation.findById(req.params.id);
        if (!reservation) {
            return res.status(404).json({ success: false, message: 'Reservation not found.' });
        }
        reservation.bookingStatus = 'Confirmed';
        await reservation.save();
        console.log('Reservation confirmed. PNR:', reservation.pnr);
        return res.status(200).json({ success: true, message: 'Reservation confirmed successfully.', reservation });
    } catch (error) {
        console.error('Reservation confirmation error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

exports.cancelReservation = async (req, res) => {
    try {
        const reservation = await Reservation.findById(req.params.id);
        if (!reservation) {
            return res.status(404).json({ success: false, message: 'Reservation not found.' });
        }
        if (!canAccessReservation(req, reservation)) {
            return res.status(403).json({ success: false, message: 'You do not have access to this reservation.' });
        }
        if (reservation.bookingStatus === 'Cancelled') {
            return res.status(400).json({ success: false, message: 'Reservation is already cancelled.' });
        }
        reservation.bookingStatus = 'Cancelled';
        reservation.cancelledAt = new Date();
        await reservation.save();

        // Cancelling frees the seat back up.
        await Flight.findByIdAndUpdate(reservation.flight, { $inc: { seatsAvailable: 1 } });

        console.log('Reservation cancelled. PNR:', reservation.pnr);
        await logActivity(req.session.user, 'Reservation Cancellation', `Reservation ${reservation.reservationNumber} (PNR ${reservation.pnr}) cancelled.`);
        return res.status(200).json({ success: true, message: 'Reservation cancelled successfully.', reservation });
    } catch (error) {
        console.error('Reservation cancellation error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

exports.checkInReservation = async (req, res) => {
    try {
        const reservation = await Reservation.findById(req.params.id);
        if (!reservation) {
            return res.status(404).json({ success: false, message: 'Reservation not found.' });
        }
        if (reservation.bookingStatus === 'Cancelled') {
            return res.status(400).json({ success: false, message: 'Cancelled reservation cannot check in.' });
        }
        reservation.checkedIn = true;
        reservation.checkedInTime = new Date();
        reservation.bookingStatus = 'Checked-In';
        await reservation.save();
        console.log('Passenger checked in. PNR:', reservation.pnr);
        return res.status(200).json({ success: true, message: 'Check-in successful.', reservation });
    } catch (error) {
        console.error('Check-in error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

exports.updatePaymentStatus = async (req, res) => {
    const { paymentStatus } = req.body;
    if (!paymentStatus) {
        return res.status(400).json({ success: false, message: 'Payment status is required.' });
    }
    try {
        const reservation = await Reservation.findById(req.params.id);
        if (!reservation) {
            return res.status(404).json({ success: false, message: 'Reservation not found.' });
        }
        reservation.billing.paymentStatus = paymentStatus;
        await reservation.save();
        console.log('Payment status updated. PNR:', reservation.pnr, 'Status:', paymentStatus);
        return res.status(200).json({ success: true, message: 'Payment status updated successfully.', reservation });
    } catch (error) {
        console.error('Payment status update error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

// Admin-only. Route is guarded by isAdmin middleware.
exports.getUserReservationsAdmin = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) {
            console.log('Admin reservation lookup failed: User not found.');
            return res.status(404).json({ success: false, message: 'User not found.' });
        }
        // Bug fix: same .toSorted().lean() issue as getAllReservations.
        const reservations = await Reservation.find({ user: user._id }).populate('flight').sort({ createdAt: -1 }).lean();
        console.log('Admin fetched reservations for user:', user.email, 'Count:', reservations.length);
        return res.status(200).json({ success: true, user: { id: user._id, firstName: user.firstName, lastName: user.lastName, email: user.email }, count: reservations.length, reservations });
    } catch (error) {
        console.error('Error fetching user reservations:', error);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};
