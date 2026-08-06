const mongoose = require('mongoose');

const flightSchema = new mongoose.Schema({
    flightNumber: {
        type: String,
        required: [true, 'A flight number is required.'],
        unique: true,
        trim: true,
        uppercase: true
    },
    airline: {
        type: String,
        required: [true, 'Airline is required.'],
        trim: true
    },
    origin: {
        type: String,
        required: [true, 'Origin is required.'],
        trim: true
    },
    destination: {
        type: String,
        required: [true, 'Destination is required.'],
        trim: true
    },
    departureDateTime: {
        type: Date,
        required: [true, 'Departure date and time is required.']
    },
    arrivalDateTime: {
        type: Date,
        required: [true, 'Arrival date and time is required.']
    },
    seatCapacity: {
        type: Number,
        required: [true, 'Seat capacity is required.'],
        min: [1, 'Capacity must be at least 1 seat.']
    },
    seatsAvailable: {
        type: Number,
        min: [0, 'Seats available cannot be negative.']
    },
    ticketPrice: {
        type: Number,
        required: [true, 'Ticket price is required.'],
        min: [0, 'Ticket price cannot be negative.']
    }
}, {
    timestamps: true
});

const Flight = mongoose.model('Flight', flightSchema);

module.exports = Flight;
