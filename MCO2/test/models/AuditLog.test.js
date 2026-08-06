const mongoose = require('mongoose');
const AuditLog = require('../../models/AuditLog');

beforeEach(async () => { await AuditLog.deleteMany({}); });

afterEach(async () => { jest.clearAllMocks(); });

describe('AuditLog Model', () => {
    const validAuditLog = { username: 'admin', role: 'Admin', activity: 'User Login', ipAddress: '127.0.0.1', requestMethod: 'POST', requestURL: '/login', details: 'Administrator logged into the system.' };
    describe('Successful Audit Log Creation', () => {
        test('should create and save a valid audit log', async () => {
            const auditLog = new AuditLog(validAuditLog);
            const savedAuditLog = await auditLog.save();
            expect(savedAuditLog._id).toBeDefined();
            expect(savedAuditLog.username).toBe('admin');
            expect(savedAuditLog.role).toBe('Admin');
            expect(savedAuditLog.activity).toBe('User Login');
            expect(savedAuditLog.ipAddress).toBe('127.0.0.1');
            expect(savedAuditLog.requestMethod).toBe('POST');
            expect(savedAuditLog.requestURL).toBe('/login');
            expect(savedAuditLog.details).toBe('Administrator logged into the system.');
            expect(savedAuditLog.createdAt).toBeDefined();
        });
    });
    describe('Required Fields', () => {
        test('should require username', async () => {
            const auditLog = new AuditLog({ ...validAuditLog, username: undefined });
            await expect(auditLog.save()).rejects.toThrow();
        });
        test('should require role', async () => {
            const auditLog = new AuditLog({ ...validAuditLog, role: undefined });
            await expect(auditLog.save()).rejects.toThrow();
        });
        test('should require activity', async () => {
            const auditLog = new AuditLog({ ...validAuditLog, activity: undefined });
            await expect(auditLog.save()).rejects.toThrow();
        });
    });
    describe('Username Validation', () => {
        test('should save username correctly', async () => {
            const auditLog = await AuditLog.create(validAuditLog);
            expect(auditLog.username).toBe('admin');
        });
        test('should trim username', async () => {
            const auditLog = await AuditLog.create({ ...validAuditLog, username: '   admin   ' });
            expect(auditLog.username).toBe('admin');
        });
    });
    describe('Role Validation', () => {
        test.each([ 'Admin', 'User' ])('should accept role %s', async (role) => {
            const auditLog = await AuditLog.create({ ...validAuditLog, role });
            expect(auditLog.role).toBe(role);
        });
    });
    describe('Invalid Role', () => {
        test('should reject unsupported role', async () => {
            const auditLog = new AuditLog({ ...validAuditLog, role: 'Passenger' });
            await expect(auditLog.save()).rejects.toThrow();
        });
    });
    describe('Activity Validation', () => {
        const activities = [ 'User Login', 'User Logout', 'User Registration', 'Flight Created', 'Flight Updated', 'Flight Deleted', 'Reservation Created', 'Reservation Confirmed', 'Reservation Cancelled', 'Passenger Check-In', 'Booking Created', 'Booking Cancelled', 'Profile Updated' ];
        test.each(activities)(
            'should store activity %s',
            async (activity) => {
                const auditLog = await AuditLog.create({ ...validAuditLog, activity });
                expect(auditLog.activity).toBe(activity); 
            }
        );
    });
    describe('Description Validation', () => {
        test('should save details correctly', async () => {
            const auditLog = await AuditLog.create(validAuditLog);
            expect(auditLog.details).toBe('Administrator logged into the system.');
        });
        test('should accept long detail strings', async () => {
            const auditLog = await AuditLog.create({ ...validAuditLog, details: 'A'.repeat(1000) });
            expect(auditLog.details.length).toBe(1000);
        });
    });
    describe('Request Information', () => {
        test('should save request metadata', async () => {
            const auditLog = await AuditLog.create(validAuditLog);
            expect(auditLog.ipAddress).toBe('127.0.0.1');
            expect(auditLog.requestMethod).toBe('POST');
            expect(auditLog.requestURL).toBe('/login');
        });
    });
    describe('Timestamp Fields', () => {
        test('should create timestamps automatically', async () => {
            const auditLog = await AuditLog.create(validAuditLog);
            expect(auditLog.createdAt).toBeDefined();
            expect(auditLog.updatedAt).toBeDefined();
        });
    });
    describe('Default Values', () => {
        test('should generate timestamps by default', async () => {
            const auditLog = await AuditLog.create(validAuditLog);
            expect(auditLog.createdAt).toBeDefined();
            expect(auditLog.updatedAt).toBeDefined();
        });
    });
    describe('Trimmed Fields', () => {
        test('should trim username', async () => {
            const auditLog = await AuditLog.create({ ...validAuditLog, username: '  admin  ' });
            expect(auditLog.username).toBe('admin');
        });
        test('should trim activity', async () => {
            const auditLog = await AuditLog.create({ ...validAuditLog, activity: '  User Login  ' });
            expect(auditLog.activity).toBe('User Login');
        });
        test('should trim details', async () => {
            const auditLog = await AuditLog.create({ ...validAuditLog, details: '  Login successful.  ' });
            expect(auditLog.details).toBe('Login successful.');
        });
    });
    describe('Model Instance', () => {
        test('should be an instance of AuditLog', async () => {
            const auditLog = await AuditLog.create(validAuditLog);
            expect(auditLog).toBeInstanceOf(AuditLog);
            expect(auditLog instanceof mongoose.Model).toBe(true);
        });
    });
    describe('Updating Audit Log', () => {
        test('should update an audit log successfully', async () => {
            const auditLog = await AuditLog.create(validAuditLog);
            const originalUpdatedAt = auditLog.updatedAt;
            await new Promise(resolve => setTimeout(resolve, 20));
            auditLog.details = 'Updated log details.';
            await auditLog.save();
            expect(auditLog.details).toBe('Updated log details.');
            expect(auditLog.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
        });
    });
    describe('Index Validation', () => {
        test('should contain schema indexes', () => {
            const indexes = AuditLog.schema.indexes();
            expect(indexes.length).toBeGreaterThan(0);
            const indexKeys = indexes.map(index => JSON.stringify(index[0]) );
            expect( indexKeys.some(index => index.includes('username')) ).toBeTruthy();
            expect( indexKeys.some(index => index.includes('activity')) ).toBeTruthy();
            expect( indexKeys.some(index => index.includes('createdAt')) ).toBeTruthy();
        });
    });
    describe('Sorting', () => {
        test('should sort audit logs by createdAt', async () => {
            await AuditLog.create({ ...validAuditLog, username: 'first' });
            await new Promise(resolve => setTimeout(resolve, 20));
            await AuditLog.create({ ...validAuditLog, username: 'second' });
            const logs = await AuditLog.find().sort({ createdAt: -1 });
            expect(logs[0].username).toBe('second');
            expect(logs[1].username).toBe('first');
        });
    });
    describe('Middleware', () => {
        test('should save audit log successfully without middleware errors', async () => {
            const auditLog = await AuditLog.create(validAuditLog);
            expect(auditLog._id).toBeDefined();
        });
    });
});