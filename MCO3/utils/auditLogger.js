const AuditLog = require('../models/AuditLog');

// Writes one audit trail entry. Called directly from controllers right after
// an action succeeds (registration, login, flight changes, etc).
// A logging failure should never break the actual request, so any error
// here is just logged to the console instead of thrown.
async function logActivity(user, activity, details) {
    try {
        await AuditLog.create({
            username: user ? user.email : 'unknown',
            userRole: user ? user.role : 'unknown',
            activity: activity,
            details: details || ''
        });
    } catch (error) {
        console.error('Failed to write audit log entry:', error);
    }
}

module.exports = { logActivity };
