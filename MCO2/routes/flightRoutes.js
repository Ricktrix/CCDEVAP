const express = require('express');
const Flight = require('../models/Flight'); 
const router = express.Router();
const FlightController = require('../controllers/flightController');

// Retrieved all flights
router.get('/', (req, res, next) => {
    console.log('Fetching all flights.');
    FlightController.getFlights(req, res, next);
});

// Search flights
/* Old Code */
// router.get('/search', (req, res, next) => {
//     console.log('Running flight search.');
//     FlightController.searchFlights(req, res, next);
// });

// API endpoint (returns JSON)
// Search flights (JSON API)
router.get('/search', (req, res, next) => {
    console.log('Background API database query executing.');
    FlightController.searchFlights(req, res, next);
});


// Retrieve available flights
router.get('/available', (req, res, next) => {
    console.log('Fetching available flights.');
    FlightController.getAvailableFlights(req, res, next);
});

// Get flights by airline
router.get('/airline/:airline', (req, res, next) => {
    console.log('Fetching flights for airline:', req.params,airline);
    FlightController.getFlightsByAirline(req, res, next);
});

// Get flights by origin
router.get('/origin/:origin', (req, res, next) => {
    console.log('Fetching flights from origin:', req.params.origin);
    FlightController.getFlightsByOrigin(req, res, next);
});

// Get Flight by destination
router.get('/destination/:destination', (req, res, next) => {
    console.log('Fetching flights from destination:', req.params.destination);
    FlightController.getFlightsByDestination(req, res, next);
});

// Get Flight Details
router.get('/:id/details', (req, res, next) => {
    console.log('Fetching details for flight ID:', req.params.id);
    FlightController.getFlightDetails(req, res, next);
});

// Get Flight by ID
router.get('/:id', (req, res, next) => {
    console.log('Fetching flight ID:', req.params.id);
    FlightController.getFlightById(req, res, next);
});

// Create flight
router.post('/', (req, res, next) => {
    console.log('Adding new flight.');
    FlightController.createFlight(req, res, next);
});

// Updates Flight
router.put('/:id', (req, res, next) => {
    console.log('Updatting flight ID:', req.params.id);
    FlightController.updateFlight(req, res, next);
});

// Update available seats
router.patch('/:id/available-seats', (req, res, next) => {
    console.log('Updating available seats for flight ID:', req.params.id);
    FlightController.updateAvailableSeats(req, res, next);
});

// Deletes flight
router.delete('/:id', (req, res, next) => {
    console.log('Deleting flight ID:', req.params.id);
    FlightController.deleteFlight(req, res, next);
});

module.exports = router;