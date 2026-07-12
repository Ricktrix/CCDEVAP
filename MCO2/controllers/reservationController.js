const Reservation = require('../models/Reservation');
const Flight = require('../models/Flight');
const User = require('../models/User');
const { generateUniquePNR } = require('../utils/utils');

const PREMIUM_ROWS = new Set([1, 2, 3, 4]);
const isValid = (id) => { return id && /^[0-9a-fA-F]{24}$/.test(id); };
const getSeatRow = (seat) => { return parseInt((seat.match(/^\d+/) || ['0'])[0], 10); };
const isPremiumSeat = (seat) => { return PREMIUM_ROWS.has(getSeatRow(seat)); };

exports.getBookingForm = async (req, res) => {
    try {
        const flightNumber = req.params.flightNumber.trim();
        const flight = await Flight.findOne({ flightNumber }).lean();
        if (!flight){
            console.log('Booking form failed: Flight not found.');
            return res.status(404).json({ success: false, message: 'Flight not found.' });
        }
        const now = new Date();
        if (new Date(flight.schedule) < now) {
            console.log('Booking closed: Flight already departed.');
            return res.status(400).json({ success: false, message: 'Booking is closed. This flight has already departed.' });
        }
        const activeReservations = await Reservation.find({ flightId: flight._id, status: { $ne: 'cancelled' }}).select('seat.code');
        const occupiedSeats = activeReservations.map((reservation) => { return reservation.seat.code; });
        console.log('Booking data loaded. Flight:', flight.flightNumber, 'Occupied seats:', occupiedSeats.length );
        return res.status(200).json({ success: true, flight, occupiedSeats });
    } catch (error) {
        console.error('Error loading booking data:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

exports.createReservation = async (req, res) => {
    const { firstName, lastName, email, passport, seat, mealOption, baggage, flightId } = req.body;
    if (!firstName || !lastName || !email || !passport || !seat || !flightId ){
        console.log('Reservation creation failed: Missing required fields.');
        return res.status(400).json({ success: false, message: 'Please fill in all required fields.' });
    }
    if (!isValid(flightId)) {
        console.log('Reservation creation failed: Invalid flight ID.');
        return res.status(400).json({ success: false, message: 'Invalid flight ID.' });
    }
    const cleanFirstName = firstName.trim();
    const cleanLastName = lastName.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassport = passport.trim();
    const cleanSeat = seat.trim();
    try {
        const flight = await Flight.findById(flightId);
        if (!flight){
            console.log('Reservation creation failed: Flight not found.');
            return res.status(404).json({ success: false, message: 'Flight not found.' });
        }
        const now = new Date();
        if (new Date(flight.schedule) < now) {
            console.log('Reservation creation failed: Flight already departed.');
            return res.status(400).json({ success: false, message: 'Booking failed. This flight has already departed.' });
        }
        if (flight.availableSeats <= 0){
            console.log('Reservation creation failed: No available seats.');
            return res.status(400).json({ success: false, message: 'No available seats for this flight.' });
        }
        const existingReservation = await Reservation.findOne({ flightId, 'seat.code': cleanSeat, staus: { $ne: 'cancelled' } });
        if (existingReservation) {
            console.log('Reservation creation failed: Seat already booked.');
            return res.status(409).json({ success: false, message: `Seat ${cleanSeat} is already booked.` });
        }
        const pnr = await generateUniquePNR();
        const mealLabel = mealOption?.label?.trim() ||'None';
        const mealPrice = Number(mealOption?.price || 0);
        const baggageKg = parseInt(baggage, 10) || 0;
        if (mealPrice < 0 || baggageKg < 0){
            console.log('Reservation creation failed: Invalid price or baggage.');
            return res.status(400).json({ success: false, message: 'Meal price and baggage weight cannot be negative.' });
        }
        const newReservation = new Reservation({ flightId, userId: req.session.user?._id || req.session.user?.id || null, firstName: cleanFirstName, lastName: cleanLastName, email: cleanEmail, passport: cleanPassport, seat: { code: cleanSeat, isPremium: isPremiumSeat(cleanSeat) }, meal: { label: mealLabel, price: mealPrice }, baggage: { kg: baggageKg }, bill: { baseFare: flight.price }, pnr });
        const savedReservation = await newReservation.save();
        console.log('New reservation created. PNR:', savedReservation.pnr, 'Flight:', flight.flightNumber );
        return res.status(201).json({ success: true, message: 'Reservation created successfully.', reservation: savedReservation });
    } catch (error) {
        if (error.code === 11000) {
            console.log('Reservation creation conflict: Seat already booked.');
            return res.status(409).json({ success: false, message: `Seat ${seat} is already booked. Please choose another seat.` });
        }
        console.error('Reservation creation error:', error); 
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

exports.getEditForm = async (req, res) => {
    const { id } = req.params;
    if (!isValidObjectId(id)){
        return res.status(400).json({ success: false, message: 'Invalid reservation ID.' });
    }
    try {
        const reservation = await Reservation.findById(id).populate('flightId').lean();
        if (!reservation){
            console.log('Reservation edit failed: Reservation not found.');
            return res.status(404).json({ success: false, message: 'Reservation not found.' });
        }
        const otherReservations = await Reservation.find({ flightId: reservation.flightId._id, status: { $ne: 'cancelled' }, _id: { $ne: reservation._id } }).select('seat.code');
        const occupiedSeats = otherReservations.map((item) => { return item.seat.code; });
        return res.status(200).json({ success: true, reservation, occupiedSeats });
    } catch (error) {
        console.error('Error loading reservation edit data:', error)
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};
 
exports.updateReservation = async (req, res) => {
    const { id } = req.params;
    const { seat, mealOption, baggage } = req.body;
    if (!isValidObjectId(id)) {
        return res.status(400).json({ success: true, message: 'Invalid reservation ID.' });
    }
    try {
        const reservation = await Reservation.findById(id);
        if (!reservation) {
            console.log('Reservation update failed: Reservation not found.');
            return res.status(404).json({ success: false, message: 'Reservation not found.' });
        }
        if (seat) {
            const cleanSeat = seat.trim();
            if (cleanSeat !== reservation.seat.code) {
                const existingReservation = await Reservation.findOne({ flightId: reservation.flightId, 'seat.code': cleanSeat, status: { $ne: 'cancelled' }, _id: { $ne: id } });
                if (existingReservation) {
                    console.log('Reservation update failed: Seat already booked.');
                    return res.status(409).json({ success: false, message: `Seat ${cleanSeat} is already booked.` });
                }
            }
        }
        const oldTotall = reservation.bill.total || 0;
        if (seat) {
            const cleanSeat = seat.trim();
            reservation.seat.code = cleanSeat;
            reservation.seat.isPremium = isPremiumSeat(cleanSeat);
        }
        if (mealOption) {
            reservation.meal.label = mealOption.label?.trim() || 'None';
            reservation.meal.price = Number(mealOption.price || 0);
            if (reservation.meal.price < 0) {
                return res.status(400).json({ success: false, message: 'Meal price cannot be negative.' });
            }
        }
        if (baggage !== undefined) {
            const baggageKg = parseInt(baggage, 10) || 0;
            if (baggageKg < 0){
                return res.status(400).json({ success: false, message: 'Baggage weight cannot be negative.' });
            }
            reservation.baggage.kg = baggageKg;
        }
        const updateReservation = await reservation.save();
        const newTotal = updatedReservation.bill.total || 0;
        const amountDue = Math.max(0, newTotal - oldTotal);
        console.log('Reservation updated. PNR:', updatedReservation.pnr, 'Amount due:', amountDue.toFixed(2) );
        return res.status(200).json({ success: true, message: 'Reservation updated successfully.', reservation: updatedReservation, amountDue });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ success: false, message: 'The selected seat is already booked.' });
        }
        console.error('Reservation update error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

exports.getAllReservations = async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ success: false, message: 'Please login first.' });
    }
    try {
        const filter = {};
        const userRole = req.session.user.role?.toLowerCase();
        if (userRole !== 'admin'){ filter.userId = req.session.user._id || req.session.user.id; }
        const resevations = (await Reservation.find(filter).populate('flightId')).toSorted({ createdAt: -1 }).lean();
        console.log('Fetched', reservations.length, 'reservations.');
        return res.status(200).json({ success: true, count: reservations.length, reservations });
    } catch (error) {
        console.error('Error fetching reservations:', error);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

exports.getUserReservationsAdmin = async (req, res) => {
    const { userId } = req.params;
    if (!req.session.user){
        return res.status(401).json({ success: false, message: 'Please login first.' });
    }
    if (req.session.user.role?.toLowerCase() !== 'admin'){
        return res.status(403).json({ success: false, message: 'Administrator access required.' });
    }
    if (!isValidObjectId(userId)) {
        return res.status(400).json({ success: false, message: 'Invalid user ID.' });
    }
    try {
        const user = await User.findById(userId).select('-password');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }
        const reservations = (await Reservation.find({ userId: user._id }).populate('flightId')).toSorted({ createdAt: -1 }).lean();
        console.log('Fetched', reservations.length, 'reservations for user:', user.email);
        return res.status(200).json({ success: true, user, count: reservations.length, reservations });
    } catch (error) {
        console.error('Error fetching user reservations:', error);
        return res.status(500).json({ sucess: false, message: 'Internal server error' });
    }
};

exports.getReservationDetails = async (req, res) => {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
        return res.status(400).json({ success: false, message: 'Invalid reservation ID.' });
    }
    try {
        const reservation = await Reservation.findById(id).populate('flightId').lean();
        if (!reservation){
            console.log('Reservation details failed: Reservation not found.');
            return res.status(404).json({ success: false, message: 'Reservation not found.' });
        }
        return res.status(200).json({ success: true, reservation });
    } catch (error) {
        console.error('Error fetching reservation details:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

exports.cancelReservation = async (req, res) => {
    const { id } = req.params;
    if (!isValidId(id)) {
        return res.status(400).json({ success: false, message: 'Invalid reservation ID.' });
    }
    try {
        const reservation = await Reservation.findById(id);
        if (!reservation) {
            console.log('Reservation cancelled failed: Reservation not found.');
            return res.status(404).json({ success: false, message: 'Reservation not found.' });
        }
        if (reservation.status === 'cancelled') {
            return res.status(400).json({ success: false, message: 'Reservation is already cancelled.' });
        }
        reservation.status = 'cancelled';
        await reservation.save();
        console.log('Reservation cancelled. ID:', reservation._id, 'PNR:', reservation.pnr );
        return res.status(200).json({ success: true, message: 'Reservation cancelled successfully.', reservation });
    } catch (error) {
        console.error('Error cancelling reservation:', error);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};