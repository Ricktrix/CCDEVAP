const AuditLog = require('../models/AuditLog');

// Admin-only. Route is guarded by isAuthenticated + isAdmin middleware.
exports.getAuditLogs = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    try {
        const totalLogs = await AuditLog.countDocuments();
        const logs = await AuditLog.find()
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);
        console.log('Admin fetched audit logs. Page:', page, 'Count:', logs.length);
        return res.status(200).json({
            success: true,
            totalLogs,
            currentPage: page,
            totalPages: Math.ceil(totalLogs / limit),
            logs
        });
    } catch (error) {
        console.error('Error fetching audit logs:', error);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};
