const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const User = require('../models/User');
const Simulation = require('../models/Simulation');
const Unit = require('../models/Unit');

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
// @desc    Reset user password
// @route   PUT /api/admin/users/:id/reset-password
// @access  Private/Manager/Owner
exports.resetUserPassword = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
    }

    // Managers can't reset passwords for other managers or owners
    if (req.user.role === 'manager' && user.role !== 'user') {
        return next(new ErrorResponse('Not authorized to reset this user\'s password', 403));
    }

    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
        return next(new ErrorResponse('Please provide a new password with at least 6 characters', 400));
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
        success: true,
        message: 'Password reset successfully',
    });
});

// --- Simulation Management ---

// @desc    Get all simulations
// @route   GET /api/admin/simulations
// @access  Private/Manager/Owner
exports.getSimulations = asyncHandler(async (req, res, next) => {
    const simulations = await Simulation.find();

    res.status(200).json({
        success: true,
        count: simulations.length,
        data: simulations,
    });
});

// @desc    Toggle simulation visibility
// @route   PUT /api/admin/simulations/:id/toggle
// @access  Private/Manager/Owner
exports.toggleSimulationVisibility = asyncHandler(async (req, res, next) => {
    let simulation = await Simulation.findById(req.params.id);

    if (!simulation) {
        return next(new ErrorResponse(`Simulation not found with id of ${req.params.id}`, 404));
    }

    simulation.isVisible = !simulation.isVisible;
    simulation.updatedAt = Date.now();
    await simulation.save();

    res.status(200).json({
        success: true,
        data: simulation,
    });
});

// @desc    Sync simulations list
// @route   POST /api/admin/simulations/sync
// @access  Private/Owner
exports.syncSimulations = asyncHandler(async (req, res, next) => {
    const { simulations } = req.body; // Array of { simulationId, name, category }

    if (!simulations || !Array.isArray(simulations)) {
        return next(new ErrorResponse('Please provide an array of simulations', 400));
    }

    const results = {
        created: 0,
        updated: 0,
        errors: 0
    };

    for (const simData of simulations) {
        try {
            let sim = await Simulation.findOne({ simulationId: simData.simulationId });
            if (sim) {
                sim.name = simData.name || sim.name;
                sim.category = simData.category || sim.category;
                await sim.save();
                results.updated++;
            } else {
                await Simulation.create(simData);
                results.created++;
            }
        } catch (err) {
            console.error(`Error syncing simulation ${simData.simulationId}:`, err.message);
            results.errors++;
        }
    }

    res.status(200).json({
        success: true,
        data: results
    });
});
// Unit Management Methods

// @desc    Get all units
// @route   GET /api/admin/units
// @access  Private/Manager/Owner
exports.getUnits = asyncHandler(async (req, res, next) => {
    const units = await Unit.find().sort({ unitNumber: 1 });

    res.status(200).json({
        success: true,
        count: units.length,
        data: units
    });
});

// @desc    Toggle unit visibility
// @route   PUT /api/admin/units/:id/toggle
// @access  Private/Manager/Owner
exports.toggleUnitVisibility = asyncHandler(async (req, res, next) => {
    let unit = await Unit.findById(req.params.id);

    if (!unit) {
        return next(new ErrorResponse(`Unit not found with id of ${req.params.id}`, 404));
    }

    unit.isVisible = !unit.isVisible;
    unit.updatedAt = Date.now();
    await unit.save();

    res.status(200).json({
        success: true,
        data: unit
    });
});

// @desc    Sync units from syllabus
// @route   POST /api/admin/units/sync
// @access  Private/Owner
exports.syncUnits = asyncHandler(async (req, res, next) => {
    const unitsData = req.body.units || [];
    const results = { synced: 0, errors: 0 };

    for (const unitData of unitsData) {
        try {
            const existing = await Unit.findOne({ unitId: unitData.unitId });

            if (existing) {
                existing.title = unitData.title;
                existing.title_hi = unitData.title_hi;
                existing.category = unitData.category;
                existing.hasSimulations = unitData.hasSimulations;
                existing.updatedAt = Date.now();
                await existing.save();
            } else {
                await Unit.create(unitData);
            }
            results.synced++;
        } catch (err) {
            console.error(`Error syncing unit ${unitData.unitId}:`, err.message);
            results.errors++;
        }
    }

    res.status(200).json({
        success: true,
        data: results
    });
});
