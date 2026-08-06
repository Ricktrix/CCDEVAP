const mongooes = require('mongoose');
const Flight = require('../../models/Flight');

beforeEach(async () => { await Flight.deleteMany({}); });
afterEach(async () => { jest.clearAllMocks(); });

describe('Flight Model', () => {
    const validFlight = { flightNumber: 'SJ101', airline: 'SkyJet Airlines', aircraftType: 'Airbus A320', origin: 'Manila', destination: 'Cebu', departureDateTime: new Date('2030-01-01T08:00:00Z'), arrivalDateTime: new Date('2030-01-01T10:00:00Z'), ticketPrice: 3500, seatCapacity: 180, seatsAvailable: 180, status: 'Scheduled' };
    test('should create and save a valid flight successfully', async () => {
        const flight = new Flight(validFlight);
        const savedFlight = await flight.save();
        expect(savedFlight._id).toBeDefined();
        expect(savedFlight.flightNumber).toBe('SJ101');
        expect(savedFlight.airline).toBe('SkyJet Airlines');
        expect(savedFlight.aircraftType).toBe('Airbus A320');
        expect(savedFlight.origin).toBe('Manila');
        expect(savedFlight.destination).toBe('Cebu');
        expect(savedFlight.departureDateTime).toBeDefined();
        expect(savedFlight.arrivalDateTime).toBeDefined();
        expect(savedFlight.ticketPrice).toBe(3500);
        expect(savedFlight.seatCapacity).toBe(180);
        expect(savedFlight.seatsAvailable).toBe(180);
        expect(savedFlight.status).toBe('Scheduled');
    });
    describe('Required Fields', () => {
        test('should require flightNumber', async () => {
            const flight = new Flight({ ...validFlight, flightNumber: undefined });
            await expect(flight.save()).rejects.toThrow();
        });
        test('should require airline', async () => {
            const flight = new Flight({ ...validFlight, airline: undefined });
            await expect(flight.save()).rejects.toThrow();
        });
        test('should require origin', async () => {
            const flight = new Flight({ ...validFlight, origin: undefined });
            await expect(flight.save()).rejects.toThrow();
        });
        test('should require destination', async () => {
            const flight = new Flight({ ...validFlight, destination: undefined });
            await expect(flight.save()).rejects.toThrow();
        });
        test('should require departureDateTime', async () => {
            const flight = new Flight({ ...validFlight, departureDateTime: undefined });
            await expect(flight.save()).rejects.toThrow();
        });
        test('should require arrivalDateTime', async () => {
            const flight = new Flight({ ...validFlight, arrivalDateTime: undefined });
            await expect(flight.save()).rejects.toThrow();
        });
        test('should require ticketPrice', async () => {
            const flight = new Flight({ ...validFlight, ticketPrice: undefined });
            await expect(flight.save()).rejects.toThrow();
        });
        test('should require seatCapacity', async () => {
            const flight = new Flight({ ...validFlight, seatCapacity: undefined });
            await expect(flight.save()).rejects.toThrow();
        });
    });
    describe('Flight Number Uniqueness', () => {
        test('should reject duplicate flight numbers', async () => {
            await Flight.create(validFlight);
            const duplicateFlight = new Flight(validFlight);
            await expect(duplicateFlight.save()).rejects.toThrow();
        });
    });
    describe('Flight Number Formatting', () => {
        test('should uppercase and trim flight number', async () => {
            const flight = await Flight.create({ ...validFlight, flightNumber: '  sj202  ' });
            expect(flight.flightNumber).toBe('SJ202');
        });
    });
    describe('Origin and Destination Validation', () => {
        test('should reject identical origin and destination', async () => {
            const flight = new Flight({ ...validFlight, origin: 'Manila', destination: 'Manila' });
            await expect(flight.save()).rejects.toThrow();
        });
    });
    describe('Departure and Arrival Validation', () => {
        test('should reject arrival before departure', async () => {
            const flight = new Flight({ ...validFlight, departureDateTime: new Date('2030-01-01T12:00:00Z'), arrivalDateTime: new Date('2030-01-01T10:00:00Z') });
            await expect(flight.save()).rejects.toThrow();
        });
    });
    describe('Ticket Price Validation', () => {
        test('should reject negative ticket price', async () => {
            const flight = new Flight({ ...validFlight, ticketPrice: -100 });
            await expect(flight.save()).rejects.toThrow();
        });
        test('should reject zero ticket price if validation exists', async () => {
            const flight = new Flight({ ...validFlight, ticketPrice: 0 });
            await expect(flight.save()).rejects.toThrow();
        });
        test('should accept positive ticket price', async () => {
            const flight = await Flight.create(validFlight);
            expect(flight.ticketPrice).toBeGreaterThan(0);
        });
    });
    describe('Seat Capacity Validation', () => {
        test('should reject negative seat capacity', async () => {
            const flight = new Flight({ ...validFlight, seatCapacity: -1 });
            await expect(flight.save()).rejects.toThrow();
        });
        test('should reject zero seat capacity', async () => {
            const flight = new Flight({ ...validFlight, seatCapacity: 0 });
            await expect(flight.save()).rejects.toThrow();
        });
    });
    describe('Seats Available Validation', () => {
        test('should reject seatsAvailable greater than seatCapacity', async () => {
            const flight = new Flight({ ...validFlight, seatsAvailable: 200 });
            await expect(flight.save()).rejects.toThrow();
        });
        test('should reject negative seatsAvailable', async () => {
            const flight = new Flight({ ...validFlight, seatsAvailable: -1 });
            await expect(flight.save()).rejects.toThrow();
        });
    });
    describe('Flight Status', () => {
        test('should assign default status', async () => {
            const flight = await Flight.create({ ...validFlight, flightNumber: 'SJ102', status: undefined });
            expect(flight.status).toBeDefined();
        });
        test.each([ 'Scheduled', 'Delayed', 'Boarding', 'Departed', 'Arrived', 'Cancelled' ])('should accept status %s', async (status) => {
            const flight = await Flight.create({ ...validFlight, flightNumber: `SJ${Math.floor(Math.random() * 900 + 100)}`, status });
            expect(flight.status).toBe(status);
        });
        test('should reject invalid status', async () => {
            const flight = new Flight({ ...validFlight, status: 'Flying' });
            await expect(flight.save()).rejects.toThrow();
        });
    });
    describe('Trimmed String Fields', () => {
        test('should trim string fields', async () => {
            const flight = await Flight.create({ ...validFlight, flightNumber: 'SJ301', airline: '  SkyJet Airlines  ', aircraftType: '  Airbus A320  ', origin: '  Manila  ', destination: '  Cebu  ' });
            expect(flight.airline).toBe('SkyJet Airlines');
            expect(flight.aircraftType).toBe('Airbus A320');
            expect(flight.origin).toBe('Manila');
            expect(flight.destination).toBe('Cebu');
        });
    });
    describe('Timestamps', () => {
        test('should generate createdAt and updatedAt', async () => {
            const flight = await Flight.create(validFlight);
            expect(flight.createdAt).toBeDefined();
            expect(flight.updatedAt).toBeDefined();
        });
    });
    describe('Model Instance', () => {
        test('should be an instance of Flight', async () => {
            const flight = await Flight.create(validFlight);
            expect(flight).toBeInstanceOf(Flight);
            expect(flight instanceof mongoose.Model).toBe(true);
        });
    });
    describe('Updating a Flight', () => {
        test('should update a flight successfully', async () => {
            const flight = await Flight.create(validFlight);
            const originalUpdatedAt = flight.updatedAt;
            flight.ticketPrice = 5000;
            await new Promise(resolve => setTimeout(resolve, 10));
            const updatedFlight = await flight.save();
            expect(updatedFlight.ticketPrice).toBe(5000);
            expect(updatedFlight.updatedAt.getTime()).toBeGreaterThanOrEqual( originalUpdatedAt.getTime() );
        });
    });
    describe('Deleting a Flight', () => {
        test('should delete a flight successfully', async () => {
            const flight = await Flight.create(validFlight);
            await Flight.findByIdAndDelete(flight._id);
            const deletedFlight = await Flight.findById(flight._id);
            expect(deletedFlight).toBeNull();
        });
    });
});