const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const User = require('../models/User');

// @desc    Update user details
// @route   PUT /api/users/updatedetails
// @access  Private
exports.updateDetails = asyncHandler(async (req, res, next) => {
    const fieldsToUpdate = {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        username: req.body.username,
    };

    // Remove undefined fields
    Object.keys(fieldsToUpdate).forEach(
        (key) => fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]
    );

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
        new: true,
        runValidators: true,
    });

    res.status(200).json({
        success: true,
        data: user,
    });
});

// @desc    Update password
// @route   PUT /api/users/updatepassword
// @access  Private
exports.updatePassword = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.user.id).select('+password');

    // Check current password
    if (!(await user.matchPassword(req.body.currentPassword))) {
        return next(new ErrorResponse('Password is incorrect', 401));
    }

    user.password = req.body.newPassword;
    await user.save();

    sendTokenResponse(user, 200, res);
});

// @desc    Upload/Update profile picture
// @route   PUT /api/users/profilepicture
// @access  Private
exports.updateProfilePicture = asyncHandler(async (req, res, next) => {
    if (!req.file) {
        return next(new ErrorResponse('Please upload a file', 400));
    }

    const user = await User.findByIdAndUpdate(
        req.user.id,
        { profilePicture: req.file.path }, // Cloudinary URL is in path
        { new: true }
    );

    res.status(200).json({
        success: true,
        data: user,
    });
});

// Helper to send token response (duplicated for simplicity, usually in a helper)
const sendTokenResponse = (user, statusCode, res) => {
    const token = user.getSignedJwtToken();

    res.status(statusCode).json({
        success: true,
        token,
    });
};
