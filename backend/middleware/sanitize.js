const { body, param, query, validationResult } = require('express-validator');
const ErrorResponse = require('../utils/errorResponse');

// Middleware to check validation results
exports.validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(err => err.msg).join(', ');
        return next(new ErrorResponse(errorMessages, 400));
    }
    next();
};

// Common validation rules
exports.registerValidation = [
    body('firstName')
        .trim()
        .notEmpty().withMessage('First name is required')
        .isLength({ min: 2, max: 50 }).withMessage('First name must be between 2-50 characters')
        .matches(/^[a-zA-Z\s]+$/).withMessage('First name can only contain letters'),

    body('lastName')
        .optional()
        .trim()
        .isLength({ max: 50 }).withMessage('Last name must be less than 50 characters')
        .matches(/^[a-zA-Z\s]*$/).withMessage('Last name can only contain letters'),

    body('username')
        .trim()
        .notEmpty().withMessage('Username is required')
        .isLength({ min: 3, max: 30 }).withMessage('Username must be between 3-30 characters')
        .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers, and underscores'),

    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email')
        .normalizeEmail(),

    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
        .matches(/^(?=.*[A-Za-z])(?=.*\d)/).withMessage('Password must contain at least one letter and one number'),
];

exports.loginValidation = [
    body('identifier')
        .trim()
        .notEmpty().withMessage('Email or Username is required'),

    body('password')
        .notEmpty().withMessage('Password is required'),
];

exports.updateDetailsValidation = [
    body('firstName')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 }).withMessage('First name must be between 2-50 characters')
        .matches(/^[a-zA-Z\s]+$/).withMessage('First name can only contain letters'),

    body('lastName')
        .optional()
        .trim()
        .isLength({ max: 50 }).withMessage('Last name must be less than 50 characters')
        .matches(/^[a-zA-Z\s]*$/).withMessage('Last name can only contain letters'),

    body('username')
        .optional()
        .trim()
        .isLength({ min: 3, max: 30 }).withMessage('Username must be between 3-30 characters')
        .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers, and underscores'),
];

exports.updatePasswordValidation = [
    body('currentPassword')
        .notEmpty().withMessage('Current password is required'),

    body('newPassword')
        .notEmpty().withMessage('New password is required')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
        .matches(/^(?=.*[A-Za-z])(?=.*\d)/).withMessage('Password must contain at least one letter and one number'),
];

exports.resetPasswordValidation = [
    body('newPassword')
        .notEmpty().withMessage('New password is required')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
        .matches(/^(?=.*[A-Za-z])(?=.*\d)/).withMessage('Password must contain at least one letter and one number'),
];

exports.idParamValidation = [
    param('id')
        .isMongoId().withMessage('Invalid user ID format'),
];
