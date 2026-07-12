const crypto = require('crypto');

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

// Pricing Configuration
const PRICING = { TAX_RATE: 0.12, BAGGAGE_RATE_PER_KG: 5, PREMIUM_SEAT_SURCHARGE: 30 };

// Meal Pricing
const MEAL_PRICES = {
    None: 0,
    Standard: 10,
    Vegetarian: 12,
    Vegan: 12,
    Halal: 15,
    Kosher: 15,
    Gluten_Free: 18
};

const SEAT_LOCK_DURATION_MINUTES = 10;
function normalizeString(value){
    if (typeof value !== 'string'){ return ''};
    return value.trim();
}
function normalizeEmail(email){
    return normalizeString(email).toLowerCase();
}
function normalizeSeatNumber(seatNumber){
    return normalizeString(seatNumber).toUpperCase();
}
function normalizePassportNumber(passportNumber){
    return normalizeString(passportNumber).toUpperCase();
}
// Helper functions
function isValidEmail(email){
    const normalizedEmail = normalizeEmail(email);
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(normalizedEmail);
}
function isValidSeatNumber(seatNumber){
    const normalizedSeatNumber = normalizeSeatNumber(seatNumber);
    const seatNumberPattern = /^\d{1,2}[A-Z]$/;
    return seatNumberPattern.test(normalizedSeatNumber);
}
function isNonNegativeNumber(value){
    if (value === null || value === '' || typeof value === 'boolean'){ return false; }
    const number = Number(value);
    return Number.isFinite(number) && number >= 0;
}
function isPositiveInteger(value){
    if (value === null || value === '' || typeof value === 'boolean'){ return false; }
    const number = Number(value);
    return Number.isInteger(number) && number > 0;
}
// Identifier helper
function generateRandomAlphanumeric(length){
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const randomBytes = crypto.randomBytes(length);
    let result = '';
    for (let i = 0; i < length; i++){
        result += chars.charAt(randomBytes[i] % chars.length);
    }
    return result;
}
function generatePNR() {
    const pnr = generateRandomAlphanumeric(6);
    return pnr;
}
function generateReservationNumber(){
    const currentDate = new Date();
    const year = currentDate.getUTCFullYear();
    const month = String(currentDate.getUTCMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getUTCDate()).padStart(2, '0');
    const random = generateRandomAlphanumeric(6);
    return `RSV-${year}${month}${day}-${random}`;
}
// Pricing helper
function roundCurrency(value){
    if (!isNonNegativeNumber(value)){ return 0; }
    const number = Number(value);
    const roundedValue = Math.round((number + Number.EPSILON) * 100) / 100;
    return roundedValue;
}
function calculateTaxes(baseFare){
    if (!isNonNegativeNumber(baseFare)){ return 0; }
    const taxes = Number(baseFare) * PRICING.TAX_RATE;
    return roundCurrency(taxes);
}
function calculateBaggageFee(checkedBaggageKg){
    if (!isNonNegativeNumber(checkedBaggageKg)) { return 0; }
    const baggageFee = Number(checkedBaggageKg) * PRICING.BAGGAGE_RATE_PER_KG;
    return roundCurrency(baggageFee);
}
function calculateMealFee(meal){
    const normalizedMeal = normalizeString(meal);
    if (!Object.prototype.hasOwnProperty.call(MEAL_PRICES, normalizedMeal)){ return 0; }
    return MEAL_PRICES[normalizedMeal];
}
function calculateSeatSelectionFee(seatNumber){
    const normalizedSeatNumber = normalizeSeatNumber(seatNumber);
    if (!isValidSeatNumber(normalizedSeatNumber)){ return 0; }
    const rowNumber = parseInt(normalizedSeatNumber, 10);
    if (rowNumber >= 1 && rowNumber <= 4) { return PRICING.PREMIUM_SEAT_SURCHARGE; }
    return 0;
}
function calculateTotalPrice(pricing){
    if (!pricing || typeof pricing !== 'object'){ pricing = {}; }
    let baseFare = 0;
    let taxes = 0;
    let baggageFee = 0;
    let mealFee = 0;
    let seatSelectionFee = 0;
    let discount = 0;
    if (isNonNegativeNumber(pricing.baseFare)){ baseFare = Number(pricing.baseFare); }
    if (isNonNegativeNumber(pricing.taxes)){ taxes = Number(pricing.taxes); }
    if (isNonNegativeNumber(pricing.baggageFee)){ baggageFee = Number(pricing.baggageFee); }
    if (isNonNegativeNumber(pricing.mealFee)) { mealFee = Number(pricing.mealFee); }
    if (isNonNegativeNumber(pricing.seatSelectionFee)) { seatSelectionFee = Number(pricing.seatSelectionFee); }
    if (isNonNegativeNumber(pricing.discount)){ discount = Number(pricing.discount); }
    let totalPrice = baseFare + taxes + baggageFee + mealFee + seatSelectionFee - discount;
    if (totalPrice < 0){ totalPrice = 0; }
    return roundCurrency(totalPrice);
}
// Seat lock helper
function getSeatLockExpiration(){
    const expirationDate = new Date();
    expirationDate.setMinutes( expirationDate.getMinutes() + SEAT_LOCK_DURATION_MINUTES );
    return expirationDate;
}
function isSeatLockExpired(seatLockExpiresAt){
    if (!seatLockExpiresAt){ return true; }
    const expirationDate = new Date(seatLockExpiresAt);
    if (Number.isNaN(expirationDate.getTime())){ return true; }
    return expirationDate.getTime() <= Date.now();
}
// Pagination helper
function parsePagination(page, limit){
    const parsedPage = parseInt(page, 10);
    const parsedLimit = parseInt(limit, 10);
    let validPage = 1, validLimit = 10;
    if (parsedPage >= 1){ validPage = parsedPage; }
    if (parsedLimit >= 1){ validLimit = parsedLimit; }
    if (validLimit > 100) { validLimit = 100; }
    const skip = (validPage - 1) * validLimit;
    return { page: validPage, limit: validLimit, skip: skip };
}
function calculateTotalPages(totalItems, limit){
    if (!isNonNegativeNumber(totalItems) || !isPositiveInteger(limit)){ return 0; }
    if (Number(totalItems) === 0){ return 0; }
    const totalPages = Math.ceil(Number(totalItems) / Number(limit));
    return totalPages;
}
// Sort Helper
function getSortOrder(order){
    const normalizedOrder = normalizeString(order).toLocaleLowerCase();
    if (normalizedOrder === 'desc'){ return -1; }
    return 1;
}
function sanitizeSortField(sortField, allowedFields, defaultField){
    if (!Array.isArray(allowedFields)){ return defaultField; }
    if (allowedFields.includes(sortField)){ return sortField; }
    return defaultField;
}
// API helper
function createSuccessResponse(message, data = null){
    return { success: true, message: message, data: data };
}
function createErrorResponse(message){
    return { success: false, message: message };
}
module.exports = {
    HTTP_STATUS, PRICING, MEAL_PRICES, SEAT_LOCK_DURATION_MINUTES, normalizeString, normalizeEmail, normalizeSeatNumber, normalizePassportNumber, isValidEmail,
    isValidSeatNumber, isNonNegativeNumber, isPositiveInteger, generatePNR, generateReservationNumber, roundCurrency, calculateTaxes, calculateBaggageFee, calculateMealFee,
    calculateSeatSelectionFee, calculateTotalPrice, getSeatLockExpiration, isSeatLockExpired, parsePagination, calculateTotalPages, getSortOrder, sanitizeSortField, createSuccessResponse,
    createErrorResponse
};