const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: [true, 'Username is required.'],
            trim: true
        },
        role: {
            type: String,
            required: [true, 'User role is required.'],
            enum: ['Admin', 'User']
        },
        activity: {
            type: String,
            required: [true, 'Activity is required.'],
            trim: true
        },
        ipAddress: {
            type: String,
            trim: true
        },
        requestMethod: {
            type: String,
            trim: true
        },
        requestURL: {
            type: String,
            trim: true
        },
        details: {
            type: String,
            trim: true
        }
    },{
        timestamps: true
    }
);

auditLogSchema.index({ username: 1 });
auditLogSchema.index({ activity: 1 });
auditLogSchema.index({ userRole: 1 });
auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);