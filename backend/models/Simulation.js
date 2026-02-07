const mongoose = require('mongoose');

const SimulationSchema = new mongoose.Schema({
    simulationId: {
        type: String,
        required: [true, 'Please add a simulation ID'],
        unique: true,
        trim: true,
    },
    name: {
        type: String,
        required: [true, 'Please add a name'],
    },
    category: {
        type: String,
        enum: ['kinematics', 'electrostatics', 'gravitation', 'experimental', 'others'],
        default: 'others',
    },
    isVisible: {
        type: Boolean,
        default: true,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Simulation', SimulationSchema);
