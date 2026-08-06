const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { isAuthenticated } = require('../middlewares/authMiddleware');

// User Registration
router.post('/register', (req, res, next) => {
    console.log('POST /register request received.');
    AuthController.registerUser(req, res, next);
});

// User login
router.post('/login', (req, res, next) => {
    console.log('POST /login request received.');
    console.log('Login attempt for email:', req.body.email);
    AuthController.loginUser(req, res, next);
});

// User logout
router.post('/logout', isAuthenticated, (req, res, next) => {
    const userEmail = req.session.user?.email || 'UNKNOWN';
    console.log('POST /logout request received.');
    console.log('Logout request by user:', userEmail);
    AuthController.logoutUser(req, res, next);
});

// Authenticate
router.get('/me', (req, res, next) => {
    console.log('GET /me request received.');
    console.log('Current user request by:', req.session.user?.email || 'UNAUTHENTICATED');
    AuthController.getCurrentUser(req, res, next);
});

// Authenticate Status
router.get('/status', (req, res, next) => {
    console.log('GET /status request received.');
    AuthController.checkAuthStatus(req, res, next);
});

module.exports = router;
