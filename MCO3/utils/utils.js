const crypto = require('crypto');
const Reservation = require('../models/Reservation');

/* ── HTTP Status Codes ── */
const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    INTERNAL_SERVER_ERROR: 500
};

/* ── Pricing Configuration ── */
const PRICING = {
    TAX_RATE: 0.12,
    BAGGAGE_RATE_PER_KG: 5,
    PREMIUM_SEAT_SURCHARGE: 30
};

/* ── Meal Pricing ── */
const MEAL_PRICES = {
    None: 0,
    Standard: 10,
    Vegetarian: 12,
    Vegan: 12,
    Halal: 15,
    Kosher: 15,
    'Gluten-Free': 18
};

const SEAT_LOCK_DURATION_MINUTES = 10;

/* ── String normalizers ── */
function normalizeString(value) {
    if (typeof value !== 'string') { return ''; }
    return value.trim();
}

function normalizeEmail(email) {
    return normalizeString(email).toLowerCase();
}

function normalizeSeatNumber(seatNumber) {
    return normalizeString(seatNumber).toUpperCase();
}

function normalizePassportNumber(passportNumber) {
    return normalizeString(passportNumber).toUpperCase();
}

/* ── Validators ── */
function isValidEmail(email) {
    const normalized = normalizeEmail(email);
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
}

function isValidSeatNumber(seatNumber) {
    const normalized = normalizeSeatNumber(seatNumber);
    return /^\d{1,2}[A-F]$/i.test(normalized);
}

function isNonNegativeNumber(value) {
    if (value === null || value === '' || typeof value === 'boolean') { return false; }
    const number = Number(value);
    return Number.isFinite(number) && number >= 0;
}

function isPositiveInteger(value) {
    if (value === null || value === '' || typeof value === 'boolean') { return false; }
    const number = Number(value);
    return Number.isInteger(number) && number > 0;
}

/* ── Identifier generators ── */
function generateRandomAlphanumeric(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const randomBytes = crypto.randomBytes(length);
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(randomBytes[i] % chars.length);
    }
    return result;
}

function generatePNR() {
    return generateRandomAlphanumeric(6);
}

function generateReservationNumber() {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const day = String(now.getUTCDate()).padStart(2, '0');
    const random = generateRandomAlphanumeric(6);
    return `RSV-${year}${month}${day}-${random}`;
}

/*
 * generateUniquePNR
 * Referenced by bookingController and reservationController.
 * Retries until a PNR not already in the Reservation collection is found.
 */
async function generateUniquePNR(maxAttempts = 10) {
    for (let i = 0; i < maxAttempts; i++) {
        const pnr = generatePNR();
        const existing = await Reservation.findOne({ pnr }).lean();
        if (!existing) { return pnr; }
    }
    throw new Error('Unable to generate unique PNR after maximum attempts.');
}

/*
 * generateUniqueReservationNumber
 * Bug fix: reservationNumber has the same `unique: true` constraint as pnr,
 * but the original code only ever called the plain (non-checked)
 * generateReservationNumber(), so a collision was possible even though a
 * uniqueness-checked generator already existed for the PNR. This mirrors
 * generateUniquePNR for the same reason.
 */
async function generateUniqueReservationNumber(maxAttempts = 10) {
    for (let i = 0; i < maxAttempts; i++) {
        const reservationNumber = generateReservationNumber();
        const existing = await Reservation.findOne({ reservationNumber }).lean();
        if (!existing) { return reservationNumber; }
    }
    throw new Error('Unable to generate unique reservation number after maximum attempts.');
}

