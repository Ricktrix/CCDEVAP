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
exports.getBookingForm = async (req, res) => {
    try {
        const flight = await Flight.findOne({ flightNumber: req.params.flightNumber }).lean();
        if (!flight) {
            console.log('Booking form failed: Flight not found.');
            return res.status(404).json({ success: false, message: 'Flight not found.' });
        }
        const now = new Date();
        if (new Date(flight.schedule) < now) {
            console.log('Booking closed: Flight already departed.');
            return res.status(400).json({ success: false, message: 'Booking is closed. This flight has already departed.' });
        }
        const reservations = await Reservations.find({ flightId: flight._id, status: { $ne: 'cancelled' } }).select('seat.code');
        const occupiedSeats = reservations.map((reservation) => { return reservation.seat.code; });
        console.log('Booking form loaded for flight:', flight.flightNumber, 'Occupied seats:', occupiedSeats.length );
        return res.status(200).json({ success: true, flight, occupiedSeats });
    } catch (error) {
        console.error('Error loading booking form:', error);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

exports.createReservation = async (req, res) => {
    const {firstName, lastName, email, passport, seat, mealOption, baggage, flightId } = req.body;
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
        const now = new Date();
        if (new Date(flight.schedule) < now) {
            console.log('Reservaiton creation failed: Flight already departed.');
            return res.status(400).json({ success: false, message: 'Booking failed. This flight has already departed.' });
        }
        const existingReservation = await Reservation.findOne({ flightId, 'seat.code': seat, status: { $ne: 'cancelled' } });
        if (existingReservation){
            console.log('Reservation creation failed: Seat already booked.');
            return res.status(409).json({ success: false, message: `Seat ${seat} is already booked.` });
        }
        const pnr = await generateUniquePNR();
        const userId = getSessionUserId(req);
        const mealLabel = mealOption && mealOption.label ? mealOption.label : 'None';
        const mealPrice = Number( mealOption && mealOption.price ? mealOption.price : 0 );
        const baggageKg = parseInt(baggage, 10) || 0;
        const newReservation = new Reservation({ flightId, userId, firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim().toLowerCase(), passport: passport.trim(), seat: { code: seat.trim(), isPremium: isPremiumSeat(seat.trim()) }, meal: { label: mealLabel, price: mealPrice }, baggage: { kg: baggageKg }, bill: { baseFare: flight.price }, pnr });
        const savedReservation = await newReservation.save();
        console.log('New reservation created. PNR:', pnr, 'Flight:', flight.flightNumber, 'User ID:', userId || 'GUEST' );
        return res.status(200).json({ success: true, message: 'Reservation created successfully.', reservation: savedReservation });
    } catch (error) {
        if (error.code === 11000) {
            console.log('Reservation creation failed: Seat booking conflict.', req.body.seat );
            return res.status(409).json({ success: false, message: `Seat ${req.body.seat} is already booked. Please choose another seat.` });
        }
        console.error('Reservation creation error:', error)
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

exports.getEditForm = async (req, res) => {
    try {
        const reservation = await Reservation.findById(req.params.id).populate('flightId').lean();
        if (!reservation) {
            console.log('Edit reservation failed: Reservation not found.');
            return res.status(404).json({ success: false, message: 'Reservation not found.' });
        }
        const otherReservations = await Reservation.find({ flightId: reservation.flightId._id, status: { $ne: 'cancelled' }, _id: { $ne: reservation._id } }).select('seat.code');
        const occupiedSeats = otherReservations.map((item) => { return item.seat.code; });
        console.log('Reservation edit data loaded. PNR:', reservation.pnr);
        return res.status(200).json({ success: true, reservation, occupiedSeats });
    } catch (error) {
        console.error('Error loading reservation edit data:', error);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

exports.updateReservation = async (req, res) => {
    const { id } = req.params;
    const { seat, mealOption, baggage } = req.body;
    try {
        const reservation = await Reservation.findById(id);
        if (!reservation) {
            console.log('Reservation update failed: Reservation not found.');
            return res.status(404).json({ success: false, message: 'Reservation not found.' });
        }
        if (seat && seat !== reservation.seat.code) {
            const existingReservation = await Reservation.findOne({ flightId: reservation.flightId, 'seat.code': seat, status: { $ne: 'cancelled' }, _id: { $ne: id} });
            if (existingReservation) {
                console.log('Reservation update failed: Seat already booked.');
                return res.status(409).json({ success: false, message: `Seat ${seat} is already booked.` });
            }
        }
        const oldTotal = Number(reservation.bill.total) || 0;
        if (seat) {
            const trimmedSeat = seat.trim();
            reservation.seat.code = trimmedSeat;
            reservation.seat.isPremium = isPremiumSeat(trimmedSeat);
        }
        if (mealOption) {
            reservation.meal.label = mealOption.label || 'None';
            reservation.meal.price = Number(mealOption.price) || 0;
        }
        if (baggage !== undefined) {
            const baggageKg = parseInt(baggage, 10);
            if (baggageKg < 0) {
                console.log('Reservation update failed: Invalid baggage weight.');
                return res.status(400).json({ success: false, message: 'Baggage weight cannot be negative.' });
            }
            reservation.baggage.kg = baggageKg || 0;
        }
        const updatedReservation = await reservation.save();
        const newTotal = Number(updatedReservation.bill.total) || 0;
        const amountDue = Math.max(0, newTotal - oldTotal);
        console.log('Reservation updated. PNR:', reservation.pnr, 'Amount due:', amountDue.toFixed(2) );
        return res.status(200).json({ success: true, message: 'Reservation updated successfully.', reservation: updatedReservation, amountDue });
    } catch (error) {
        if (error.code === 11000) {
            console.log('Reservation update failed: Seat booking conflict.');
            return res.status(409).json({ success: false, message: 'The selected seat is already booked.' });
        }
        console.error('Reservation update error:', error)
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

exports.getAllReservations = async (req, res) => {
    if (!req.session || !req.session.user) {
        return res.status(401).json({ success: false, message: 'Please login first.' });
    }
    try {
        const filter = {};
        const userRole = req.session.user.role;
        const userId = getSessionUserId(req);
        if (userRole !== 'admin' && userRole !== 'Admin') { filter.userId = userId; }
        const reservations = (await Reservation.find(filter).populate('flightId')).toSorted({ createdAt: -1 }).lean();
        console.log('Fetched', reservations.length, 'reservations.');
        return res.status(200).json({ success: true, count: reservations.length, reservations });
    } catch (error) {
        console.error('Error fetching reservations:', error);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

exports.getUserReservationsAdmin = async (req, res) => {
    if (!req.session || !req.session.user) {
        return res.status(401).json({ success: false, message: 'Please login first.' });
    }
    if (req.session.user.role !== 'admin' && req.session.user.role !== 'Admin') {
        return res.status(403).json({ success: false, message: 'Administrator access required.' });
    }
    try {
        const user = await User.findById(req.params.userId);
        if (!user) {
            console.log('Admin reservation lookup failed: User not found.');
            return res.status(404).json({ success: false, message: 'User not found.' });
        }
        const reservation = (await Reservation.find({ userId: user._id }).populate('flightId')).sort({ createdAt: -1 }).lean();
        console.log('Admin fetched reservations for user:', user.email, 'Count:', reservations.length );
        return res.status(200).json({ success: true, user: { id: user._id, firstName: user.firstName, lastName: user.lastName, email: user.email }, count: reservations.length, reservations });
    } catch (error) {
        console.error('Error fetching user reservations:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

exports.getReservationDetails = async (req, res) => {
    try {
        const reservation = await Reservation.findById(req.params.id).populate('flightId').lean();
        if (!reservation) {
            console.log('Reservation details failed: Reservation not found.');
            return res.status(404).json({ success: false, message: 'Reservation not found.' });
        }
        console.log('Reservation details fetched. PNR:', reservations.pnr);
        return res.status(200).json({ success: true, reservation });
    } catch (error) {
        console.error('Error fetching reservation details:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

exports.cancelReservation = async (req, res) => {
    try {
        const reservation = await Reservation.findById(req.params.id);
        if (!reservation) {
            console.log('Reservation cancellation failed: Reservation not found.');
            return res.status(404).json({ success: false, message: 'Reservation not found.' });
        }
        if (reservation.status === 'cancelled') {
            console.log('Reservation cancelled failed: Already cancelled. PNR:', reservation.pnr );
            return res.status(400).json({ success: false, message: 'Reservation is already cancelled.' });
        }
        reservation.status = 'cancelled';
        await reservation.save();
        console.log( 'Reservation cancelled. ID:', reservation._id, 'PNR:', reservation.pnr );
        return res.status(200).json({ success: true, message: 'Reservation cancelled successfully.', reservation });
    } catch (error) {
        console.error('Error cancelling reservation:', error);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};