const express = require('express');
const request = require('supertest');

const authRoutes = require('../../routes/authRoutes');
const authController = require('../../controllers/authController');
const authMiddleware = require('../../middlewares/authMiddleware');

jest.mock('../../controllers/authController');
jest.mock('../../middlewares/authMiddleware');

const app = express();
app.use(express.json());
app.use((req, res, next) => {
    req.session = { user: { email: 'john@example.com', role: 'User' } };
    next();
});

app.use('/api/auth', authRoutes);

describe('Authentication Routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        authMiddleware.isAuthenticated.mockImplementation((req, res, next) => next());
        authMiddleware.isAdmin.mockImplementation((req, res, next) => next());
        authController.registerUser.mockImplementation((req, res) => { res.status(201).json({ success: true, message: 'User registered.' });
        });
        authController.loginUser.mockImplementation((req, res) => {
            res.status(200).json({ success: true, message: 'Login successful.' });
        });
        authController.logoutUser.mockImplementation((req, res) => {
            res.status(200).json({ success: true, message: 'Logout successful.' });
        });
        authController.getCurrentUser.mockImplementation((req, res) => {
            res.status(200).json({ success: true, user: req.session.user });
        });
        authController.checkAuthStatus.mockImplementation((req, res) => {
            res.status(200).json({ success: true, authenticated: true });
        });
    });
    describe('POST /register', () => {
        test('should register a new user', async () => {
            const response = await request(app).post('/api/auth/register').send({ firstName: 'John', lastName: 'Doe', email: 'john@example.com', password: 'Password123' });
            expect(response.status).toBe(201);
            expect(authController.registerUser).toHaveBeenCalledTimes(1);
        });
    });
    describe('POST /login', () => {
        test('should login a user', async () => {
            const response = await request(app).post('/api/auth/login').send({ email: 'john@example.com', password: 'Password123' });
            expect(response.status).toBe(200);
            expect(authController.loginUser).toHaveBeenCalledTimes(1);
        });
    });
    describe('POST /logout', () => {
        test('should logout the current user', async () => {
            const response = await request(app).post('/api/auth/logout');
            expect(response.status).toBe(200);
            expect(authController.logoutUser).toHaveBeenCalledTimes(1);
        });
    });
    describe('GET /me', () => {
        test('should return the current authenticated user', async () => {
            const response = await request(app).get('/api/auth/me');
            expect(response.status).toBe(200);
            expect(authController.getCurrentUser).toHaveBeenCalledTimes(1);
        });
    });
    describe('GET /status', () => {
        test('should return authentication status', async () => {
            const response = await request(app).get('/api/auth/status');
            expect(response.status).toBe(200);
            expect(authController.checkAuthStatus).toHaveBeenCalledTimes(1);
        });
    });
    describe('Unauthorized Access', () => {
        test('should return 401 when logout controller returns unauthorized', async () => {
            authController.logoutUser.mockImplementation((req, res) => {
                res.status(401).json({ success: false, message: 'Authentication required.' });
            });
            const response = await request(app).post('/api/auth/logout');
            expect(response.status).toBe(401);
            expect(authController.logoutUser).toHaveBeenCalledTimes(1);
        });
        test('should return 401 when current user controller returns unauthorized', async () => {
            authController.getCurrentUser.mockImplementation((req, res) => {
                res.status(401).json({ success: false, message: 'Authentication required.' });
            });
            const response = await request(app).get('/api/auth/me');
            expect(response.status).toBe(401);
            expect(authController.getCurrentUser).toHaveBeenCalledTimes(1);
        });
    });
    describe('Bad Request', () => {
        test('should return 400 for invalid registration request', async () => {
            authController.registerUser.mockImplementation((req, res) => {
                res.status(400).json({ success: false, message: 'Validation failed.' });
            });
            const response = await request(app).post('/api/auth/register').send({});
            expect(response.status).toBe(400);
            expect(authController.registerUser).toHaveBeenCalledTimes(1);
        });
        test('should return 400 for invalid login request', async () => {
            authController.loginUser.mockImplementation((req, res) => {
                res.status(400).json({ success: false, message: 'Invalid credentials.' });
            });
            const response = await request(app).post('/api/auth/login').send({});
            expect(response.status).toBe(400);
            expect(authController.loginUser).toHaveBeenCalledTimes(1);
        });
    });
    describe('Conflict', () => {
        test('should return 409 when email already exists', async () => {
            authController.registerUser.mockImplementation((req, res) => {
                res.status(409).json({ success: false, message: 'Email already exists.' });
            });
            const response = await request(app).post('/api/auth/register').send({ email: 'john@example.com' });
            expect(response.status).toBe(409);
            expect(authController.registerUser).toHaveBeenCalledTimes(1);
        });
    });
    describe('Internal Server Error', () => {
        test('should return 500 when register controller fails', async () => {
            authController.registerUser.mockImplementation((req, res) => {
                res.status(500).json({ success: false, message: 'Internal server error.' });
            });
            const response = await request(app).post('/api/auth/register');
            expect(response.status).toBe(500);
        });
        test('should return 500 when login controller fails', async () => {
            authController.loginUser.mockImplementation((req, res) => {
                res.status(500).json({ success: false, message: 'Internal server error.' });
            });
            const response = await request(app).post('/api/auth/login');
            expect(response.status).toBe(500);
        });
        test('should return 500 when logout controller fails', async () => {
            authController.logoutUser.mockImplementation((req, res) => {
                res.status(500).json({ success: false, message: 'Internal server error.' });
            });
            const response = await request(app).post('/api/auth/logout');
            expect(response.status).toBe(500);
        });
        test('should return 500 when getCurrentUser controller fails', async () => {
            authController.getCurrentUser.mockImplementation((req, res) => {
                res.status(500).json({ success: false, message: 'Internal server error.' });
            });
            const response = await request(app).get('/api/auth/me');
            expect(response.status).toBe(500);
        });
        test('should return 500 when checkAuthStatus controller fails', async () => {
            authController.checkAuthStatus.mockImplementation((req, res) => {
                res.status(500).json({ success: false, message: 'Internal server error.' });
            });
            const response = await request(app).get('/api/auth/status');
            expect(response.status).toBe(500);
        });
    });
    describe('Invalid Route', () => {
        test('should return 404 for unknown route', async () => {
            const response = await request(app).get('/api/auth/unknown-route');
            expect(response.status).toBe(404);
        });
    });
});