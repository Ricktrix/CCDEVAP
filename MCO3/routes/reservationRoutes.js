const express = require('express');
const router = express.Router();
const ReservationController = require('../controllers/reservationController');
const { isAuthenticated, isAdmin } = require('../middlewares/authMiddleware');

// Every reservation route requires a logged-in user - passengers can only
// see/act on their own reservations (enforced inside the controller),
// admins can see everything.
router.use(isAuthenticated);

// Retrieve passenger reservations
router.get('/', (req, res, next) => {
    console.log('Accessing reservations list.');
    ReservationController.getReservations(req, res, next);
});

// Get all reservations
router.get('/admin/all', isAdmin, (req, res, next) => {
    console.log('Admin accessing all reservations.');
    ReservationController.getAllReservations(req, res, next);
});

// Bug fix: this controller function existed but was never wired to a route.
router.get('/admin/user/:id', isAdmin, (req, res, next) => {
    console.log('Admin accessing reservations for user ID:', req.params.id);
    ReservationController.getUserReservationsAdmin(req, res, next);
});

// Get reservation by PNR
router.get('/pnr/:pnr', (req, res, next) => {
    console.log('Fetching reservations with PNR:', req.params.pnr);
    ReservationController.getReservationByPNR(req, res, next);
});

// Get reservation by reservation number
router.get('/number/:reservationNumber', (req, res, next) => {
    console.log('Fetching reservation number:', req.params.reservationNumber);
    ReservationController.getReservationByNumber(req, res, next);
});

// Get Available Seats
router.get('/:id/available-seats', (req, res, next) => {
    console.log('Fetching available seats for reservation ID:', req.params.id);
    ReservationController.getAvailableSeats(req, res, next);
});

// Get reservation by ID
router.get('/:id', (req, res, next) => {
    console.log('Accessing details for reservation ID:', req.params.id);
    ReservationController.getReservationById(req, res, next);
});

// create reservation
router.post('/', (req, res, next) => {
    console.log('Starting new reservation creation.');
    ReservationController.createReservation(req, res, next);
});

// Update reservation seat
router.patch('/:id/seat', (req, res, next) => {
    console.log('Updating seat for reservation ID:', req.params.id);
    ReservationController.updateSeat(req, res, next);
});

// Confirm reservation
router.patch('/:id/confirm', (req, res, next) => {
    console.log('Confirming reservation ID:', req.params.id);
    ReservationController.confirmReservation(req, res, next);
});

// Cancel reservation
router.patch('/:id/cancel', (req, res, next) => {
    console.log('Cancelling reservation ID:', req.params.id);
    ReservationController.cancelReservation(req, res, next);
});

// Check-in reservation
router.patch('/:id/check-in', (req, res, next) => {
    console.log('Checking in reservation ID:', req.params.id);
    ReservationController.checkInReservation(req, res, next);
});

// Updates payment status
router.patch('/:id/payment-status', (req, res, next) => {
    console.log('Updating payment status for reservation ID:', req.params.id);
    ReservationController.updatePaymentStatus(req, res, next);
});

module.exports = router;
