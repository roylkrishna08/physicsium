const mongoose = require('mongoose');

const UnitSchema = new mongoose.Schema({
    unitId: {
        type: String,
        required: [true, 'Please add a unit ID'],
        unique: true,
        trim: true,
    },
    unitNumber: {
        type: String,
        required: [true, 'Please add a unit number'],
    },
    title: {
        type: String,
        required: [true, 'Please add a title'],
    },
    title_hi: {
        type: String,
    },
    category: {
        type: String,
        enum: ['mechanics', 'thermodynamics', 'electromagnetism', 'optics', 'modern-physics', 'other'],
        default: 'other',
    },
    isVisible: {
        type: Boolean,
        default: true,
    },
    hasSimulations: {
        type: Boolean,
        default: false,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Unit', UnitSchema);
