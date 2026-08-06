const { isAuthenticated, isAdmin } = require('../../middlewares/authMiddleware');

describe('Authentication Middleware', () => {
    let req;
    let res;
    let next;
    beforeEach(() => {
        req = { session: { user: { email: 'admin@skyjet.com', role: 'Admin' } } };
        res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        next = jest.fn();
        jest.clearAllMocks();
    });
    describe('isAuthenticated()', () => {
        test('should call next() when the user is authenticated', () => {
            isAuthenticated(req, res, next);
            expect(next).toHaveBeenCalledTimes(1);
            expect(res.status).not.toHaveBeenCalled();
            expect(res.json).not.toHaveBeenCalled();
        });
        test('should return 401 when session is missing', () => {
            req.session = undefined;
            isAuthenticated(req, res, next);
            expect(next).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledTimes(1);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledTimes(1);
            expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Authentication required.' });
        });
        test('should return 401 when user is missing from the session', () => {
            req.session = {};
            isAuthenticated(req, res, next);
            expect(next).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledTimes(1);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Authentication required.' });
        });
        test('should return 401 when user is null', () => {
            req.session.user = null;
            isAuthenticated(req, res, next);
            expect(next).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Authentication required.' });
        });
        test('should return 401 when user is undefined', () => {
            req.session.user = undefined;
            isAuthenticated(req, res, next);
            expect(next).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Authentication required.' });
        });
        test('should return 401 when user is an empty string', () => {
            req.session.user = '';
            isAuthenticated(req, res, next);
            expect(next).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Authentication required.' });
        });
        test('should allow an empty user object because it is truthy', () => {
            req.session.user = {};
            isAuthenticated(req, res, next);
            expect(next).toHaveBeenCalledTimes(1);
            expect(res.status).not.toHaveBeenCalled();
            expect(res.json).not.toHaveBeenCalled();
        });
    });
});
describe('Authorization Middleware', () => {
    let req;
    let res;
    let next;
    beforeEach(() => {
        req = { session: { user: { email: 'admin@skyjet.com', role: 'Admin' } } };
        res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        next = jest.fn();
        jest.clearAllMocks();
    });
    describe('isAdmin()', () => {
        test('should allow administrator access', () => {
            isAdmin(req, res, next);
            expect(next).toHaveBeenCalledTimes(1);
            expect(res.status).not.toHaveBeenCalled();
            expect(res.json).not.toHaveBeenCalled();
        });
        test('should reject User role', () => {
            req.session.user.role = 'User';
            isAdmin(req, res, next);
            expect(next).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledTimes(1);
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Administrator access required.' });
        });
        test('should reject Passenger role', () => {
            req.session.user.role = 'Passenger';
            isAdmin(req, res, next);
            expect(next).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Administrator access required.' });
        });
        test('should reject Manager role', () => {
            req.session.user.role = 'Manager';
            isAdmin(req, res, next);
            expect(next).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Administrator access required.' });
        });
        test('should reject lowercase admin role', () => {
            req.session.user.role = 'admin';
            isAdmin(req, res, next);
            expect(next).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Administrator access required.' });
        });
        test('should return 401 when session is missing', () => {
            req.session = undefined;
            isAdmin(req, res, next);
            expect(next).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledTimes(1);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Authentication required.' });
        });
        test('should return 401 when user is missing', () => {
            req.session = {};
            isAdmin(req, res, next);
            expect(next).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Authentication required.' });
        });
        test('should return 401 when user is null', () => {
            req.session.user = null;
            isAdmin(req, res, next);
            expect(next).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Authentication required.' });
        });
        test('should allow an empty user object to proceed to role validation', () => {
            req.session.user = {};
            isAdmin(req, res, next);
            expect(next).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Administrator access required.' });
        });
    });
});