const path = require('path');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const User = require('../models/User');
const suggestUsernames = require('../utils/usernameSuggester');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res, next) => {
    const { firstName, lastName, username, email, password, role } = req.body;

    // Create user
    const user = await User.create({
        firstName,
        lastName,
        username,
        email,
        password,
        role: role || 'user', // Default to user if not provided
    });

    sendTokenResponse(user, 201, res);
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
        return next(new ErrorResponse('Please provide an email and password', 400));
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
        return next(new ErrorResponse('Invalid credentials', 401));
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
        return next(new ErrorResponse('Invalid credentials', 401));
    }

    if (user.isRestricted) {
        return next(new ErrorResponse('Your account has been restricted', 403));
    }

    sendTokenResponse(user, 200, res);
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.user.id);

    res.status(200).json({
        success: true,
        data: user,
    });
});

// @desc    Check username availability
// @route   GET /api/auth/check-username/:username
// @access  Public
exports.checkUsername = asyncHandler(async (req, res, next) => {
    const username = req.params.username.toLowerCase();
    const user = await User.findOne({ username });

    if (user) {
        const suggestions = await suggestUsernames(username);
        return res.status(200).json({
            success: false,
            available: false,
            message: 'Username is already taken',
            suggestions,
        });
    }

    res.status(200).json({
        success: true,
        available: true,
        message: 'Username is available',
    });
});

// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
    // Create token
    const token = user.getSignedJwtToken();

    const options = {
        expires: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000 // 30 days
        ),
        httpOnly: true,
    };

    if (process.env.NODE_ENV === 'production') {
        options.secure = true;
    }

    res.status(statusCode).json({
        success: true,
        token,
        user: {
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            username: user.username,
            email: user.email,
            role: user.role,
            profilePicture: user.profilePicture,
        },
    });
};
