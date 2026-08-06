const express = require('express');
const router = express.Router();
const BookingController = require('../controllers/bookingController');
const { isAuthenticated } = require('../middlewares/authMiddleware');

// get seat availability (browsing doesn't require login)
router.get('/flight/:flightId/seats', (req, res, next) => {
    console.log('Fetching seat availability for flight ID:', req.params.flightId);
    BookingController.getSeatAvailability(req, res, next);
});

// booking information (browsing doesn't require login)
router.get('/flight/:flightId', (req, res, next) => {
    console.log('Fetching booking information for flight ID:', req.params.flightId);
    BookingController.getBookingInformation(req, res, next);
});

// create pending booking - this ties a Reservation to a user, so login is required.
router.post('/', isAuthenticated, (req, res, next) => {
    console.log('Starting new pending booking creation.');
    BookingController.createBooking(req, res, next);
});

// get booking summary
router.get('/:id/summary', isAuthenticated, (req, res, next) => {
    console.log('Fetching booking summary for reservation ID:', req.params.id);
    BookingController.getBookingSummary(req, res, next);
});

// confirm booking
router.patch('/:id/confirm', isAuthenticated, (req, res, next) => {
    console.log('Confirming booking for reservation ID:', req.params.id);
    BookingController.confirmBooking(req, res, next);
});

// release expired seat lock
router.patch('/:id/release-seat-lock', isAuthenticated, (req, res, next) => {
    console.log('Releasing expired seat lock for reservation ID:', req.params.id);
    BookingController.releaseExpiredSeatLock(req, res, next);
});

// cancel pending booking
router.patch('/:id/cancel', isAuthenticated, (req, res, next) => {
    console.log('Cancelling pending booking for reservation ID:', req.params.id);
    BookingController.cancelPendingBooking(req, res, next);
});

module.exports = router;
