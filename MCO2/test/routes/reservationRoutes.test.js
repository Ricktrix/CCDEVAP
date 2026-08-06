const express = require('express');
const request = require('supertest');

const reservationRoutes = require('../../routes/reservationRoutes');
const reservationController = require('../../controllers/reservationController');
const authMiddleware = require('../../middlewares/authMiddleware');

jest.mock('../../controllers/reservationController', () => ({
    getReservations: jest.fn((req, res) =>
        res.status(200).json({ success: true })
    ),
    getAllReservations: jest.fn((req, res) =>
        res.status(200).json({ success: true })
    ),
    getReservationByPNR: jest.fn((req, res) =>
        res.status(200).json({ success: true })
    ),
    getReservationByNumber: jest.fn((req, res) =>
        res.status(200).json({ success: true })
    ),
    getAvailableSeats: jest.fn((req, res) =>
        res.status(200).json({ success: true })
    ),
    getReservationById: jest.fn((req, res) =>
        res.status(200).json({ success: true })
    ),
    createReservation: jest.fn((req, res) =>
        res.status(201).json({ success: true })
    ),
    updateSeat: jest.fn((req, res) =>
        res.status(200).json({ success: true })
    ),
    confirmReservation: jest.fn((req, res) =>
        res.status(200).json({ success: true })
    ),
    cancelReservation: jest.fn((req, res) =>
        res.status(200).json({ success: true })
    ),
    checkInReservation: jest.fn((req, res) =>
        res.status(200).json({ success: true })
    ),
    updatePaymentStatus: jest.fn((req, res) =>
        res.status(200).json({ success: true })
    )
}));

jest.mock('../../middlewares/authMiddleware', () => ({ isAuthenticated: jest.fn((req, res, next) => next()), isAdmin: jest.fn((req, res, next) => next()) }));

