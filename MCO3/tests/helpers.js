const request = require('supertest');
const bcrypt = require('bcrypt');
const app = require('../app');
const User = require('../models/User');
const Flight = require('../models/Flight');

// Creates a user directly in the DB (bypassing the register endpoint, since
// register always creates passengers) and returns a logged-in supertest
// agent for that user, so tests can hit protected/admin routes.
async function loginAsNewUser({ role = 'passenger', email } = {}) {
    const hashedPassword = await bcrypt.hash('password123', 10);
    const userEmail = email || `${role}_${Date.now()}_${Math.floor(Math.random() * 100000)}@example.com`;

    await User.create({
        firstName: 'Test',
        lastName: role === 'admin' ? 'Admin' : 'Passenger',
        email: userEmail,
        password: hashedPassword,
        role
    });

    const agent = request.agent(app);
    await agent.post('/api/auth/login').send({ email: userEmail, password: 'password123' });
    return { agent, email: userEmail };
}

// Creates a flight directly in the DB for tests that need one to already exist.
async function createTestFlight(overrides = {}) {
    return Flight.create({
        flightNumber: overrides.flightNumber || `PR${Math.floor(Math.random() * 100000)}`,
        airline: 'Philippine Airlines',
        origin: 'Manila',
        destination: 'Cebu',
        departureDateTime: new Date(Date.now() + 1000 * 60 * 60 * 24), // tomorrow
        arrivalDateTime: new Date(Date.now() + 1000 * 60 * 60 * 26),
        seatCapacity: overrides.seatCapacity ?? 10,
        seatsAvailable: overrides.seatsAvailable ?? 10,
        ticketPrice: overrides.ticketPrice ?? 3500,
        ...overrides
    });
}

module.exports = { loginAsNewUser, createTestFlight };
