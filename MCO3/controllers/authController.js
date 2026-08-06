const User = require('../models/User');
const bcrypt = require('bcrypt');
const { logActivity } = require('../utils/auditLogger');

const SALT_ROUNDS = 10;

const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

exports.registerUser = async (req, res) => {
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
    // Validate password confirmation
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
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
        // Create passenger account
        const newUser = new User({ firstName, lastName, email, password: hashedPassword, role: 'passenger' });

        await newUser.save();
        console.log('New passenger registered:', newUser.email);
        await logActivity(newUser, 'User Registration', `New passenger account created: ${newUser.email}`);
        return res.status(201).json({ success: true, message: 'Registration successful.' });
    } catch (error) {
        console.log('Registration error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

exports.loginUser = async (req, res) => {
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password?.trim();
    // Validate fields
    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }
    // Validate email
    if (!isValidEmail(email)) {
        return res.status(400).json({ success: false, message: 'Invalid email format.' });
    }
    try {
        // Find the user
        const user = await User.findOne({ email });
        if (!user) {
            console.log('Login failed: User not found.');
            return res.status(404).json({ success: false, message: 'User does not exist.' });
        }
        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log('Login failed: Incorrect password.');
            return res.status(401).json({ success: false, message: 'Incorrect password' });
        }
        // Store user session
        req.session.user = { id: user._id, firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role };
        console.log('User logged in:', user.email);
        await logActivity(user, 'User Login', `${user.email} logged in.`);
        return res.status(200).json({ success: true, message: 'Login successful.', role: user.role });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

exports.logoutUser = async (req, res) => {
    // Grab the user info before the session is destroyed, since we need it for the audit log.
    const loggedOutUser = req.session.user;
    try {
        req.session.destroy((error) => {
            if (error) {
                console.log('Logout error:', error);
                return res.status(500).json({ success: false, message: 'Internal server error.' });
            }
            console.log('User logged out.');
            logActivity(loggedOutUser, 'User Logout', loggedOutUser ? `${loggedOutUser.email} logged out.` : '');
            return res.status(200).json({ success: true, message: 'Logout successful.' });
        });
    } catch (error) {
        console.error('Logout error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

exports.getCurrentUser = async (req, res) => {
    try {
        if (!req.session.user) {
            console.log('Current user request failed: User is not authorized.');
            return res.status(404).json({ success: false, message: 'User is not authenticated.' });
        }
        const user = await User.findById(req.session.user.id);
        if (!user) {
            console.log('Current user request failed: User not found.');
            return res.status(404).json({ success: false, message: 'User not found.' });
        }
        console.log('Current authenticated user:', user.email);
        return res.status(200).json({ success: true, user: { id: user._id, firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role } });
    } catch (error) {
        console.error('Get current user error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

exports.checkAuthStatus = async (req, res) => {
    try {
        if (!req.session.user) {
            console.log('Authentication status: User is not authenticated.');
            return res.status(200).json({ authenticated: false, user: null });
        }
        console.log('Authentication status is authenticated.');
        return res.status(200).json({
            authenticated: true,
            user: {
                id: req.session.user.id,
                firstName: req.session.user.firstName,
                lastName: req.session.user.lastName,
                email: req.session.user.email,
                role: req.session.user.role
            }
        });
    } catch (error) {
        console.error('Authentication status error:', error);
        return res.status(500).json({ authenticated: false, user: null, message: 'Internal server error.' });
    }
};
