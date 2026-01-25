/**
 * Standardized API Response Helper
 */

// Success Response
const successResponse = (res, data, message = 'Success', statusCode = 200) => {
    return res.status(statusCode).json({
        success: true,
        message,
        data
    });
};

// Error Response
const errorResponse = (res, message = 'Server Error', statusCode = 500, error = null) => {
    const response = {
        success: false,
        message
    };

    if (error && process.env.NODE_ENV !== 'production') {
        response.error = error.message || error;
        response.stack = error.stack;
    }

    return res.status(statusCode).json(response);
};

// Pagination Response
const paginationResponse = (res, data, page, limit, total, message = 'Success') => {
    const totalPages = Math.ceil(total / limit);

    return res.status(200).json({
        success: true,
        message,
        data: data,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: parseInt(total),
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1
        }
    });
};

module.exports = {
    successResponse,
    errorResponse,
    paginationResponse
};
