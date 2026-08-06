const Reservation = require('../models/Reservation');
const { loginAsNewUser, createTestFlight } = require('./helpers');

describe('Reservation Management', () => {
    const passengerDetails = {
        firstName: 'Maria',
        lastName: 'Santos',
        email: 'maria.santos@example.com',
        passport: 'P1234567',
        seat: '5A',
        mealOption: { label: 'Standard', price: 10 },
        baggage: 20
    };

    test('create reservation', async () => {
        const { agent } = await loginAsNewUser({ role: 'passenger' });
        const flight = await createTestFlight();

        const response = await agent.post('/api/reservations').send({ ...passengerDetails, flightId: flight._id });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.reservation.bookingStatus).toBe('Pending');
        expect(response.body.reservation.reservationNumber).toBeTruthy();
        expect(response.body.reservation.pnr).toBeTruthy();

        // The seat should now be taken off the flight's available count.
        const updatedFlight = await flight.constructor.findById(flight._id);
        expect(updatedFlight.seatsAvailable).toBe(flight.seatsAvailable - 1);
    });

    test('cancel reservation', async () => {
        const { agent } = await loginAsNewUser({ role: 'passenger' });
        const flight = await createTestFlight();

        const createResponse = await agent.post('/api/reservations').send({ ...passengerDetails, flightId: flight._id });
        const reservationId = createResponse.body.reservation._id;

        const cancelResponse = await agent.patch(`/api/reservations/${reservationId}/cancel`);

        expect(cancelResponse.status).toBe(200);
        expect(cancelResponse.body.reservation.bookingStatus).toBe('Cancelled');

        const savedReservation = await Reservation.findById(reservationId);
        expect(savedReservation.bookingStatus).toBe('Cancelled');

        // Cancelling should give the seat back.
        const updatedFlight = await flight.constructor.findById(flight._id);
        expect(updatedFlight.seatsAvailable).toBe(flight.seatsAvailable);
    });

    test('a passenger cannot view another passenger\'s reservation', async () => {
        const owner = await loginAsNewUser({ role: 'passenger' });
        const otherPassenger = await loginAsNewUser({ role: 'passenger' });
        const flight = await createTestFlight();

        const createResponse = await owner.agent.post('/api/reservations').send({ ...passengerDetails, flightId: flight._id });
        const reservationId = createResponse.body.reservation._id;

        const viewResponse = await otherPassenger.agent.get(`/api/reservations/${reservationId}`);
        expect(viewResponse.status).toBe(403);

        const cancelResponse = await otherPassenger.agent.patch(`/api/reservations/${reservationId}/cancel`);
        expect(cancelResponse.status).toBe(403);
    });

    test('an admin can view and cancel any reservation', async () => {
        const owner = await loginAsNewUser({ role: 'passenger' });
        const admin = await loginAsNewUser({ role: 'admin' });
        const flight = await createTestFlight();

        const createResponse = await owner.agent.post('/api/reservations').send({ ...passengerDetails, flightId: flight._id });
        const reservationId = createResponse.body.reservation._id;

        const viewResponse = await admin.agent.get(`/api/reservations/${reservationId}`);
        expect(viewResponse.status).toBe(200);

        const cancelResponse = await admin.agent.patch(`/api/reservations/${reservationId}/cancel`);
        expect(cancelResponse.status).toBe(200);
    });
});
