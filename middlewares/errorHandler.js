const { ZodError } = require('zod');

class AppError extends Error {
    constructor(message, statusCode = 500) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

const handleZodError = (error) => {
    const firstError = error.errors[0];
    let message = 'Validation error';
    
    if (firstError) {
        const field = firstError.path.join('.');
        const errorMessage = firstError.message;
        message = field ? `${field}: ${errorMessage}` : errorMessage;
    }
    
    return new AppError(message, 400);
};

const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    if (err instanceof ZodError) {
        error = handleZodError(err);
    }

    if (!error.statusCode) {
        error.statusCode = 500;
    }

    res.status(error.statusCode).json({
        success: false,
        message: error.message,
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
};

module.exports = { errorHandler, AppError };