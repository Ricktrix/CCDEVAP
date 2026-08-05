const AuditLog = require('../models/AuditLog');
const HTTP_STATUS = {
    CREATED: 201,
    INTERNAL_SERVER_ERROR: 500
};

async function logActivity(req, user, activity, details = '') {
    try {
        if (!activity || !activity.trim()) {
            return;
        }
        const username = (user && (user.username || user.email)) || 'Unknown User';
        const userRole = (user && user.role) || 'User';
        const ipAddress = (req && req.ip) || 'Uknown';
        const requestMethod = (req && req.method) || '';
        const requestURL = (req && req.originalUrl) || '';
        const auditLog = new AuditLog({
            username,
            userRole,
            activity: activity.trim(),
            details,
            ipAddress,
            requestMethod,
            requestURL
        });
        await auditLog.save();
        return HTTP_STATUS.CREATED;
    } catch (error) {
        console.error('Audit logging failed:', error.message);
        return HTTP_STATUS.INTERNAL_SERVER_ERROR;
    }
}

module.exports = { logActivity };