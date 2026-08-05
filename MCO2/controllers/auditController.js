const mongoose = require('mongoose');
const AuditLog = require('../models/AuditLog');

const HTTP_STATUS = {
    OK: 200,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500
};

exports.getAuditLogs = async (req, res) => {
    try {
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = Math.max(parseInt(req.query.limit) || 20, 1);
        const skip = (page - 1) * limit;

        const totalLogs = await AuditLog.countDocuments();
        const logs = await AuditLog.find().sort({ createdAt: -1 }).skip(skip).limit(limit);
        const totalPages = Math.ceil(totalLogs / limit);

        return res.status(HTTP_STATUS.OK).json({
            success: true,
            totalLogs,
            totalPages,
            currentPage: page,
            logs
        });
    } catch (error) {
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'An unexpected error occured.',
            error: error.message
        });
    }
};

exports.getAuditLogById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: 'Invalid audit log ID.'
            });
        }

        const log = await AuditLog.findById(id);

        if (!log) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: 'Audit log not found.'
            });
        }

        return res.status(HTTP_STATUS.OK).json({
            success: true,
            log
        });

    } catch (error) {
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'An unexpected error occurred.',
            error: error.message
        });
    }
};


exports.searchAuditLogs = async (req, res) => {
    try {
        const { keyword } = req.query;

        const query = {};

        if (keyword) {
            query.$or = [
                { username: { $regex: keyword, $options: 'i' } },
                { activity: { $regex: keyword, $options: 'i' } },
                { details: { $regex: keyword, $options: 'i' } }
            ];
        }

        const logs = await AuditLog.find(query)
            .sort({ createdAt: -1 });

        return res.status(HTTP_STATUS.OK).json({
            success: true,
            totalLogs: logs.length,
            logs
        });

    } catch (error) {
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'An unexpected error occurred.',
            error: error.message
        });
    }
};

exports.filterAuditLogs = async (req, res) => {
    try {
        const { username, role, activity } = req.query;

        const filter = {};

        if (username) {
            filter.username = { $regex: username, $options: 'i' };
        }

        if (userRole) {
            filter.role = role;
        }

        if (activity) {
            filter.activity = { $regex: activity, $options: 'i' };
        }

        const logs = await AuditLog.find(filter).sort({ createdAt: -1 });

        return res.status(HTTP_STATUS.OK).json({
            success: true,
            totalLogs: logs.length,
            logs
        });

    } catch (error) {
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'An unexpected error occurred.',
            error: error.message
        });
    }
};


exports.getAuditLogsByDate = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: 'Both startDate and endDate are required.'
            });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        end.setHours(23, 59, 59, 999);

        const logs = await AuditLog.find({
            createdAt: {
                $gte: start,
                $lte: end
            }
        }).sort({ createdAt: -1 });

        return res.status(HTTP_STATUS.OK).json({
            success: true,
            totalLogs: logs.length,
            logs
        });

    } catch (error) {
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'An unexpected error occurred.',
            error: error.message
        });
    }
};


exports.renderAuditLogs = async (req, res) => {
    try {
        const logs = await AuditLog.find().sort({ createdAt: -1 });

        return res.status(HTTP_STATUS.OK).render('admin/auditLogs', {
            title: 'Audit Logs',
            logs,
            currentUser: req.session.user
        });

    } catch (error) {
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'An unexpected error occurred.',
            error: error.message
        });
    }
};