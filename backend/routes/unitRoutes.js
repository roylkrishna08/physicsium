const express = require('express');
const router = express.Router();
const Unit = require('../models/Unit');

// @desc    Get visible units (public)
// @route   GET /api/units/visible
// @access  Public
router.get('/visible', async (req, res) => {
    try {
        const units = await Unit.find({ isVisible: true })
            .select('unitId unitNumber title')
            .sort({ unitNumber: 1 });

        const unitIds = units.map(u => u.unitId);

        res.status(200).json({
            success: true,
            count: unitIds.length,
            data: unitIds
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
});

module.exports = router;
