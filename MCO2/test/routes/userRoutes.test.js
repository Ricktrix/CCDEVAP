const express = require('express');
const request = require('supertest');

const userRoutes = require('../../routes/userRoutes');
const userController = require('../../controllers/userController');
const authMiddleware = require('../../middlewares/authMiddleware');

jest.mock('../../controllers/userController', () => ({ getProfile: jest.fn(), updateProfile: jest.fn() }));

jest.mock('../../middlewares/authMiddleware', () => ({ isAuthenticated: jest.fn((req, res, next) => next()), isAdmin: jest.fn((req, res, next) => next()) }));

describe('User Routes', () => {
    let app;
    beforeEach(() => {
        jest.clearAllMocks();
        app = express();
        app.use(express.json());
        app.use('/api/users', userRoutes);
        app.use((req, res) => {
            res.status(404).json({ success: false, message: 'Route not found.' });
        });
        userController.getProfile.mockImplementation((req, res) => {
            res.status(200).json({ success: true, message: 'Profile retrieved successfully.' });
        });
        userController.updateProfile.mockImplementation((req, res) => {
            res.status(200).json({ success: true, message: 'Profile updated successfully.' });
        });
    });
    describe('GET /api/users/profile', () => {
        test('should call getProfile controller', async () => {
            const response = await request(app).get('/api/users/profile');
            expect(response.status).toBe(200);
            expect(userController.getProfile).toHaveBeenCalledTimes(1);
        });
        test('should return the expected response', async () => {
            const response = await request(app).get('/api/users/profile');
            expect(response.body).toEqual({ success: true, message: 'Profile retrieved successfully.' });
        });
    });
    describe('PUT /api/users/profile', () => {
        test('should call updateProfile controller', async () => {
            const response = await request(app).put('/api/users/profile').send({ firstName: 'John', lastName: 'Doe' });
            expect(response.status).toBe(200);
            expect(userController.updateProfile).toHaveBeenCalledTimes(1);
        });
        test('should return the expected response', async () => {
            const response = await request(app).put('/api/users/profile').send({ firstName: 'John' });
            expect(response.body).toEqual({ success: true, message: 'Profile updated successfully.' });
        });
    });
    describe('Invalid Routes', () => {
        test('should return 404 for unknown endpoints', async () => {
            const response = await request(app).get('/api/users/invalid');
            expect(response.status).toBe(404);
            expect(response.body).toEqual({ success: false, message: 'Route not found.' });
        });
    });
    describe('Controller Errors', () => {
        test('should return 500 when getProfile throws an error', async () => {
            userController.getProfile.mockImplementation((req, res) => {
                res.status(500).json({ success: false, message: 'Internal server error.' });
            });
            const response = await request(app).get('/api/users/profile');
            expect(response.status).toBe(500);
            expect(userController.getProfile).toHaveBeenCalledTimes(1);
        });
        test('should return 500 when updateProfile throws an error', async () => {
            userController.updateProfile.mockImplementation((req, res) => {
                res.status(500).json({ success: false, message: 'Internal server error.' });
            });
            const response = await request(app).put('/api/users/profile');
            expect(response.status).toBe(500);
            expect(userController.updateProfile).toHaveBeenCalledTimes(1);
        });
    });
    describe('Middleware', () => {
        test('isAuthenticated middleware is not used in the current routes', () => {
            expect(authMiddleware.isAuthenticated).not.toHaveBeenCalled();
        });
        test('isAdmin middleware is not used in the current routes', () => {
            expect(authMiddleware.isAdmin).not.toHaveBeenCalled();
        });
    });
});