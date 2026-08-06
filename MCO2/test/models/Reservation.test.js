const mongoose = require('mongoose');
const Reservation = require('../../models/Reservation');
const Flights = require('../../models/Flight');
const User = require('../../models/User');

beforeEach(async () => { await Reservation.deleteMany({}); await User.deleteMany({}); await Flight.deleteMany({}); });

afterEach(async () => { jest.clearAllMocks(); });

describe('Reservation Model', () => {
    let user;
    let flight;
    beforeEach(async () => {
        user = await User.create({ firstName: 'John', lastName: 'Doe', email: 'john@example.com', password: 'Password123!' });
        flight = await Flight.create({ flightNumber: 'SJ101', airline: 'SkyJet Airlines', aircraftType: 'Airbus A320', origin: 'Manila', destination: 'Cebu', departureDateTime: new Date('2030-01-01T08:00:00Z'), arrivalDateTime: new Date('2030-01-01T10:00:00Z'), ticketPrice: 5000, seatCapacity: 180, seatsAvailable: 180, status: 'Scheduled' });
    });
    const createReservationData = () => ({
        user: user._id,
        flight: flight._id,
        reservationNumber: 'RSV000001',
        pnr: 'ABC123',
        passengerName: 'John Doe',
        email: 'john@example.com',
        passportNumber: 'P1234567',
        seat: { code: '12A', isPremium: false },
        travelClass: 'Economy',
        meal: { label: 'Standard', price: 150 },
        baggage: { checkedBaggageKg: 20, cabinBaggageKg: 7 },
        bill: { baseFare: 5000, taxes: 600, discount: 0, total: 0 },
        billing: { paymentMethod: 'GCash' }
    });
    describe('Successful Reservation Creation', () => {
        test('should create and save a valid reservation', async () => {
            const reservation = new Reservation(createReservationData());
            const savedReservation = await reservation.save();
            expect(savedReservation._id).toBeDefined();
            expect(savedReservation.reservationNumber).toBe('RSV000001');
            expect(savedReservation.pnr).toBe('ABC123');
            expect(savedReservation.user.toString()).toBe(user._id.toString());
            expect(savedReservation.flight.toString()).toBe(flight._id.toString());
            expect(savedReservation.passengerName).toBe('John Doe');
            expect(savedReservation.bookingStatus).toBe('Pending');
            expect(savedReservation.billing.paymentStatus).toBe('Pending');
            expect(savedReservation.seat.code).toBe('12A');
            expect(savedReservation.bill.total).toBeDefined();
        });
    });
    describe('Required Fields', () => {
        test('should require user', async () => {
            const reservation = new Reservation({ ...createReservationData(), user: undefined });
            await expect(reservation.save()).rejects.toThrow();
        });
        test('should require flight', async () => {
            const reservation = new Reservation({ ...createReservationData(), flight: undefined });
            await expect(reservation.save()).rejects.toThrow();
        });
        test('should require reservationNumber', async () => {
            const reservation = new Reservation({ ...createReservationData(), reservationNumber: undefined });
            await expect(reservation.save()).rejects.toThrow();
        });
        test('should require pnr', async () => {
            const reservation = new Reservation({ ...createReservationData(), pnr: undefined });
            await expect(reservation.save()).rejects.toThrow();
        });
        test('should require passengerName', async () => {
            const reservation = new Reservation({ ...createReservationData(), passengerName: undefined });
            await expect(reservation.save()).rejects.toThrow();
        });
        test('should require email', async () => {
            const reservation = new Reservation({ ...createReservationData(), email: undefined });
            await expect(reservation.save()).rejects.toThrow();
        });
        test('should require passportNumber', async () => {
            const reservation = new Reservation({ ...createReservationData(), passportNumber: undefined });
            await expect(reservation.save()).rejects.toThrow();
        });
    });
    describe('Unique Reservation Number', () => {
        test('should reject duplicate reservation numbers', async () => {
            await Reservation.create(createReservationData());
            const duplicateReservation = new Reservation({ ...createReservationData(), pnr: 'XYZ123' });
            await expect( duplicateReservation.save() ).rejects.toThrow();
        });
    });
    describe('Unique PNR', () => {
        test('should reject duplicate PNR values', async () => {
            await Reservation.create(createReservationData());
            const duplicateReservation = new Reservation({ ...createReservationData(), reservationNumber: 'RSV000002' });
            await expect( duplicateReservation.save() ).rejects.toThrow();
        });
    });
    describe('Booking Status Validation', () => {
        const validStatuses = [ 'Pending', 'Confirmed', 'Checked-In', 'Completed', 'Cancelled','Refunded' ];
        test.each(validStatuses)(
            'should accept booking status %s',
            async (status) => {
                const reservation = await Reservation.create({ ...createReservationData(), reservationNumber: `RSV${Date.now()}${Math.floor(Math.random() * 100)}`, pnr: Math.random().toString(36).substring(2, 8).toUpperCase(), bookingStatus: status });
                expect(reservation.bookingStatus).toBe(status);
            }
        );
    });
    describe('Invalid Booking Status', () => {
        test('should reject invalid booking status', async () => {
            const reservation = new Reservation({ ...createReservationData(), bookingStatus: 'Boarding' });
            await expect( reservation.save() ).rejects.toThrow();
        });
    });
    describe('Payment Status Validation', () => {
        const validPaymentStatuses = [ 'Pending', 'Paid', 'Refunding', 'Cancelled' ];
        test.each(validPaymentStatuses)(
            'should accept payment status %s',
            async (status) => {
                const reservation = await Reservation.create({ ...createReservationData(), reservationNumber: `RSV${Date.now()}${Math.floor(Math.random() * 100)}`, pnr: Math.random().toString(36).substring(2, 8).toUpperCase(), billing: { paymentMethod: 'GCash', paymentStatus: status } });
                expect(reservation.billing.paymentStatus).toBe(status); }
        );
    });
    describe('Invalid Payment Status', () => {
        test('should reject invalid payment status', async () => {
            const reservation = new Reservation({ ...createReservationData(), billing: { paymentMethod: 'GCash', paymentStatus: 'Failed' } });
            await expect( reservation.save() ).rejects.toThrow();
        });
    });
    describe('Pricing Validation', () => {
        test('should calculate total price correctly using pre-save middleware', async () => {
            const reservation = await Reservation.create({ ...createReservationData(), meal: { label: 'Standard', price: 150 }, baggage: { checkedBaggageKg: 20, cabinBaggageKg: 7 }, bill: { baseFare: 5000, taxes: 600, discount: 100, total: 0 } });
            expect(reservation.bill.seatFee).toBe(0);
            expect(reservation.bill.mealFee).toBe(150);
            expect(reservation.bill.baggageFee).toBe(100);
            expect(reservation.bill.total).toBe( 5000 + 600 + 0 + 150 + 100 - 100 );
        });
        test('should apply premium seat surcharge', async () => {
            const reservation = await Reservation.create({ ...createReservationData(), reservationNumber: 'RSV000010', pnr: 'PRE123', seat: { code: '1A', isPremium: true } });
            expect(reservation.bill.seatFee).toBe(30);
        });
        test('should reject negative base fare', async () => {
            const reservation = new Reservation({ ...createReservationData(), bill: { baseFare: -1, taxes: 500, discount: 0, total: 0 } });
            await expect( reservation.save() ).rejects.toThrow();
        });
        test('should reject negative taxes', async () => {
            const reservation = new Reservation({ ...createReservationData(), bill: { baseFare: 5000, taxes: -50, discount: 0, total: 0 } });
            await expect( reservation.save() ).rejects.toThrow();
        });
    });
    describe('Billing Information', () => {
        test('should save billing information correctly', async () => {
            const reservation = await Reservation.create({ ...createReservationData(), billing: { paymentMethod: 'Credit Card', paymentStatus: 'Paid', transactionId: 'TXN123456', paymentDate: new Date() } });
            expect(reservation.billing.paymentMethod).toBe('Credit Card');
            expect(reservation.billing.paymentStatus).toBe('Paid');
            expect(reservation.billing.transactionId).toBe('TXN123456');
            expect(reservation.billing.paymentDate).toBeDefined();
        });
        test('should require payment method', async () => {
            const reservation = new Reservation({ ...createReservationData(), billing: {} });
            await expect( reservation.save() ).rejects.toThrow();
        });
    });
    describe('Baggage Information', () => {
        test('should accept valid baggage weight', async () => {
            const reservation = await Reservation.create({ ...createReservationData(), baggage: { checkedBaggageKg: 30, cabinBaggageKg: 7 } });
            expect(reservation.baggage.checkedBaggageKg).toBe(30);
        });
        test('should reject negative baggage weight', async () => {
            const reservation = new Reservation({ ...createReservationData(), baggage: { checkedBaggageKg: -5, cabinBaggageKg: 7 } });
            await expect( reservation.save() ).rejects.toThrow();
        });
        test('should calculate baggage fee correctly', async () => {
            const reservation = await Reservation.create({ ...createReservationData(), baggage: { checkedBaggageKg: 25, cabinBaggageKg: 7 } });
            expect(reservation.bill.baggageFee).toBe(125);
        });
    });
    describe('Meal Selection', () => {
        const validMeals = [ 'None', 'Standard', 'Vegetarian', 'Vegan', 'Halal', 'Kosher', 'Gluten-Free' ];
        test.each(validMeals)(
            'should accept meal %s',
            async (meal) => {
                const reservation = await Reservation.create({ ...createReservationData(), reservationNumber: `RSV${Date.now()}${Math.floor(Math.random() * 10)}`, pnr: Math.random().toString(36).substring(2, 8).toUpperCase(), meal: { label: meal, price: 100 } });
                expect(reservation.meal.label).toBe(meal);
            }
        );
        test('should reject invalid meal selection', async () => {
            const reservation = new Reservation({ ...createReservationData(), meal: { label: 'Seafood', price: 100 } });
            await expect( reservation.save() ).rejects.toThrow();
        });
    });
    describe('Reservation Pricing', () => {
        test('should calculate premium seat fee', async () => {
            const reservation = await Reservation.create({ ...createReservationData(), reservationNumber: 'RSV000020', pnr: 'PRE456', seat: { code: '2A', isPremium: true } });
            expect(reservation.bill.seatFee).toBe(30);
        });
        test('should calculate meal fee', async () => {
            const reservation = await Reservation.create({ ...createReservationData(), reservationNumber: 'RSV000021', pnr: 'MEA123', meal: { label: 'Vegetarian', price: 250 } });
            expect(reservation.bill.mealFee).toBe(250);
        });
        test('should calculate baggage fee', async () => {
            const reservation = await Reservation.create({ ...createReservationData(), reservationNumber: 'RSV000022', pnr: 'BAG123', baggage: { checkedBaggageKg: 15, cabinBaggageKg: 7 } });
            expect(reservation.bill.baggageFee).toBe(75);
        });
    });
    describe('Passenger Information', () => {
        test('should store passenger information correctly', async () => {
            const reservation = await Reservation.create({ ...createReservationData() });
            expect(reservation.passengerName).toBe('John Doe');
            expect(reservation.email).toBe('john@example.com');
            expect(reservation.passportNumber).toBe('P1234567');
        });
        test('should convert email to lowercase', async () => {
            const reservation = await Reservation.create({ ...createReservationData(), reservationNumber: 'RSV000030', pnr: 'LOW123', email: 'JOHN@EXAMPLE.COM' });
            expect(reservation.email).toBe('john@example.com');
        });
    });
    describe('Default Values', () => {
        test('should assign default values automatically', async () => {
            const reservation = await Reservation.create({ user: user._id, flight: flight._id, reservationNumber: 'RSV000040', pnr: 'DEF123', passengerName: 'John Doe', email: 'john@example.com', passportNumber: 'P1234567', seat: { code: '15A' }, bill: { baseFare: 5000, total: 0 }, billing: { paymentMethod: 'GCash' } });
            expect(reservation.travelClass).toBe('Economy');
            expect(reservation.meal.label).toBe('None');
            expect(reservation.baggage.checkedBaggageKg).toBe(0);
            expect(reservation.baggage.cabinBaggageKg).toBe(7);
            expect(reservation.bookingStatus).toBe('Pending');
            expect(reservation.billing.paymentStatus).toBe('Pending');
            expect(reservation.checkedIn).toBe(false);
            expect(reservation.seatLocked).toBe(false);
        });
    });
    describe('Timestamp Fields', () => {
        test('should automatically generate timestamps', async () => {
            const reservation = await Reservation.create( createReservationData() );
            expect(reservation.createdAt).toBeDefined();
            expect(reservation.updatedAt).toBeDefined();
        });
    });
    describe('Seat Locking', () => {
        test('should save seat information correctly', async () => {
            const reservation = await Reservation.create( createReservationData() );
            expect(reservation.seat.code).toBe('12A');
            expect(reservation.seat.isPremium).toBe(false);
            expect(reservation.seatLocked).toBe(false);
        });
        test('should enforce unique seat per flight', async () => {
            await Reservation.create(createReservationData());
            const duplicateSeat = new Reservation({ ...createReservationData(), reservationNumber: 'RSV000050', pnr: 'SEA123' });
            await expect( duplicateSeat.save() ).rejects.toThrow();
        });
        test('should allow the same seat on different flights', async () => {
            const secondFlight = await Flight.create({ flightNumber: 'SJ202', airline: 'SkyJet Airlines', aircraftType: 'Airbus A321', origin: 'Cebu', destination: 'Davao', departureDateTime: new Date('2030-02-01T08:00:00Z'), arrivalDateTime: new Date('2030-02-01T10:00:00Z'), ticketPrice: 4500, seatCapacity: 180, seatsAvailable: 180, status: 'Scheduled' });
            await Reservation.create(createReservationData());
            const reservation = await Reservation.create({ ...createReservationData(), reservationNumber: 'RSV000051', pnr: 'SEA124', flight: secondFlight._id });
            expect(reservation.flight.toString()).toBe(secondFlight._id.toString());
        });
    });
    describe('Check-In', () => {
        test('should have default check-in status', async () => {
            const reservation = await Reservation.create( createReservationData() );
            expect(reservation.checkedIn).toBe(false);
            expect(reservation.checkedInTime).toBeUndefined();
        });
        test('should update check-in successfully', async () => {
            const reservation = await Reservation.create( createReservationData() );
            reservation.checkedIn = true;
            reservation.checkedInTime = new Date();
            await reservation.save();
            expect(reservation.checkedIn).toBe(true);
            expect(reservation.checkedInTime).toBeDefined();
        });
    });
    describe('References', () => {
        test('should reference a User document', async () => {
            const reservation = await Reservation.create( createReservationData() );
            const populatedReservation = await Reservation.findById(reservation._id).populate('user');
            expect(populatedReservation.user).toBeDefined();
            expect(populatedReservation.user.email).toBe('john@example.com');
        });
        test('should reference a Flight document', async () => {
            const reservation = await Reservation.create( createReservationData() );
            const populatedReservation = await Reservation.findById(reservation._id).populate('flight');
            expect(populatedReservation.flight).toBeDefined();
            expect(populatedReservation.flight.flightNumber).toBe('SJ101');
        });
    });
    describe('Model Instance', () => {
        test('should be an instance of Reservation', async () => {
            const reservation = await Reservation.create( createReservationData() );
            expect(reservation).toBeInstanceOf(Reservation);
            expect(reservation instanceof mongoose.Model).toBe(true);
        });
    });
    describe('Updating Reservation', () => {
        test('should update reservation successfully', async () => {
            const reservation = await Reservation.create( createReservationData() );
            const originalUpdatedAt = reservation.updatedAt;
            await new Promise(resolve => setTimeout(resolve, 20));
            reservation.passengerName = 'Jane Doe';
            await reservation.save();
            expect(reservation.passengerName).toBe('Jane Doe');
            expect(reservation.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
        });
    });
    describe('Cancelling Reservation', () => {
        test('should cancel reservation successfully', async () => {
            const reservation = await Reservation.create( createReservationData() );
            reservation.bookingStatus = 'Cancelled';
            reservation.cancelledAt = new Date();
            reservation.cancellationReason = 'Passenger request';
            await reservation.save();
            expect(reservation.bookingStatus).toBe('Cancelled');
            expect(reservation.cancelledAt).toBeDefined();
            expect(reservation.cancellationReason).toBe('Passenger request');
        });
    });
    describe('Payment Update', () => {
        test('should update payment status successfully', async () => {
            const reservation = await Reservation.create( createReservationData() );
            reservation.billing.paymentStatus = 'Paid';
            reservation.billing.transactionId = 'TXN999999';
            reservation.billing.paymentDate = new Date();
            await reservation.save();
            expect(reservation.billing.paymentStatus).toBe('Paid');
            expect(reservation.billing.transactionId).toBe('TXN999999');
            expect(reservation.billing.paymentDate).toBeDefined();
        });
    });
    describe('Index Validation', () => {
        test('should contain indexes defined by the schema', () => {
            const indexes = Reservation.schema.indexes();
            expect(indexes.length).toBeGreaterThan(0);
            const indexNames = indexes.map(index => JSON.stringify(index[0]) );
            expect( indexNames.some(index => index.includes('reservationNumber')) ).toBeTruthy();
            expect( indexNames.some(index => index.includes('pnr')) ).toBeTruthy();
            expect( indexNames.some(index => index.includes('user')) ).toBeTruthy();
            expect( indexNames.some(index => index.includes('flight')) ).toBeTruthy();
            expect( indexNames.some(index => index.includes('seat.code')) ).toBeTruthy();
        });
    });
    describe('Middleware', () => {
        test('should calculate all billing fields before saving', async () => {
            const reservation = await Reservation.create({ ...createReservationData(), reservationNumber: 'RSV000060', pnr: 'MID123', seat: { code: '1A', isPremium: true }, meal: { label: 'Halal', price: 200 }, baggage: { checkedBaggageKg: 10, cabinBaggageKg: 7 }, bill: { baseFare: 6000, taxes: 720, discount: 100, total: 0 } });
            expect(reservation.bill.seatFee).toBe(30);
            expect(reservation.bill.mealFee).toBe(200);
            expect(reservation.bill.baggageFee).toBe(50);
            expect(reservation.bill.total).toBe( 6000 + 720 + 30 + 200 + 50 - 100 );
        });
        test('should convert reservation number and PNR to uppercase', async () => {
            const reservation = await Reservation.create({ ...createReservationData(), reservationNumber: 'rsv000061', pnr: 'abc999' });
            expect(reservation.reservationNumber).toBe('RSV000061');
            expect(reservation.pnr).toBe('ABC999');
        });
        test('should trim passenger and passport values', async () => {
            const reservation = await Reservation.create({ ...createReservationData(), reservationNumber: 'RSV000062', pnr: 'TRM123', passengerName: '  John Doe  ', passportNumber: '  p1234567  ' });
            expect(reservation.passengerName).toBe('John Doe');
            expect(reservation.passportNumber).toBe('P1234567');
        });
    });
});
