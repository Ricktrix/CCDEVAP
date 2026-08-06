const express = require('express');
const request = require('supertest');

const flightRoutes = require('../../routes/flightRoutes');
const flightController = require('../../controllers/flightController');
const authMiddleware = require('../../middlewares/authMiddleware');

jest.mock('../../controllers/flightController');
jest.mock('../../middlewares/authMiddleware');

const app = express();

app.use(express.json());
app.use('/api/flights', flightRoutes);

describe('Flight Routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        authMiddleware.isAuthenticated.mockImplementation((req, res, next) => next());
        authMiddleware.isAdmin.mockImplementation((req, res, next) => next());
        flightController.getFlights.mockImplementation((req, res) => {
            res.status(200).json({ success: true });
        });
        flightController.searchFlights.mockImplementation((req, res) => {
            res.status(200).json({ success: true });
        });
        flightController.getAvailableFlights.mockImplementation((req, res) => {
            res.status(200).json({ success: true });
        });
        flightController.getFlightsByAirline.mockImplementation((req, res) => {
            res.status(200).json({ success: true });
        });
        flightController.getFlightsByOrigin.mockImplementation((req, res) => {
            res.status(200).json({ success: true });
        });
        flightController.getFlightsByDestination.mockImplementation((req, res) => {
            res.status(200).json({ success: true });
        });
        flightController.getFlightDetails.mockImplementation((req, res) => {
            res.status(200).json({ success: true });
        });
        flightController.getFlightById.mockImplementation((req, res) => {
            res.status(200).json({ success: true });
        });
        flightController.createFlight.mockImplementation((req, res) => {
            res.status(201).json({ success: true });
        });
        flightController.updateFlight.mockImplementation((req, res) => {
            res.status(200).json({ success: true });
        });
        flightController.updateAvailableSeats.mockImplementation((req, res) => {
            res.status(200).json({ success: true });
        });
        flightController.deleteFlight.mockImplementation((req, res) => {
            res.status(200).json({ success: true });
        });
    });

    afterEach(() => { jest.clearAllMocks(); });

    describe('GET /', () => {
        test('should get all flights', async () => {
            const response = await request(app).get('/api/flights');
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(flightController.getFlights).toHaveBeenCalledTimes(1);
        });
    });
    describe('GET /search', () => {
        test('should search flights', async () => {
            const response = await request(app).get('/api/flights/search').query({ origin: 'MNL', destination: 'CEB' });
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(flightController.searchFlights).toHaveBeenCalledTimes(1);
        });
    });
    describe('GET /available', () => {
        test('should retrieve available flights', async () => {
            const response = await request(app).get('/api/flights/available');
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(flightController.getAvailableFlights).toHaveBeenCalledTimes(1);
        });
    });
    describe('GET /airline/:airline', () => {
        test('should get flights by airline', async () => {
            const response = await request(app).get('/api/flights/airline/SkyJet');
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(flightController.getFlightsByAirline).toHaveBeenCalledTimes(1);
        });
    });
    describe('GET /origin/:origin', () => {
        test('should get flights by origin', async () => {
            const response = await request(app).get('/api/flights/origin/MNL');
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(flightController.getFlightsByOrigin).toHaveBeenCalledTimes(1);
        });
    });
    describe('GET /destination/:destination', () => {
        test('should get flights by destination', async () => {
            const response = await request(app).get('/api/flights/destination/CEB');
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(flightController.getFlightsByDestination).toHaveBeenCalledTimes(1);
        });
    });
    describe('GET /:id/details', () => {
        test('should get flight details', async () => {
            const response = await request(app).get('/api/flights/123/details');
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(flightController.getFlightDetails).toHaveBeenCalledTimes(1);
        });
    });
    describe('GET /:id', () => {
        test('should get flight by id', async () => {
            const response = await request(app).get('/api/flights/123');
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(flightController.getFlightById).toHaveBeenCalledTimes(1);
        });
    });
    describe('POST /', () => {
        test('should create a flight', async () => {
            const response = await request(app).post('/api/flights').send({ flightNumber: 'SJ101' });
            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(flightController.createFlight).toHaveBeenCalledTimes(1);
        });
    });
    describe('PUT /:id', () => {
        test('should update a flight', async () => {
            const response = await request(app).put('/api/flights/123').send({ airline: 'SkyJet' });
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(flightController.updateFlight).toHaveBeenCalledTimes(1);
        });
    });
    describe('PATCH /:id/available-seats', () => {
        test('should update available seats', async () => {
            const response = await request(app).patch('/api/flights/123/available-seats').send({ seatsAvailable: 120 });
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(flightController.updateAvailableSeats).toHaveBeenCalledTimes(1);
        });
    });
    describe('DELETE /:id', () => {
        test('should delete a flight', async () => {
            const response = await request(app).delete('/api/flights/123');
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(flightController.deleteFlight).toHaveBeenCalledTimes(1);
        });
    });
    describe('Controller Error Responses', () => {
        test('should return 400', async () => {
            flightController.createFlight.mockImplementation((req, res) => {
                res.status(400).json({ success: false });
            });
            const response = await request(app).post('/api/flights');
            expect(response.status).toBe(400);
        });
        test('should return 401', async () => {
            flightController.createFlight.mockImplementation((req, res) => {
                res.status(401).json({ success: false });
            });
            const response = await request(app).post('/api/flights');
            expect(response.status).toBe(401);
        });
        test('should return 403', async () => {
            flightController.createFlight.mockImplementation((req, res) => {
                res.status(403).json({ success: false });
            });
            const response = await request(app).post('/api/flights');
            expect(response.status).toBe(403);
        });
        test('should return 409', async () => {
            flightController.createFlight.mockImplementation((req, res) => {
                res.status(409).json({ success: false });
            });
            const response = await request(app).post('/api/flights');
            expect(response.status).toBe(409);
        });
        test('should return 500', async () => {
            flightController.createFlight.mockImplementation((req, res) => {
                res.status(500).json({ success: false });
            });
            const response = await request(app).post('/api/flights');
            expect(response.status).toBe(500);
        });
    });
    describe('Invalid Route', () => {
        test('should return 404 for unknown endpoint', async () => {
            const response = await request(app).get('/api/flights/unknown/route');
            expect(response.status).toBe(404);
        });
    });
});