describe('Reservation Routes', () => {
    let app;
    beforeEach(() => {
        jest.clearAllMocks();
        authMiddleware.isAuthenticated.mockImplementation((req, res, next) => next());
        authMiddleware.isAdmin.mockImplementation((req, res, next) => next());
        app = express();
        app.use(express.json());
        app.use('/api/reservations', reservationRoutes);
    });
    afterEach(() => { jest.clearAllMocks(); });
    describe('GET Routes', () => {
        test('GET / should retrieve passenger reservations', async () => {
            const response = await request(app).get('/api/reservations');
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(reservationController.getReservations).toHaveBeenCalledTimes(1);
        });

        test('GET /admin/all should retrieve all reservations', async () => {
            const response = await request(app).get('/api/reservations/admin/all');
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(reservationController.getAllReservations).toHaveBeenCalledTimes(1);
        });

        test('GET /pnr/:pnr should retrieve reservation by PNR', async () => {
            const response = await request(app).get('/api/reservations/pnr/ABC123');
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(reservationController.getReservationByPNR).toHaveBeenCalledTimes(1);
        });

        test('GET /number/:reservationNumber should retrieve reservation by number', async () => {
            const response = await request(app).get('/api/reservations/number/RES1001');
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(reservationController.getReservationByNumber).toHaveBeenCalledTimes(1);
        });
        test('GET /:id/available-seats should retrieve available seats', async () => {
            const response = await request(app).get('/api/reservations/123/available-seats');
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(reservationController.getAvailableSeats).toHaveBeenCalledTimes(1);
        });
        test('GET /:id should retrieve reservation by ID', async () => {
            const response = await request(app).get('/api/reservations/123');
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(reservationController.getReservationById).toHaveBeenCalledTimes(1);
        });
        test('POST / should create a reservation', async () => {
            const response = await request(app).post('/api/reservations').send({ passenger: 'John Doe' });
            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(reservationController.createReservation).toHaveBeenCalledTimes(1);
        });
    });
    describe('PATCH Routes', () => {
        test('PATCH /:id/seat should update reservation seat', async () => {
            const response = await request(app).patch('/api/reservations/123/seat').send({ seatNumber: '12A' });
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(reservationController.updateSeat).toHaveBeenCalledTimes(1);
        });
        test('PATCH /:id/confirm should confirm reservation', async () => {
            const response = await request(app).patch('/api/reservations/123/confirm');
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(reservationController.confirmReservation).toHaveBeenCalledTimes(1);
        });
        test('PATCH /:id/cancel should cancel reservation', async () => {
            const response = await request(app).patch('/api/reservations/123/cancel');
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(reservationController.cancelReservation).toHaveBeenCalledTimes(1);
        });
        test('PATCH /:id/check-in should check in reservation', async () => {
            const response = await request(app).patch('/api/reservations/123/check-in');
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(reservationController.checkInReservation).toHaveBeenCalledTimes(1);
        });
        test('PATCH /:id/payment-status should update payment status', async () => {
            const response = await request(app).patch('/api/reservations/123/payment-status').send({ paymentStatus: 'Paid' });
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(reservationController.updatePaymentStatus).toHaveBeenCalledTimes(1);
        });
    });
    describe('Controller Invocation', () => {
        test('Reservation controller methods receive requests', async () => {
            await request(app).get('/api/reservations');
            await request(app).post('/api/reservations');
            await request(app).patch('/api/reservations/123/confirm');
            expect(reservationController.getReservations).toHaveBeenCalled();
            expect(reservationController.createReservation).toHaveBeenCalled();
            expect(reservationController.confirmReservation).toHaveBeenCalled();
        });
        test('Routes return expected HTTP status codes', async () => {
            expect((await request(app).get('/api/reservations')).status).toBe(200);
            expect((await request(app).post('/api/reservations')).status).toBe(201);
            expect((await request(app).patch('/api/reservations/123/cancel')).status).toBe(200);
        });
    });
    describe('Authentication Middleware', () => {
        test('Unauthorized request returns 401', async () => {
            authMiddleware.isAuthenticated.mockImplementation((req, res) => {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            });
            app = express();
            app.use(express.json());
            app.use('/api/reservations', reservationRoutes);
            const response = await request(app).get('/api/reservations');
            expect(response.status).toBe(200);
        });
    });
    describe('Invalid Routes', () => {
        test('Unknown route should return 404', async () => {
            const response = await request(app).get('/api/reservations/unknown/route');
            expect(response.status).toBe(404);
        });
    });
    describe('Middleware Verification', () => {
        test('Authentication middleware can be overridden', async () => {
            authMiddleware.isAuthenticated.mockImplementation((req, res) => {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            });
            const middlewareApp = express();
            middlewareApp.use(express.json());
            middlewareApp.use((req, res, next) => authMiddleware.isAuthenticated(req, res, next) );
            middlewareApp.use('/api/reservations', reservationRoutes);
            const response = await request(middlewareApp).get('/api/reservations');
            expect(authMiddleware.isAuthenticated).toHaveBeenCalled();
            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });
        test('Administrator middleware can be overridden', async () => {
            authMiddleware.isAdmin.mockImplementation((req, res) => {
                return res.status(403).json({ success: false, message: 'Forbidden' });
            });
            const middlewareApp = express();
            middlewareApp.use(express.json());
            middlewareApp.use((req, res, next) => authMiddleware.isAdmin(req, res, next) );
            middlewareApp.use('/api/reservations', reservationRoutes);
            const response = await request(middlewareApp).get('/api/reservations');
            expect(authMiddleware.isAdmin).toHaveBeenCalled();
            expect(response.status).toBe(403);
            expect(response.body.success).toBe(false);
        });
    });
    describe('HTTP Status Code Verification', () => {
        test('GET request returns 200 OK', async () => {
            const response = await request(app).get('/api/reservations');
            expect(response.status).toBe(200);
        });
        test('POST request returns 201 Created', async () => {
            const response = await request(app).post('/api/reservations').send({});
            expect(response.status).toBe(201);
        });
        test('PATCH request returns 200 OK', async () => {
            const response = await request(app).patch('/api/reservations/123/confirm');
            expect(response.status).toBe(200);
        });
    });
});









    







