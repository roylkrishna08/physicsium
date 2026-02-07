const express = require('express');
const Simulation = require('../models/Simulation');
const asyncHandler = require('../middleware/async');

const router = express.Router();

// @desc    Get hidden simulation IDs
// @route   GET /api/simulations/hidden
// @access  Public
router.get('/hidden', asyncHandler(async (req, res, next) => {
    const hiddenSims = await Simulation.find({ isVisible: false }).select('simulationId');
    const ids = hiddenSims.map(sim => sim.simulationId);

    res.status(200).json({
        success: true,
        data: ids,
    });
}));

// @desc    Get all public simulation info (names, categories)
// @route   GET /api/simulations
// @access  Public
router.get('/', asyncHandler(async (req, res, next) => {
    const simulations = await Simulation.find({ isVisible: true });

    res.status(200).json({
        success: true,
        data: simulations,
    });
}));

module.exports = router;
