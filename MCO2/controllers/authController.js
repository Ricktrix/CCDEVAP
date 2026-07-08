const User = require('../models/User');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

exports.register = async (req, res) => {
    const firstName = req.body.firstName?.trim();
    const lastName = req.body.lastName?.trim();
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password?.trim();
    const confirmPassword = req.body.confirmPassword?.trim();
    
    // Validate required fields
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
        console.log('Registration failed: Missing required fields.');
        return res.status(400).json({ success: false, message: 'Please fill in all fields.' });
    }
    // Validate email
    if (!isValidEmail(email)) {
        console.log('Registration failed: Invalid email');
        return res.status(400).json({ success: false, message: 'Invalid email format.' });
    }
    // Validate password length
    if (password.length < 8) {
        console.log('Registration failed: Weak password.');
        return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long.' });
    }
    // Validate password configuration
    if (password !== confirmPassword) {
        console.log('Registration failed: Passwords do not match.');
        return res.status(400).json({ success: false, message: 'Passwords do not match' });
    }
    try {
        // Check existing email
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            console.log('Registration failed: Email already exists.');
            return res.status(409).json({ success: false, message: 'Email already exists.' });
        }
        // Hash password
        const hashedPassword = await bycrypt.hash(password, SALT_ROUNDS);
        // Create passenger account
        const newUser = new User({ firstName, lastName, email, password: hashedPassword, role: 'passenger' });

        await newUser.save();
        console.log('New passenger registered:', newUser,email);
        return res.status(201).json({ success: true, message: 'Registration successful.' });
    } catch (error) {
        console.log('Registration error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

exports.login = async (req, res) => {}