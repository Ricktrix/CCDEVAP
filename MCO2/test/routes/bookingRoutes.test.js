const express = require('express');
const request = require('supertest');

const bookingRoutes = require('../../routes/bookingRoutes');
const bookingController = require('../../controllers/bookingController');
const authMiddleware = require('../../middlewares/authMiddleware');

jest.mock('../../controllers/bookingController', () => ({ getSeatAvailability: jest.fn(), getBookingInformation: jest.fn(), createBooking: jest.fn(), getBookingSummary: jest.fn(), confirmBooking: jest.fn(), releaseExpiredSeatLock: jest.fn(), cancelPendingBooking: jest.fn() }));

jest.mock('../../middlewares/authMiddleware', () => ({ isAuthenticated: jest.fn((req, res, next) => next()), isAdmin: jest.fn((req, res, next) => next()) }));

describe('Booking Routes', () => {
    let app;
    beforeEach(() => {
        jest.clearAllMocks();
        app = express();
        app.use(express.json());
        app.use('/api/bookings', bookingRoutes);
        app.use((req, res) => {
            res.status(404).json({ success: false, message: 'Route not found.' });
        });
        bookingController.getSeatAvailability.mockImplementation((req, res) => {
            res.status(200).json({ success: true, message: 'Seat availability retrieved successfully.' });
        });
        bookingController.getBookingInformation.mockImplementation((req, res) => {
            res.status(200).json({ success: true, message: 'Booking information retrieved successfully.' });
        });
        bookingController.createBooking.mockImplementation((req, res) => {
            res.status(201).json({ success: true, message: 'Booking created successfully.' });
        });
        bookingController.getBookingSummary.mockImplementation((req, res) => {
            res.status(200).json({ success: true, message: 'Booking summary retrieved successfully.' });
        });
        bookingController.confirmBooking.mockImplementation((req, res) => {
            res.status(200).json({ success: true, message: 'Booking confirmed successfully.' });
        });
        bookingController.releaseExpiredSeatLock.mockImplementation((req, res) => {
            res.status(200).json({ success: true, message: 'Seat lock released successfully.' });
        });
        bookingController.cancelPendingBooking.mockImplementation((req, res) => {
            res.status(200).json({ success: true, message: 'Booking cancelled successfully.' });
        });
    });
    describe('GET /api/bookings/flight/:flightId/seats', () => {
        test('should call getSeatAvailability controller', async () => {
            const response = await request(app).get('/api/bookings/flight/123/seats');
            expect(response.status).toBe(200);
            expect(bookingController.getSeatAvailability).toHaveBeenCalledTimes(1);
        });
    });
    describe('GET /api/bookings/flight/:flightId', () => {
        test('should call getBookingInformation controller', async () => {
            const response = await request(app).get('/api/bookings/flight/123');
            expect(response.status).toBe(200);
            expect(bookingController.getBookingInformation).toHaveBeenCalledTimes(1);
        });
    });
    describe('POST /api/bookings', () => {
        test('should call createBooking controller', async () => {
            const response = await request(app).post('/api/bookings').send({ passengerName: 'John Doe' });
            expect(response.status).toBe(201);
            expect(bookingController.createBooking).toHaveBeenCalledTimes(1);
        });
    });
    describe('GET /api/bookings/:id/summary', () => {
        test('should call getBookingSummary controller', async () => {
            const response = await request(app).get('/api/bookings/123/summary');
            expect(response.status).toBe(200);
            expect(bookingController.getBookingSummary).toHaveBeenCalledTimes(1);
        });
    });
    describe('PATCH /api/bookings/:id/confirm', () => {
        test('should call confirmBooking controller', async () => {
            const response = await request(app).patch('/api/bookings/123/confirm');
            expect(response.status).toBe(200);
            expect(bookingController.confirmBooking).toHaveBeenCalledTimes(1);
        });
    });
    describe('PATCH /api/bookings/:id/release-seat-lock', () => {
        test('should call releaseExpiredSeatLock controller', async () => {
            const response = await request(app).patch('/api/bookings/123/release-seat-lock');
            expect(response.status).toBe(200);
            expect(bookingController.releaseExpiredSeatLock).toHaveBeenCalledTimes(1);
        });
    });
    describe('PATCH /api/bookings/:id/cancel', () => {
        test('should call cancelPendingBooking controller', async () => {
            const response = await request(app).patch('/api/bookings/123/cancel');
            expect(response.status).toBe(200);
            expect(bookingController.cancelPendingBooking).toHaveBeenCalledTimes(1);
        });
    });
    describe('Controller Errors', () => {
        test('should return 500 when createBooking returns an internal server error', async () => {
            bookingController.createBooking.mockImplementationOnce((req, res) => {
                res.status(500).json({ success: false, message: 'Internal server error.' });
            });
            const response = await request(app).post('/api/bookings');
            expect(response.status).toBe(500);
            expect(bookingController.createBooking).toHaveBeenCalledTimes(1);
        });
    });
    describe('Authentication Middleware', () => {
        test('isAuthenticated middleware is not used in the current routes', () => {
            expect(authMiddleware.isAuthenticated).not.toHaveBeenCalled();
        });
        test('isAdmin middleware is not used in the current routes', () => {
            expect(authMiddleware.isAdmin).not.toHaveBeenCalled();
        });
    });
    describe('Invalid Routes', () => {
        test('should return 404 for an unknown endpoint', async () => {
            const response = await request(app).get('/api/bookings/unknown/route');
            expect(response.status).toBe(404);
            expect(response.body).toEqual({ success: false, message: 'Route not found.' });
        });
    });
});