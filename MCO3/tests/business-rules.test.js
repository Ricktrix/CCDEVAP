const { loginAsNewUser, createTestFlight } = require('./helpers');

describe('Business Rule Validation', () => {
    const buildPassengerDetails = (overrides = {}) => ({
        firstName: 'Pedro',
        lastName: 'Reyes',
        email: 'pedro.reyes@example.com',
        passport: 'P7654321',
        seat: '6B',
        mealOption: { label: 'None', price: 0 },
        baggage: 0,
        ...overrides
    });

    test('booking a flight with no available seats is rejected', async () => {
        const { agent } = await loginAsNewUser({ role: 'passenger' });
        const flight = await createTestFlight({ seatCapacity: 1, seatsAvailable: 0 });

        const response = await agent.post('/api/reservations').send({ ...buildPassengerDetails(), flightId: flight._id });

        expect(response.status).toBe(409);
        expect(response.body.success).toBe(false);
    });

    test('selecting an already-occupied seat is rejected', async () => {
        const firstPassenger = await loginAsNewUser({ role: 'passenger' });
        const secondPassenger = await loginAsNewUser({ role: 'passenger' });
        const flight = await createTestFlight();

        const firstResponse = await firstPassenger.agent
            .post('/api/reservations')
            .send({ ...buildPassengerDetails(), seat: '7C', flightId: flight._id });
        expect(firstResponse.status).toBe(201);

        const secondResponse = await secondPassenger.agent
            .post('/api/reservations')
            .send({ ...buildPassengerDetails({ email: 'someone.else@example.com', passport: 'P1112223' }), seat: '7C', flightId: flight._id });

        expect(secondResponse.status).toBe(409);
        expect(secondResponse.body.success).toBe(false);
    });

    test('successful booking on a flight with available seats', async () => {
        const { agent } = await loginAsNewUser({ role: 'passenger' });
        const flight = await createTestFlight({ seatCapacity: 5, seatsAvailable: 5 });

        const response = await agent.post('/api/reservations').send({ ...buildPassengerDetails(), flightId: flight._id });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
    });
});
