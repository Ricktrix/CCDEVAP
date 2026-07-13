const HTTP_STATUS = {
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    INTERNAL_SERVER_ERROR: 500
};

// Checks if the user is authenticated
const isAuthenticated = function(req, res, next){
    try {
        if (!req.session || !req.session.user) {
            console.log('Authentication failed: No authenticated user session.');
            return res.status(HTTP_STATUS.UNAUTHORIZED).json({ success: false, message: 'Authentication required.' });
        }
        console.log('User authenticated:', req.session.user.email);
        next();
    } catch (error) {
        console.error('Server error during authentication check:', error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Internal server error.' });
    }
};

// Checks if authenticated user is an administrator
const isAdmin = function(req, res, next){
    try {
        if (!req.session || !req.session.user) {
            console.log('Administrator authorization failed: No authenticated user session.');
            return res.status(HTTP_STATUS.UNAUTHORIZED).json({ success: false, message: 'Authentication required.' });
        }
        if (req.session.user.role !== 'Admin') {
            console.log('Administrator authorization failed: User is not an administrator.');
            return res.status(HTTP_STATUS.FORBIDDEN).json({ success: false, message: 'Administrator access required.' });
        }
        console.log('Administrator authorized:', req.session.user.email);
        next();
    } catch (error) {
        console.error('Server error during administrator authorization check:', error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Internal server error.' });
    }
};

module.exports = { isAuthenticated, isAdmin };