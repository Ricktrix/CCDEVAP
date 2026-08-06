const Flight = require('../models/Flight');
const { loginAsNewUser, createTestFlight } = require('./helpers');

describe('Flight Management', () => {
    const newFlightData = {
        flightNumber: 'PR101',
        airline: 'Philippine Airlines',
        origin: 'Manila',
        destination: 'Davao',
        departureDateTime: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
        arrivalDateTime: new Date(Date.now() + 1000 * 60 * 60 * 26).toISOString(),
        availableSeats: 150,
        ticketPrice: 4500
    };

    test('create flight (admin)', async () => {
        const { agent } = await loginAsNewUser({ role: 'admin' });

        const response = await agent.post('/api/flights').send(newFlightData);

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);

        const savedFlight = await Flight.findOne({ flightNumber: 'PR101' });
        expect(savedFlight).not.toBeNull();
        expect(savedFlight.seatsAvailable).toBe(150);
    });

    test('create flight is rejected for a passenger (RBAC)', async () => {
        const { agent } = await loginAsNewUser({ role: 'passenger' });

        const response = await agent.post('/api/flights').send(newFlightData);

        expect(response.status).toBe(403);
        expect(response.body.success).toBe(false);
    });

    test('update flight (admin)', async () => {
        const { agent } = await loginAsNewUser({ role: 'admin' });
        const flight = await createTestFlight();

        const response = await agent.put(`/api/flights/${flight._id}`).send({ ticketPrice: 5000 });

        expect(response.status).toBe(200);
        expect(response.body.data.ticketPrice).toBe(5000);
    });

    test('delete flight (admin)', async () => {
        const { agent } = await loginAsNewUser({ role: 'admin' });
        const flight = await createTestFlight();

        const response = await agent.delete(`/api/flights/${flight._id}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);

        const deletedFlight = await Flight.findById(flight._id);
        expect(deletedFlight).toBeNull();
    });
});
