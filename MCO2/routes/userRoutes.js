const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');

router.get('/profile', (req, res, next) => {
    console.log('Fetching current user profile.');
    UserController.getProfile(req, res, next);
});

router.put('/profile', (req, res, next) => {
    console.log('Updating current user profile.');
    UserController.updateProfile(req, res, next);
})

module.exports = router;