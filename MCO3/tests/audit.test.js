const request = require('supertest');
const app = require('../app');
const AuditLog = require('../models/AuditLog');
const { loginAsNewUser } = require('./helpers');

describe('Audit Trail', () => {
    test('logs an entry when a user registers', async () => {
        await request(app).post('/api/auth/register').send({
            firstName: 'Ana',
            lastName: 'Lopez',
            email: 'ana.lopez@example.com',
            password: 'password123',
            confirmPassword: 'password123'
        });

        const logs = await AuditLog.find({ activity: 'User Registration' });
        expect(logs.length).toBe(1);
        expect(logs[0].username).toBe('ana.lopez@example.com');
    });

    test('admin can view audit logs, passenger cannot', async () => {
        const admin = await loginAsNewUser({ role: 'admin' });
        const passenger = await loginAsNewUser({ role: 'passenger' });

        const adminResponse = await admin.agent.get('/api/audit-logs');
        expect(adminResponse.status).toBe(200);
        expect(adminResponse.body.success).toBe(true);

        const passengerResponse = await passenger.agent.get('/api/audit-logs');
        expect(passengerResponse.status).toBe(403);
    });
});
