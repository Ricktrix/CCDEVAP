const mongoose = require('mongoose');

// User Schema
const userSchema = new mongoose.Schema(
    {
        firstName: {
            type: String,
            required: true,
            trim: true,
            minlength: 2,
            maxlength: 50
        },
        lastName: {
            type: String,
            required: true,
            trim: true,
            minlength: 2,
            maxlength: 50
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            validate: {
                validator: function (value) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value); },
                message: 'Please enter a valid email address.'
            }
        },
        password: {
            type: String,
            required: true,
            minlength: 8
        },
        role: {
            type: String,
            enum: ['passenger', 'admin'],
            default: 'passenger'
        }
    }, {
        timestamps: true
    });

module.exports = mongoose.model('User', userSchema);
