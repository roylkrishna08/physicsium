const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const User = require('../models/User');

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Manager/Owner
exports.getUsers = asyncHandler(async (req, res, next) => {
    let query;

    if (req.user.role === 'manager') {
        // Managers can only see regular users
        query = User.find({ role: 'user' });
    } else {
        // Owners can see everyone
        query = User.find();
    }

    const users = await query;

    res.status(200).json({
        success: true,
        count: users.length,
        data: users,
    });
});

// @desc    Get single user
// @route   GET /api/admin/users/:id
// @access  Private/Manager/Owner
exports.getUser = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
    }

    // Check authorization
    if (req.user.role === 'manager' && user.role !== 'user') {
        return next(new ErrorResponse('Not authorized to view this user', 403));
    }

    res.status(200).json({
        success: true,
        data: user,
    });
});

// @desc    Restrict or unrestrict user
// @route   PUT /api/admin/users/:id/restrict
// @access  Private/Manager/Owner
exports.restrictUser = asyncHandler(async (req, res, next) => {
    let user = await User.findById(req.params.id);

    if (!user) {
        return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
    }

    // Managers can't restrict managers or owners
    if (req.user.role === 'manager' && user.role !== 'user') {
        return next(new ErrorResponse('Not authorized to restrict this user', 403));
    }

    user.isRestricted = req.body.isRestricted;
    await user.save();

    res.status(200).json({
        success: true,
        data: user,
    });
});

// @desc    Update user role
// @route   PUT /api/admin/users/:id/role
// @access  Private/Owner
exports.updateUserRole = asyncHandler(async (req, res, next) => {
    const user = await User.findByIdAndUpdate(
        req.params.id,
        { role: req.body.role },
        { new: true, runValidators: true }
    );

    res.status(200).json({
        success: true,
        data: user,
    });
});

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private/Owner
exports.deleteUser = asyncHandler(async (req, res, next) => {
    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
        success: true,
        data: {},
    });
});
