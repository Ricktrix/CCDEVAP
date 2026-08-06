const request = require('supertest');
const app = require('../app');
const User = require('../models/User');

describe('User Authentication', () => {
    const validUser = {
        firstName: 'Juan',
        lastName: 'Dela Cruz',
        email: 'juan@example.com',
        password: 'password123',
        confirmPassword: 'password123'
    };

    test('successful registration', async () => {
        const response = await request(app).post('/api/auth/register').send(validUser);

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);

        const savedUser = await User.findOne({ email: validUser.email });
        expect(savedUser).not.toBeNull();
        expect(savedUser.role).toBe('passenger');
    });

    test('successful login', async () => {
        await request(app).post('/api/auth/register').send(validUser);

        const response = await request(app).post('/api/auth/login').send({
            email: validUser.email,
            password: validUser.password
        });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.role).toBe('passenger');
    });

    test('failed login with wrong password', async () => {
        await request(app).post('/api/auth/register').send(validUser);

        const response = await request(app).post('/api/auth/login').send({
            email: validUser.email,
            password: 'wrongPassword123'
        });

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
    });

    test('failed login with unregistered email', async () => {
        const response = await request(app).post('/api/auth/login').send({
            email: 'doesnotexist@example.com',
            password: 'password123'
        });

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
    });
});
