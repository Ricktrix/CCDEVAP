const HTTP_STATUS = {
    BAD_REQUEST: 400,
    NOT_FOUND: 404,
    CONFLICT: 409,
    INTERNAL_SERVER_ERROR: 500
};

// Handles routes that do not exist
const notFound = function (req, res, next) {
    const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
    error.statusCode = HTTP_STATUS.NOT_FOUND;
    next(error);
};

// Handle application errors
const errorHandler = function (err, req, res, next) {
    console.error(err);
    // mongoose validation errors
    if (err.name === 'ValidationError') {
        const validationErrors = Object.values(err.errors).map(function (error) { return error.message; });
        return res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, message: 'Validation failed.', errors: validationErrors });
    }
    // Mongoose cast errors (e.g. malformed ObjectId)
    if (err.name === 'CastError') {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, message: 'Invalid resource identifier.' });
    }
    // Handle MongoDB duplicate key errors
    if (err.code === 11000) {
        const duplicateField = err.keyPattern ? Object.keys(err.keyPattern)[0] : null;
        const message = duplicateField ? `Duplicate value for ${duplicateField}.` : 'Duplicate data already exists.';
        return res.status(HTTP_STATUS.CONFLICT).json({ success: false, message: message });
    }
    // Handle routes that do not exist
    if (err.statusCode === HTTP_STATUS.NOT_FOUND) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({ success: false, message: err.message });
    }
    // Handle custom application errors
    if (err.statusCode >= HTTP_STATUS.BAD_REQUEST && err.statusCode < HTTP_STATUS.INTERNAL_SERVER_ERROR) {
        return res.status(err.statusCode).json({ success: false, message: err.message || 'Request failed.' });
    }
    // Handle unexpected server errors
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Internal server error.' });
};

module.exports = { notFound, errorHandler };
