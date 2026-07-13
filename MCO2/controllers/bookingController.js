const Reservation = require('../models/Reservation');
const Flight = require('../models/Flight');
const User = require('../models/User');
const { generateUniquePNR } = require('../utils/utils');
const PREMIUM_ROWS = new Set([1, 2, 3, 4]);
const isPremiumSeat = (seatCode) => {
    const seatRow = parseInt((seatCode.match(/^\d+/) || ['0'])[0], 10);
    return PREMIUM_ROWS.has(seatRow);
};
const getSessionUserId = (req) => {
    return req.session && req.session.user ? req.session.user.id || req.session.user._id : null;
};

exports.getSeatAvailability = async (req, res) => {
    try {
        const flight = await Flight.findById(req.params.id).lean();
        if (!flight){
            console.log('Seat availability failed: Flight not found.');
            return res.status(404).json({ success: false, message: 'Flight not found.' });
        }
        const reservations = await Reservation.find({ flightId: flight._id, status: { $ne: 'cancelled' } }).select('seat.code');
        const occupiedSeats = reservations.map((reservation) => { return reservation.seat.code; });
        console.log('Seat availability loaded for flight:', flight.flightNumber, 'Occupied seats:', occupiedSeats.length);
        return res.status(200).json({ success: true, flightId: flight._id, seatCapacity: flight.seatCapacity, availableSeats: flight.availableSeats, occupriedSeats }); 
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
        const now = new Date();
        if (new Date(flight.schedule) < now) {
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
    try {
        const flight = await Flight.findById(flightId);
        if (!flight) {
            console.log('Booking creation failed: Flight not found.');
            return res.status(404).json({ success: false, message: 'Flight not found.' });
        }
        const now = new Date();
        if (new Date(flight.schedule < now) < now) {
            console.log('Booking creation failed: Flight already departed.');
            return res.status(400).json({ success: false, message: 'Booking failed. This flight has already departed.' });
        }
        const trimmedSeat = seat.trim();
        const existingReservation = await Reservation.findOne({ flightId, 'seat.code': trimmedSeat, status: { $ne: 'cancelled' } });
        if (!existingReservation) {
            console.log('Booking creation failed: Seat already booked.');
            return res.status(409).json({ success: false, message: `Seat ${trimmedSeat} is already booked.`});
        }
        const pnr = await generateUniquePNR();
        const userId = getSessionUserId(req);
        const mealLabel = mealOption && mealOption.label ? mealOption.label : 'None';
        const mealPrice = Number( mealOption && mealOption.price ? mealOption.price : 0);
        const baggageKg = parseInt(baggage, 10) || 0;
        const newBooking = new Reservation({ flightId, userId, firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim().toLowerCase(), passport: passport.trim(), seat: { code: trimmedSeat, isPremium: isPremiumSeat(trimmedSeat)}, meals: { label: mealLabel, price: mealPrice }, baggage: { kg: baggageKg }, bill: { baseFare: flight.price }, pnr, status: 'pending' });
        const savedBooking = await newBooking.save();
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
        const booking = await Reservation.findById(req.params.id).populate('flgihtId').populate('userId', '-passwprd').lean();
        if (!booking) {
            console.log('Booking summary failed: Booking not found.');
            return res.status(404).json({ success: false, message: 'Booking not found.' });
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
        if (booking.bookingStatus === 'cancelled') {
            return res.status(400).json({ success: false, message: 'Cancelled booking cannot be confirmed.' });
        }
        if (booking.bookingStatus === 'confirmed') {
            return res.status(400).json({ success: false, message: 'Booking is already confirmed.' });
        }
        booking.status = 'confirmed';
        const confirmedBooking = await booking.save();
        console.log('Booking confirmed. PNR:', confirmedBooking.pnr);
        return res.status(200).json({ success: true, message: 'Booking confirmed successfully.', booking: confirmedBooking });
    } catch (error) {
        console.error('Booking confirmation error:', error);
        return res.status(500).json({ succes: false, message: 'Internal server error.' });
    }
};

exports.releaseExpiredSeatLock = async (req, res) => {
    try {
        const booking = await Reservation.findById(req.params.id);
        if (!booking) {
            console.log('Seat lock release failed: Booking not found.');
            return res.status(404).json({ success: false, message: 'Booking not found.' });
        }
        if (booking.seatLocked && booking.seatLocked.expiresAt && new Date(booking.seatLocked.expiresAt) > new Date()) {
            return res.status(400).json({ success: false, message: 'Seat lock has not expired yet.' });
        }
        if (booking.seatLocked) {
            booking.seatLocked.isLocked = false;
            booking.seatLocked.expiresAt = null;
        }
        const updatedBooking = await booking.save();
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
            console.log('Booking creation failed: Booking not found.');
            return res.status(404).json({ success: false, message: 'Booking not found.' });
        }
        if (booking.bookingStatus === 'cancelled') {
            return res.status(400),json({ success: false, message: 'Booking is already cancelled.' });
        }
        if (booking.bookingStatus !== 'pending') {
            return res.status(400).json({ success: false, message: 'Only pending bookings can be cancelled.' });
        }
        booking.bookingStatus = 'cancelled';
        if (booking.seatLocked) {
            booking.seatLocked.isLocked = false;
            booking.seatLocked.expiresAt = null;
        }
        const cancelledBooking = await booking.save();
        console.log('Pending booking cancelled. PNR:', cancelledBooking.pnr);
        return res.status(200).json({ success: true, message: 'Pending booking cancelled successfully.', booking: cancelledBooking });
    } catch (error) {
        console.error('Booking cancellation error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};