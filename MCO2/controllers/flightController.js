const Flight = require('../models/Flight');
const mongoose = require('mongoose');

// Check if current user is an admin
const isAdmin = (req) => { return req.session.user && req.session.user.role === 'admin' };
// Validate MongoDB ObjectId
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
            .skip((page -1) * limit)
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
            return res.status(404).json({ success: false, message: 'Fligh not found.' });
        }
        console.log('Flight retrieved:', flight.flightNumber);
        return res.status(200).json({ success: true, data: flight });
    } catch (error) {
        console.error('Server error while fetching flight:', error);
        return res.status(500).json({ success: false, message: 'Interval server error. '});
    }
};

exports.searchFlights = async (req, res) => {
    const { origin, destination, departureDate, airline }= req.query;
    const filter = { availableSeats: { $gt: 0 } };
    if (origin) { filter.origin = new RegExp(origin.trim(), 'i'); }
    if (destination) { filter.destination = new RegExp(destination.trim(), 'i'); }
    if (airline) { filter.airline = new RegExp(airline.trim(), 'i'); }
    if (departureDate) {
        const startDate = new Date(departureDate);
        const endDate = new Date(departureDate);
        endDate.setDate(endDate.getDate() + 1);
        filter.departureDateTime = { $gte: startDate, $lt: endDate };
    }
    try {
        const flights = (await Flight.find(filter)).sort({ departureDateTime: 1 });
        console.log('Flight search returned', flights.length, 'results(s).');
        return res.status(200).json({ success: true, count: flights.length, data: flights });
    } catch (error) {
        console.error('Server error during flight search:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

exports.createFlight = async (req, res) => {
    if (!req.session.user) {
        console.log('Flight creation failed: User not logged in.');
        return res.status(401).json({ success: false, message: 'Please login first.' });
    }
    if (req.session.user.role !== 'admin') {
        console.log('Flight creation failed: Unauthorized access.');
        return res.status(403).json({ success: false, message: 'Access denied.' });
    }
    const { flightNumber, airline, origin, destination, departureDateTime, arrivalDateTime, availableSeats, ticketPrice } = req.body;
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
        availableSeats: Number(availableSeats),
        ticketPrice: Number(ticketPrice) 
    };
    if (flightData.departureDateTime >= flightData.arrivalDateTime) {
        console.log('Flight creation failed: Invalid schedule.');
        return res.status(400).json({ success: false, message: 'Departure date must be before arrival date.' });
    }
    if (flightData.availableSeats < 0 || Number.isNaN(flightData.availableSeats)) {
        console.log('Flight creation failed: Invalid seat count.');
        return res.status(400).json({ success: false, message: 'Available seats must be zero or greater.' });
    }
    if (flightData.ticketPrice < 0 || Number.isNaN(flight.ticketPrice)) {
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
        return res.status(201).json({ success: true, message: 'Flight created successfully.', data: flight });
    } catch (error) {
        console.log('Server error during flight creation:', error);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

exports.updateFlight = async (req, res) => {
    if (!req.session.user) {
        console.log('Flight update failed: User not logged in.');
        return res.status(401).json({ success: false, message: 'Please login first.' });
    }
    if (req.session.user.role !== 'admin') {
        console.log('Flight update failed: Unauthorized access.');
        return res.status(403).json({ success: false, message: 'Access denied' });
    }
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        console.log('Flight update failed: Invalid flight ID.');
        return res.status(400).json({ success: false, message: 'Invalid flight ID.' });
    }
    const updateData = { ...req.body };
    if (updateData.flightNumber) updateData.flightNumber = updateData.flightNumber.trim();
    if (updateData.airline) updateData.airline = updateData.airline.trim();
    if (updateData.origin) updateData.origin = updateData.origin.trim();
    if (updateData.destination) updateData.destination = updateData.destination.trim();
    if (updateData.availableSeats !== undefined) {
        updateData.availableSeats = Number(updateData.availableSeats);
        if (Number.isNaN(updateData.availableSeats) || updateData.availableSeats < 0) {
            console.log('Flight update failed: Invalid seat count.');
            return res.status(400).json({ success: false, message: 'Available seats must be zero or greater.' });
        }
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
            {new: true, runValidators: true} );
        if (!flight) {
            console.log('Flight update failed: Flight not found.');
            return res.status(404).json({ success: false, message: 'Flight not found.' });
        }
        console.log('Flight updated:', flight.flightNumber);
        return res.status(200).json({ success: true, message: 'Flight updated successfully.', data: flight });
    } catch (error) {
        console.error('Server error during flight update:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

exports.deleteFlight = async (req, res) => {
    if (!req.session.user) {
        console.log('Flight deletion failed: User not logged in.');
        return res.status(401).json({ success: false, message: 'Please login first.' });
    }
    if (req.session.user.role !== 'admin') {
        console.log('Flight deletion failed: Unauthorized access.');
        return res.status(403).json({ success: false, message: 'Access denied.' });
    }
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
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
        return res.status(200).json({ success: true, message: 'Flight deleted successfully.' });
    } catch (error) {
        console.error('Server error during flight deletion:', error);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

exports.getFlightDetails = async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        console.log('Flight details failed: Invalid flight ID.');
        return res.status(400).json({ success: false, message: 'Invalid flight ID.' });
    }
    try {
        const flight = await Flight.findById(req.params.id);
        if(!flight){
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
        const flights = await Flight.find({
            availableSeats: { $gt: 0 } }).sort({ departureDateTime: 1 });
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
        const flights = await Flight.find({
            airline: new RegExp(`${airline}$`, 'i') }).sort({ departureDateTime: 1 });
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
        const flights = await Flights.find({
            origin: new RegExp(`^${origin}$`, 'i') }).sort({ departureDateTime: 1 });
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
        const flights = await Flight.find({
            destination: new RegExp(`^${destination}$`, 'i') }).sort({ departureDateTime: 1 });
        console.log('Fetched', flights.length, 'flights to:', destination);
        return res.status(200).json({ success: true, count: flights.length, data: flights }); 
    } catch (error) {
    console.error('Server error while fetching flights by destination:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

exports.updateAvailableSeats = async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
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
        const flight = await Flight.findByIdAndUpdate( req.params.id, { availableSeats: seats }, { new: true, runValidators: true } );
        if (!flight) {
            console.log('Seat update failed: Flight not found.');
            return res.status(404).json({ success: false, message: 'Flight not found.' });
        }
        console.log('Available seats updated:', flight.flightNumber, '-', flight.availableSeats);
        return res.status(200).json({ success: true, message: 'Available seats updated successfully.', data: flight }); 
    } catch (error) {
        console.error('Server error while updating available seats:', error);
        return res.staus(500).json({ success: false, message: 'Internal server error.' });
    }
};