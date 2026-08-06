const User = require('../models/User');

const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.session.user.id).select('-password');
        if (!user) {
            console.log('Profile retrieval failed: User not found.');
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        console.log('Profile retrieved:', user.email);
        return res.status(200).json({ success: true, user });
    } catch (error) {
        console.error('Get profile error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

exports.updateProfile = async (req, res) => {
    const { firstName, lastName, email } = req.body;
    if (!firstName || !lastName || !email) {
        console.log('Profile update failed: Missing fields.');
        return res.status(400).json({ success: false, message: 'Please fill in all fields.' });
    }
    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();
    const trimmedEmail = email.trim().toLowerCase();
    if (!isValidEmail(trimmedEmail)) {
        console.log('Profile update failed: Invalid email.');
        return res.status(400).json({ success: false, message: 'Invalid email format.' });
    }
    try {
        const existingUser = await User.findOne({
            email: trimmedEmail,
            _id: { $ne: req.session.user.id }
        });
        if (existingUser) {
            console.log('Profile update failed: Email already exists.');
            return res.status(409).json({ success: false, message: 'Email already exists.' });
        }
        const updatedUser = await User.findByIdAndUpdate(
            req.session.user.id,
            { firstName: trimmedFirstName, lastName: trimmedLastName, email: trimmedEmail },
            { new: true, runValidators: true }
        ).select('-password');
        if (!updatedUser) {
            console.log('Profile update failed: User not found.');
            return res.status(404).json({ success: false, message: 'User not found.' });
        }
        req.session.user.firstName = updatedUser.firstName;
        req.session.user.lastName = updatedUser.lastName;
        req.session.user.email = updatedUser.email;
        console.log('Profile updated:', updatedUser.email);
        return res.status(200).json({
            success: true,
            message: 'Profile updated successfully.',
            user: updatedUser
        });
    } catch (error) {
        console.log('Update profile error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

exports.deleteAccount = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.session.user.id);
        if (!user) {
            console.log('Delete account failed: User not found.');
            return res.status(404).json({ success: false, message: 'User not found.' });
        }
        req.session.destroy((error) => {
            if (error) {
                console.error('Session destroy error:', error);
                return res.status(500).json({ success: false, message: 'Internal server error' });
            }
            console.log('Account deleted:', user.email);
            return res.status(200).json({ success: true, message: 'Account deleted successfully.' });
        });
    } catch (error) {
        console.error('Delete account error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

exports.getCurrentUser = async (req, res) => {
    console.log('Current user retrieved:', req.session.user.email);
    return res.status(200).json({ success: true, user: req.session.user });
};
