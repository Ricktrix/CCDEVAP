const mongoose = require('mongoose');

const PRICING = {
    PREMIUM_SEAT_SURCHARGE: 30,
    BAGGAGE_RATE_PER_KG: 5,
    TAX_RATE: 0.12
};

const reservationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    flight: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Flight',
        required: true,
        index: true
    },
    reservationNumber: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        uppercase: true,
        immutable: true
    },
    pnr: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        uppercase: true,
        minlength: 6,
        maxlength: 6,
        immutable: true
    },
    passengerName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        // Bug fix: original regex ended in `)?`, which makes the whole
        // pattern optional and matches an empty string. Using the same
        // simple pattern the User model already uses.
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email address.']
    },
    passportNumber: {
        type: String,
        required: true,
        trim: true,
        uppercase: true
    },
    seat: {
        code: {
            type: String,
            required: true,
            uppercase: true,
            trim: true
        },
        isPremium: {
            type: Boolean,
            default: false
        }
    },
    travelClass: {
        type: String,
        enum: ['Economy', 'Premium Economy', 'Business', 'First Class'],
        default: 'Economy'
    },
    meal: {
        label: {
            type: String,
            enum: ['None', 'Standard', 'Vegetarian', 'Vegan', 'Halal', 'Kosher', 'Gluten-Free'],
            default: 'None'
        },
        price: { type: Number, default: 0, min: 0 }
    },
    baggage: {
        checkedBaggageKg: { type: Number, default: 0, min: 0 },
        cabinBaggageKg: { type: Number, default: 7, min: 0 }
    },
    bill: {
        baseFare: { type: Number, required: true, min: 0 },
        taxes: { type: Number, default: 0, min: 0 },
        seatFee: { type: Number, default: 0 },
        mealFee: { type: Number, default: 0 },
        baggageFee: { type: Number, default: 0 },
        discount: { type: Number, default: 0 },
        total: { type: Number, required: true, min: 0 }
    },
    billing: {
        // Bug fix: this was `required: true`, but payment happens as a
        // separate step after the reservation is created (there's no
        // paymentMethod field anywhere on the booking form), so a
        // reservation could never actually be saved.
        paymentMethod: {
            type: String,
            enum: ['Credit Card', 'Debit Card', 'GCash', 'Maya', 'Bank Transfer']
        },
        paymentStatus: {
            type: String,
            enum: ['Pending', 'Paid', 'Refunding', 'Cancelled'],
            default: 'Pending'
        },
        transactionId: { type: String, trim: true },
        paymentDate: Date
    },
    bookingStatus: {
        type: String,
        enum: ['Pending', 'Confirmed', 'Checked-In', 'Completed', 'Cancelled', 'Refunded'],
        default: 'Pending'
    },
    seatLocked: { type: Boolean, default: false },
    seatLockedExpiresAt: Date,
    checkedIn: { type: Boolean, default: false },
    checkedInTime: Date,
    cancelledAt: Date,
    cancellationReason: { type: String, trim: true }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Bug fix: this has to be pre('validate'), not pre('save') - Mongoose runs
// schema validation BEFORE 'save' hooks fire, and bill.total is required,
// so calculating it in a pre('save') hook is too late and validation
// would always fail first.
reservationSchema.pre('validate', function () {
    this.meal.price = Number(this.meal.price) || 0;
    this.baggage.checkedBaggageKg = Number(this.baggage.checkedBaggageKg) || 0;

    this.bill.seatFee = this.seat.isPremium ? PRICING.PREMIUM_SEAT_SURCHARGE : 0;
    this.bill.mealFee = this.meal.price;
    this.bill.baggageFee = this.baggage.checkedBaggageKg * PRICING.BAGGAGE_RATE_PER_KG;

    this.bill.total =
        this.bill.baseFare +
        this.bill.taxes +
        this.bill.seatFee +
        this.bill.mealFee +
        this.bill.baggageFee -
        this.bill.discount;
});

// A seat can only be booked once per flight (cancelled reservations free it up).
reservationSchema.index(
    { flight: 1, 'seat.code': 1 },
    {
        unique: true,
        partialFilterExpression: {
            bookingStatus: { $ne: 'Cancelled' }
        }
    }
);

module.exports = mongoose.model('Reservation', reservationSchema);
