const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const { isAuthenticated } = require('../middlewares/authMiddleware');

router.get('/profile', isAuthenticated, (req, res, next) => {
    console.log('Fetching current user profile.');
    UserController.getProfile(req, res, next);
});

router.put('/profile', isAuthenticated, (req, res, next) => {
    console.log('Updating current user profile.');
    UserController.updateProfile(req, res, next);
});

module.exports = router;
