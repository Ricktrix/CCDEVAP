const Flight = require('../models/Flight');
const mongoose = require('mongoose');
const { logActivity } = require('../utils/auditLogger');

const isValidObjectId = (id) => { return mongoose.Types.ObjectId.isValid(id); };

exports.getFlights = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const sort = req.query.sort || 'departureDateTime';
    const order = req.query.order === 'desc' ? -1 : 1;
    const filter = {};
    if (req.query.origin) { filter.origin = new RegExp(req.query.origin.trim(), 'i'); }
    if (req.query.destination) { filter.destination = new RegExp(req.query.destination.trim(), 'i'); }
    if (req.query.airline) { filter.airline = new RegExp(req.query.airline.trim(), 'i'); }
    try {
        const totalFlights = await Flight.countDocuments(filter);
        const flights = await Flight.find(filter)
            .sort({ [sort]: order })
            .skip((page - 1) * limit)
            .limit(limit);
        console.log('Fetched', flights.length, 'flights.');
        return res.status(200).json({
            success: true,
            totalFlights,
            currentPage: page,
            totalPages: Math.ceil(totalFlights / limit),
            flights
        });
    } catch (error) {
        console.log('Server error while fetching flights:', error);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

exports.getFlightById = async (req, res) => {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
        console.log('Flight lookup failed: Invalid ID.');
        return res.status(400).json({ success: false, message: 'Invalid flight ID.' });
    }
    try {
        const flight = await Flight.findById(id);
        if (!flight) {
            console.log('Flight not found:', id);
            return res.status(404).json({ success: false, message: 'Flight not found.' });
        }
        console.log('Flight retrieved:', flight.flightNumber);
        return res.status(200).json({ success: true, data: flight });
    } catch (error) {
        console.error('Server error while fetching flight:', error);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

exports.searchFlights = async (req, res) => {
    const { origin, destination, departureDate, airline } = req.query;

    const filter = {
        seatsAvailable: { $gt: 0 }
    };

    if (origin) {
        filter.origin = new RegExp(origin.trim(), 'i');
    }
    if (destination) {
        filter.destination = new RegExp(destination.trim(), 'i');
    }
    if (airline) {
        filter.airline = new RegExp(airline.trim(), 'i');
    }
    if (departureDate) {
        const startDate = new Date(departureDate);
        const endDate = new Date(departureDate);
        endDate.setDate(endDate.getDate() + 1);

        filter.departureDateTime = {
            $gte: startDate,
            $lt: endDate
        };
    }
    try {
        const flights = await Flight.find(filter).sort({ departureDateTime: 1 });
        console.log(`Flight search returned ${flights.length} result(s).`);
        return res.status(200).json({
            success: true,
            count: flights.length,
            flights: flights
        });
    } catch (error) {
        console.error('Server error during flight search:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error.'
        });
    }
};

// Note: authentication + admin role are enforced by the isAuthenticated/isAdmin
// middleware on the route, so this function can assume req.session.user is an admin.
exports.createFlight = async (req, res) => {
    const { flightNumber, airline, origin, destination, departureDateTime, arrivalDateTime, availableSeats, ticketPrice } = req.body;
    // seatCapacity falls back to availableSeats if not explicitly given, same as the original intent.
    const seatsInput = req.body.seatCapacity !== undefined ? req.body.seatCapacity : req.body.availableSeats;

    if (!flightNumber || !airline || !origin || !destination || !departureDateTime || !arrivalDateTime || availableSeats === undefined || ticketPrice === undefined) {
        console.log('Flight creation failed: Missing required fields.');
        return res.status(400).json({ success: false, message: 'Please fill in all required fields.' });
    }
    const flightData = {
        flightNumber: flightNumber.trim(),
        airline: airline.trim(),
        origin: origin.trim(),
        destination: destination.trim(),
        departureDateTime: new Date(departureDateTime),
        arrivalDateTime: new Date(arrivalDateTime),
        ticketPrice: Number(ticketPrice),
        seatCapacity: Number(seatsInput),
        // Bug fix: the Flight schema's field is `seatsAvailable`, not
        // `availableSeats` - the original code set both, but only
        // `availableSeats` was validated below, and it isn't a real schema
        // field, so it was silently dropped on save.
        seatsAvailable: Number(seatsInput)
    };
    if (flightData.departureDateTime >= flightData.arrivalDateTime) {
        console.log('Flight creation failed: Invalid schedule.');
        return res.status(400).json({ success: false, message: 'Departure date must be before arrival date.' });
    }
    if (flightData.seatsAvailable < 0 || Number.isNaN(flightData.seatsAvailable)) {
        console.log('Flight creation failed: Invalid seat count.');
        return res.status(400).json({ success: false, message: 'Available seats must be zero or greater.' });
    }
    if (flightData.ticketPrice < 0 || Number.isNaN(flightData.ticketPrice)) {
        console.log('Flight creation failed: Invalid ticket price.');
        return res.status(400).json({ success: false, message: 'Ticket price must be zero or greater.' });
    }
    try {
        const existingFlight = await Flight.findOne({ flightNumber: flightData.flightNumber });
        if (existingFlight) {
            console.log('Flight creation failed: Flight number already exists.');
            return res.status(409).json({ success: false, message: 'Flight number already exists.' });
        }
        const flight = await Flight.create(flightData);
        console.log('Flight created:', flight.flightNumber);
        await logActivity(req.session.user, 'Flight Creation', `Flight ${flight.flightNumber} (${flight.origin} -> ${flight.destination}) created.`);
        return res.status(201).json({ success: true, message: 'Flight created successfully.', data: flight });
    } catch (error) {
        console.log('Server error during flight creation:', error);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

exports.updateFlight = async (req, res) => {
    if (!isValidObjectId(req.params.id)) {
        console.log('Flight update failed: Invalid flight ID.');
        return res.status(400).json({ success: false, message: 'Invalid flight ID.' });
    }
    const updateData = { ...req.body };
    if (updateData.flightNumber) updateData.flightNumber = updateData.flightNumber.trim();
    if (updateData.airline) updateData.airline = updateData.airline.trim();
    if (updateData.origin) updateData.origin = updateData.origin.trim();
    if (updateData.destination) updateData.destination = updateData.destination.trim();

    // Bug fix: the incoming field is named availableSeats (matches the form/API
    // contract), but the schema field is seatsAvailable - the original code
    // validated availableSeats but then passed it straight through to
    // findByIdAndUpdate, so it never actually touched the real field.
    if (updateData.availableSeats !== undefined) {
        const seats = Number(updateData.availableSeats);
        if (Number.isNaN(seats) || seats < 0) {
            console.log('Flight update failed: Invalid seat count.');
            return res.status(400).json({ success: false, message: 'Available seats must be zero or greater.' });
        }
        updateData.seatsAvailable = seats;
        delete updateData.availableSeats;
    }
    if (updateData.ticketPrice !== undefined) {
        updateData.ticketPrice = Number(updateData.ticketPrice);
        if (Number.isNaN(updateData.ticketPrice) || updateData.ticketPrice < 0) {
            console.log('Flight update failed: Invalid ticket price.');
            return res.status(400).json({ success: false, message: 'Ticket price must be zero or greater.' });
        }
    }
    if (updateData.departureDateTime && updateData.arrivalDateTime) {
        if (new Date(updateData.departureDateTime) >= new Date(updateData.arrivalDateTime)) {
            console.log('Flight update failed: Invalid schedule.');
            return res.status(400).json({ success: false, message: 'Departure date must be before arrival date.' });
        }
    }
    try {
        if (updateData.flightNumber) {
            const existingFlight = await Flight.findOne({ flightNumber: updateData.flightNumber, _id: { $ne: req.params.id } });
            if (existingFlight) {
                console.log('Flight update failed: Flight number already exists.');
                return res.status(409).json({ success: false, message: 'Flight number already exists.' });
            }
        }
        const flight = await Flight.findByIdAndUpdate(
            req.params.id, updateData,
            { new: true, runValidators: true });
        if (!flight) {
            console.log('Flight update failed: Flight not found.');
            return res.status(404).json({ success: false, message: 'Flight not found.' });
        }
        console.log('Flight updated:', flight.flightNumber);
        await logActivity(req.session.user, 'Flight Update', `Flight ${flight.flightNumber} updated.`);
        return res.status(200).json({ success: true, message: 'Flight updated successfully.', data: flight });
    } catch (error) {
        console.error('Server error during flight update:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

exports.deleteFlight = async (req, res) => {
    if (!isValidObjectId(req.params.id)) {
        console.log('Flight deletion failed: Invalid flight ID.');
        return res.status(400).json({ success: false, message: 'Invalid flight ID.' });
    }
    try {
        const flight = await Flight.findByIdAndDelete(req.params.id);
        if (!flight) {
            console.log('Flight deletion failed: Flight not found.');
            return res.status(404).json({ success: false, message: 'Flight not found.' });
        }
        console.log('Flight deleted:', flight.flightNumber);
        await logActivity(req.session.user, 'Flight Deletion', `Flight ${flight.flightNumber} deleted.`);
        return res.status(200).json({ success: true, message: 'Flight deleted successfully.' });
    } catch (error) {
        console.error('Server error during flight deletion:', error);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

exports.getFlightDetails = async (req, res) => {
    if (!isValidObjectId(req.params.id)) {
        console.log('Flight details failed: Invalid flight ID.');
        return res.status(400).json({ success: false, message: 'Invalid flight ID.' });
    }
    try {
        const flight = await Flight.findById(req.params.id);
        if (!flight) {
            console.log('Flight details failed: Flight not found.');
            return res.status(404).json({ success: false, message: 'Flight not found.' });
        }
        console.log('Flight details retrieved:', flight.flightNumber);
        return res.status(200).json({ success: true, data: flight });
    } catch (error) {
        console.error('Server error while fetching flight details:', error);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

exports.getAvailableFlights = async (req, res) => {
    try {
        const flights = await Flight.find({ seatsAvailable: { $gt: 0 } }).sort({ departureDateTime: 1 });
        console.log('Fetched', flights.length, 'available flights.');
        return res.status(200).json({ success: true, count: flights.length, data: flights });
    } catch (error) {
        console.error('Server error while fetching available flights:', error);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

exports.getFlightsByAirline = async (req, res) => {
    const airline = req.params.airline?.trim();
    if (!airline) {
        console.log('Flight search failed: Airline is required.');
        return res.status(400).json({ success: false, message: 'Airline is required.' });
    }
    try {
        // Bug fix: missing leading ^ anchor meant this matched any airline
        // name *ending* with the search term, not an exact match.
        const flights = await Flight.find({ airline: new RegExp(`^${airline}$`, 'i') }).sort({ departureDateTime: 1 });
        console.log('Fetched', flights.length, 'Flights for airline:', airline);
        return res.status(200).json({ success: true, count: flights.length, data: flights });
    } catch (error) {
        console.error('Server error while fetching flights by airline:', error);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

exports.getFlightsByOrigin = async (req, res) => {
    const origin = req.params.origin?.trim();
    if (!origin) {
        console.log('Flight search failed: Origin is required.');
        return res.status(400).json({ success: false, message: 'Origin is required.' });
    }
    try {
        const flights = await Flight.find({ origin: new RegExp(`^${origin}$`, 'i') }).sort({ departureDateTime: 1 });
        console.log('Fetched', flights.length, 'flights from:', origin);
        return res.status(200).json({ success: true, count: flights.length, data: flights });
    } catch (error) {
        console.error('Server error while fetching flights by origin:', error);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

exports.getFlightsByDestination = async (req, res) => {
    const destination = req.params.destination?.trim();
    if (!destination) {
        console.log('Flight search failed: Destination is required.');
        return res.status(400).json({ success: false, message: 'Destination is required.' });
    }
    try {
        const flights = await Flight.find({ destination: new RegExp(`^${destination}$`, 'i') }).sort({ departureDateTime: 1 });
        console.log('Fetched', flights.length, 'flights to:', destination);
        return res.status(200).json({ success: true, count: flights.length, data: flights });
    } catch (error) {
        console.error('Server error while fetching flights by destination:', error);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

exports.updateAvailableSeats = async (req, res) => {
    if (!isValidObjectId(req.params.id)) {
        console.log('Seat update failed: Invalid flight ID.');
        return res.status(400).json({ success: false, message: 'Invalid flight ID.' });
    }
    const { availableSeats } = req.body;
    if (availableSeats === undefined) {
        console.log('Seat update failed: Available seats are required.');
        return res.status(400).json({ success: false, message: 'Available seats are required.' });
    }
    const seats = Number(availableSeats);
    if (Number.isNaN(seats) || seats < 0) {
        console.log('Seat update failed: Invalid seat count.');
        return res.status(400).json({ success: false, message: 'Available seats cannot be negative.' });
    }
    try {
        // Bug fix: this used to write { availableSeats: seats }, which isn't
        // a real schema field, so the update silently did nothing.
        const flight = await Flight.findByIdAndUpdate(req.params.id, { seatsAvailable: seats }, { new: true, runValidators: true });
        if (!flight) {
            console.log('Seat update failed: Flight not found.');
            return res.status(404).json({ success: false, message: 'Flight not found.' });
        }
        console.log('Available seats updated:', flight.flightNumber, '-', flight.seatsAvailable);
        return res.status(200).json({ success: true, message: 'Available seats updated successfully.', data: flight });
    } catch (error) {
        console.error('Server error while updating available seats:', error);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};
