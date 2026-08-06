const { notFound, errorHandler } = require('../../middlewares/errorMiddleware');

describe('notFound Middleware', () => {
    let req;
    let res;
    let next;
    beforeEach(() => {
        req = { method: 'GET', originalUrl: '/unknown-route', orignalUrl: '/unknown-route' };
        res = { status: jest.fn().mockReturnThis(), json: jest.fn(), send: jest.fn(), render: jest.fn(), redirect: jest.fn() };
        next = jest.fn();
        jest.clearAllMocks();
    });
    test('should pass a 404 error to next()', () => {
        notFound(req, res, next);
        expect(next).toHaveBeenCalledTimes(1);
        const error = next.mock.calls[0][0];
        expect(error).toBeInstanceOf(Error);
        expect(error.statusCode).toBe(404);
        expect(error.message).toContain('Route not found');
    });
    test('should include the requested URL in the error message', () => {
        notFound(req, res, next);
        const error = next.mock.calls[0][0];
        expect(error.message).toContain('/unknown-route');
    });
});
describe('errorHandler Middleware', () => {
    let req;
    let res;
    let next;
    let consoleSpy;
    beforeEach(() => {
        req = {};
        res = { statusCode: 200, status: jest.fn().mockReturnThis(), json: jest.fn(), send: jest.fn(), render: jest.fn(), redirect: jest.fn() };
        next = jest.fn();
        consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        jest.clearAllMocks();
    });
    afterEach(() => { consoleSpy.mockRestore(); });
    test('should handle a generic server error', () => {
        const error = new Error('Unexpected error');
        errorHandler(error, req, res, next);
        expect(console.error).toHaveBeenCalledTimes(1);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Internal server error.' });
    });
    test('should preserve an existing 400 status code', () => {
        const error = new Error('Bad request');
        error.statusCode = 400;
        errorHandler(error, req, res, next);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Bad request' });
    });
    test('should preserve an existing 401 status code', () => {
        const error = new Error('Unauthorized');
        error.statusCode = 401;
        errorHandler(error, req, res, next);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Unauthorized' });
    });
    test('should preserve an existing 403 status code', () => {
        const error = new Error('Forbidden');
        error.statusCode = 403;
        errorHandler(error, req, res, next);
        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Forbidden' });
    });
    test('should preserve an existing 404 status code', () => {
        const error = new Error('Route not found');
        error.statusCode = 404;
        errorHandler(error, req, res, next);
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Route not found' });
    });
    test('should preserve an existing 409 status code', () => {
        const error = new Error('Conflict');
        error.statusCode = 409;
        errorHandler(error, req, res, next);
        expect(res.status).toHaveBeenCalledWith(409);
        expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Conflict' });
    });
    test('should handle mongoose validation errors', () => {
        const error = { name: 'ValidationError', errors: { username: { message: 'Username is required.' }, email: { message: 'Email is required.' } } };
        errorHandler(error, req, res, next);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Validation failed.', errors: [ 'Username is required.', 'Email is required.' ] });
    });
    test('should handle mongoose CaseError', () => {
        const error = { name: 'CaseError' };
        errorHandler(error, req, res, next);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Invalid resource identifier.' });
    });
    test('should handle duplicate key errors', () => {
        const error = { code: 11000, keyPattern: { email: 1 } };
        errorHandler(error, req, res, next);
        expect(res.status).toHaveBeenCalledWith(409);
        expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Duplicate value for email.' });
    });
    test('should handle duplicate key errors without keyPattern', () => {
        const error = { code: 11000 };
        errorHandler(error, req, res, next);
        expect(res.status).toHaveBeenCalledWith(409);
        expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Duplicate data already exists.' });
    });
    test('should handle an empty error object', () => {
        errorHandler({}, req, res, next);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Internal server error.' });
    });
    test('should handle a null error', () => {
        expect(() => { errorHandler(null, req, res, next); }).toThrow();
    });
    test('should handle an undefined error', () => {
        expect(() => { errorHandler(undefined, req, res, next); }).toThrow();
    });
    test('should return a custom application error message', () => {
        const error = new Error('Custom application error');
        error.statusCode = 400;
        errorHandler(error, req, res, next);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Custom application error' });
    });
    test('should call console.error for every error', () => {
        const error = new Error('Logging test');
        errorHandler(error, req, res, next);
        expect(console.error).toHaveBeenCalledWith(error);
    });
});