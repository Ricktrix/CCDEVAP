const HTTP_STATUS = {
    UNAUTHORIZED: 401,
    FORBIDDEN: 403
};

/* ── API guards (used on /api/* routes - respond with JSON) ── */

const isAuthenticated = function (req, res, next) {
    if (!req.session || !req.session.user) {
        console.log('Authentication failed: No authenticated user session.');
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({ success: false, message: 'Authentication required.' });
    }
    next();
};

// The User model's role enum only ever stores lowercase 'admin'/'passenger',
// so we only need to check the lowercase value here.
const isAdmin = function (req, res, next) {
    if (!req.session || !req.session.user) {
        console.log('Administrator authorization failed: No authenticated user session.');
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({ success: false, message: 'Authentication required.' });
    }
    if (req.session.user.role !== 'admin') {
        console.log('Administrator authorization failed: User is not an administrator.');
        return res.status(HTTP_STATUS.FORBIDDEN).json({ success: false, message: 'Administrator access required.' });
    }
    next();
};

/* ── Page guards (used on page routes that render HBS views - redirect instead of JSON) ── */

const requireLoginPage = function (req, res, next) {
    if (!req.session || !req.session.user) {
        return res.redirect('/login');
    }
    next();
};

const requireAdminPage = function (req, res, next) {
    if (!req.session || !req.session.user) {
        return res.redirect('/login');
    }
    if (req.session.user.role !== 'admin') {
        return res.redirect('/');
    }
    next();
};

module.exports = { isAuthenticated, isAdmin, requireLoginPage, requireAdminPage };
