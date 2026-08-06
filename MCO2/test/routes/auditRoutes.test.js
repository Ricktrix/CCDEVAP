const express = require('express');
const request = require('supertest');

const auditRoutes = require('../../routes/auditRoutes');
const auditController = require('../../controllers/auditController');
const authMiddleware = require('../../middlewares/authMiddleware');

jest.mock('../../controllers/auditController', () => ({ getAuditLogs: jest.fn(), renderAuditLogs: jest.fn(), searchAuditLogs: jest.fn(), filterAuditLogs: jest.fn(), getAuditLogsByDate: jest.fn(), getAuditLogById: jest.fn() }));

jest.mock('../../middlewares/authMiddleware', () => ({ isAuthenticated: jest.fn((req, res, next) => next()), isAdmin: jest.fn((req, res, next) => next()) }));

describe('Audit Routes', () => {
    let app;
    beforeEach(() => {
        jest.clearAllMocks();
        app = express();
        app.use(express.json());
        app.use('/api/audit', auditRoutes);
        app.use((req, res) => { res.status(404).json({ success: false, message: 'Route not found.' });
        });
        auditController.getAuditLogs.mockImplementation((req, res) => {
            res.status(200).json({ success: true, message: 'Audit logs retrieved successfully.' });
        });
        auditController.renderAuditLogs.mockImplementation((req, res) => {
            res.status(200).json({ success: true, message: 'Audit logs page rendered.' });
        });
        auditController.searchAuditLogs.mockImplementation((req, res) => {
            res.status(200).json({ success: true, message: 'Audit logs searched successfully.' });
        });
        auditController.filterAuditLogs.mockImplementation((req, res) => {
            res.status(200).json({ success: true, message: 'Audit logs filtered successfully.' });
        });
        auditController.getAuditLogsByDate.mockImplementation((req, res) => {
            res.status(200).json({ success: true, message: 'Audit logs by date retrieved successfully.' });
        });
        auditController.getAuditLogById.mockImplementation((req, res) => {
            res.status(200).json({ success: true, message: 'Audit log retrieved successfully.' });
        });
    });
    describe('GET /api/audit/', () => {
        test('should call authentication middleware', async () => {
            await request(app).get('/api/audit');
            expect(authMiddleware.isAuthenticated).toHaveBeenCalledTimes(1);
        });
        test('should call authorization middleware', async () => {
            await request(app).get('/api/audit');
            expect(authMiddleware.isAdmin).toHaveBeenCalledTimes(1);
        });
        test('should call getAuditLogs controller', async () => {
            const response = await request(app).get('/api/audit');
            expect(response.status).toBe(200);
            expect(auditController.getAuditLogs).toHaveBeenCalledTimes(1);
        });
    });
    describe('GET /api/audit/view', () => {
        test('should call renderAuditLogs controller', async () => {
            const response = await request(app).get('/api/audit/view');
            expect(response.status).toBe(200);
            expect(authMiddleware.isAuthenticated).toHaveBeenCalled();
            expect(authMiddleware.isAdmin).toHaveBeenCalled();
            expect(auditController.renderAuditLogs).toHaveBeenCalledTimes(1);
        });
    });
    describe('GET /api/audit/search', () => {
        test('should call searchAuditLogs controller', async () => {
            const response = await request(app).get('/api/audit/search').query({ username: 'john' });
            expect(response.status).toBe(200);
            expect(auditController.searchAuditLogs).toHaveBeenCalledTimes(1);
        });
    });
    describe('GET /api/audit/filter', () => {
        test('should call filterAuditLogs controller', async () => {
            const response = await request(app).get('/api/audit/filter').query({ role: 'Admin', activity: 'Login' });
            expect(response.status).toBe(200);
            expect(auditController.filterAuditLogs).toHaveBeenCalledTimes(1);
        });
    });
    describe('GET /api/audit/date', () => {
        test('should call getAuditLogsByDate controller', async () => {
            const response = await request(app).get('/api/audit/date').query({ date: '2026-08-06' });
            expect(response.status).toBe(200);
            expect(auditController.getAuditLogsByDate).toHaveBeenCalledTimes(1);
        });
    });
    describe('GET /api/audit/:id', () => {
        test('should call getAuditLogById controller', async () => {
            const response = await request(app).get('/api/audit/123456');
            expect(response.status).toBe(200);
            expect(auditController.getAuditLogById).toHaveBeenCalledTimes(1);
        });
    });
    describe('Authentication', () => {
        test('should return 401 when authentication fails', async () => {
            authMiddleware.isAuthenticated.mockImplementationOnce((req, res) => {
                return res.status(401).json({ success: false, message: 'Authentication required.' });
            });
            const response = await request(app).get('/api/audit');
            expect(response.status).toBe(401);
            expect(auditController.getAuditLogs).not.toHaveBeenCalled();
        });
    });
    describe('Authorization', () => {
        test('should return 403 when authorization fails', async () => {
            authMiddleware.isAdmin.mockImplementationOnce((req, res) => {
                return res.status(403).json({ success: false, message: 'Administrator access required.' });
            });
            const response = await request(app).get('/api/audit');
            expect(response.status).toBe(403);
            expect(auditController.getAuditLogs).not.toHaveBeenCalled();
        });
    });
    describe('Controller Errors', () => {
        test('should return 500 when controller returns an internal server error', async () => {
            auditController.getAuditLogs.mockImplementationOnce((req, res) => {
                res.status(500).json({ success: false, message: 'Internal server error.' });
            });
            const response = await request(app).get('/api/audit');
            expect(response.status).toBe(500);
            expect(auditController.getAuditLogs).toHaveBeenCalledTimes(1);
        });
    });
    describe('Invalid Routes', () => {
        test('should return 404 for unknown endpoints', async () => {
            const response = await request(app).get('/api/audit/unknown/route');
            expect(response.status).toBe(404);
            expect(response.body).toEqual({ success: false, message: 'Route not found.' });
        });
    });
});