/* ── Pricing helpers ── */
function roundCurrency(value) {
    if (!isNonNegativeNumber(value)) { return 0; }
    return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function calculateTaxes(baseFare) {
    if (!isNonNegativeNumber(baseFare)) { return 0; }
    return roundCurrency(Number(baseFare) * PRICING.TAX_RATE);
}

function calculateBaggageFee(checkedBaggageKg) {
    if (!isNonNegativeNumber(checkedBaggageKg)) { return 0; }
    return roundCurrency(Number(checkedBaggageKg) * PRICING.BAGGAGE_RATE_PER_KG);
}

function calculateMealFee(meal) {
    const normalized = normalizeString(meal);
    if (!Object.prototype.hasOwnProperty.call(MEAL_PRICES, normalized)) { return 0; }
    return MEAL_PRICES[normalized];
}

function calculateSeatSelectionFee(seatNumber) {
    const normalized = normalizeSeatNumber(seatNumber);
    if (!isValidSeatNumber(normalized)) { return 0; }
    const rowNumber = parseInt(normalized, 10);
    return (rowNumber >= 1 && rowNumber <= 4) ? PRICING.PREMIUM_SEAT_SURCHARGE : 0;
}

function calculateTotalPrice(pricing) {
    if (!pricing || typeof pricing !== 'object') { pricing = {}; }
    const baseFare = isNonNegativeNumber(pricing.baseFare) ? Number(pricing.baseFare) : 0;
    const taxes = isNonNegativeNumber(pricing.taxes) ? Number(pricing.taxes) : 0;
    const baggageFee = isNonNegativeNumber(pricing.baggageFee) ? Number(pricing.baggageFee) : 0;
    const mealFee = isNonNegativeNumber(pricing.mealFee) ? Number(pricing.mealFee) : 0;
    const seatSelectionFee = isNonNegativeNumber(pricing.seatSelectionFee) ? Number(pricing.seatSelectionFee) : 0;
    const discount = isNonNegativeNumber(pricing.discount) ? Number(pricing.discount) : 0;
    const total = Math.max(0, baseFare + taxes + baggageFee + mealFee + seatSelectionFee - discount);
    return roundCurrency(total);
}

/* ── Seat lock helpers ── */
function getSeatLockExpiration() {
    const exp = new Date();
    exp.setMinutes(exp.getMinutes() + SEAT_LOCK_DURATION_MINUTES);
    return exp;
}

function isSeatLockExpired(seatLockExpiresAt) {
    if (!seatLockExpiresAt) { return true; }
    const exp = new Date(seatLockExpiresAt);
    if (Number.isNaN(exp.getTime())) { return true; }
    return exp.getTime() <= Date.now();
}

/* ── Pagination helpers ── */
function parsePagination(page, limit) {
    const parsedPage = parseInt(page, 10);
    const parsedLimit = parseInt(limit, 10);
    const validPage = parsedPage >= 1 ? parsedPage : 1;
    const validLimit = parsedLimit >= 1 ? Math.min(parsedLimit, 100) : 10;
    return { page: validPage, limit: validLimit, skip: (validPage - 1) * validLimit };
}

function calculateTotalPages(totalItems, limit) {
    if (!isNonNegativeNumber(totalItems) || !isPositiveInteger(limit)) { return 0; }
    if (Number(totalItems) === 0) { return 0; }
    return Math.ceil(Number(totalItems) / Number(limit));
}

/* ── Sort helpers ── */
function getSortOrder(order) {
    return normalizeString(order).toLowerCase() === 'desc' ? -1 : 1;
}

function sanitizeSortField(sortField, allowedFields, defaultField) {
    if (!Array.isArray(allowedFields)) { return defaultField; }
    return allowedFields.includes(sortField) ? sortField : defaultField;
}

/* ── API response helpers ── */
function createSuccessResponse(message, data = null) {
    return { success: true, message, data };
}

function createErrorResponse(message) {
    return { success: false, message };
}

module.exports = {
    HTTP_STATUS,
    PRICING,
    MEAL_PRICES,
    SEAT_LOCK_DURATION_MINUTES,
    normalizeString,
    normalizeEmail,
    normalizeSeatNumber,
    normalizePassportNumber,
    isValidEmail,
    isValidSeatNumber,
    isNonNegativeNumber,
    isPositiveInteger,
    generatePNR,
    generateReservationNumber,
    generateUniquePNR,
    generateUniqueReservationNumber,
    roundCurrency,
    calculateTaxes,
    calculateBaggageFee,
    calculateMealFee,
    calculateSeatSelectionFee,
    calculateTotalPrice,
    getSeatLockExpiration,
    isSeatLockExpired,
    parsePagination,
    calculateTotalPages,
    getSortOrder,
    sanitizeSortField,
    createSuccessResponse,
    createErrorResponse
};
