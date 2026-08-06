const mongoose = require('mongoose');

const countrySchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Country title is required.'],
        unique: true,
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Country description is required.'],
        trim: true
    },
    image_url: {
        type: String,
        required: [true, 'Country image URL required.'],
        trim: true
    }
}, {
    timestamps: true
});

const Country = mongoose.model('Country', countrySchema);

module.exports = Country;
