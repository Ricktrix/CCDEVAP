const mongoose = require('mongoose');

// Stores a record for every important action a user takes, so admins
// can review who did what and when.
const auditLogSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        trim: true
    },
    userRole: {
        type: String,
        required: true,
        trim: true
    },
    activity: {
        type: String,
        required: true,
        trim: true
    },
    details: {
        type: String,
        trim: true
    }
}, {
    timestamps: true // gives us createdAt, which we use as the date/time of the activity
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
