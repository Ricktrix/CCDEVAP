const Flight = require('../models/Flight');
const mongoose = require('mongoose');

// Check if current user is an admin
const isAdmin = (req) => { return req.session.user && req.session.user.role === 'admin' };
// Validate MongoDB ObjectId
const isValidObjectId = (id) => { return mongoose.Types.ObjectId.isValid(id); };

exports.getFlights = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const sort = req.query.sort || 'departureDateTime';
    const order = req.query.order === 'desc' ? -1 : 1;
    const filter = {};
    if (req.query.origin) { filter.origin = new RegExp(req.query.origin.trim(), 'i'); }
    if (req.query.destination) { filter.destination = new RegExp(req.query.destination.trim(), 'i'); }
    
}