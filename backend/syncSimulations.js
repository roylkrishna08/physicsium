const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Simulation = require('./models/Simulation');

dotenv.config();

const simulations = [
    // Experimental Skills (from JEE syllabus)
    { simulationId: 'vernier-calipers', name: 'Vernier Calipers', category: 'experimental' },
    { simulationId: 'screw-gauge', name: 'Screw Gauge', category: 'experimental' },
    { simulationId: 'simple-pendulum', name: 'Simple Pendulum', category: 'experimental' },
    { simulationId: 'ohms-law', name: "Ohm's Law", category: 'experimental' },
    { simulationId: 'meter-bridge', name: 'Meter Bridge', category: 'experimental' },
    { simulationId: 'sonometer', name: 'Sonometer', category: 'experimental' },
    { simulationId: 'focal-length-concave', name: 'Focal Length of Concave Mirror', category: 'experimental' },
    { simulationId: 'focal-length-convex', name: 'Focal Length of Convex Lens', category: 'experimental' },
    { simulationId: 'youngs-modulus', name: "Young's Modulus", category: 'experimental' },
    { simulationId: 'surface-tension', name: 'Surface Tension by Capillary Rise', category: 'experimental' },
    { simulationId: 'viscosity', name: 'Coefficient of Viscosity', category: 'experimental' },
    { simulationId: 'refractive-index', name: 'Refractive Index of Glass', category: 'experimental' },
    { simulationId: 'resistance-thermometer', name: 'Resistance of Thermometer', category: 'experimental' },
    { simulationId: 'potentiometer-emf', name: 'Potentiometer - EMF of Cell', category: 'experimental' },
    { simulationId: 'resistivity', name: 'Resistivity of Material', category: 'experimental' },

    // Free Lab
    { simulationId: 'freelab', name: 'Free Lab (Multipurpose)', category: 'experimental' },

    // Kinematics Labs
    { simulationId: 'projectile-motion', name: 'Projectile Motion', category: 'kinematics' },
    { simulationId: 'relative-velocity', name: 'Relative Velocity', category: 'kinematics' },
    { simulationId: 'circular-motion', name: 'Uniform Circular Motion', category: 'kinematics' },

    // Electrostatics Labs
    { simulationId: 'coulombs-law', name: "Coulomb's Law", category: 'electrostatics' },
    { simulationId: 'electric-field', name: 'Electric Field', category: 'electrostatics' },
    { simulationId: 'gauss-law', name: "Gauss's Law", category: 'electrostatics' },
    { simulationId: 'electric-potential', name: 'Electric Potential', category: 'electrostatics' },
    { simulationId: 'capacitors', name: 'Capacitors', category: 'electrostatics' },
    { simulationId: 'dipole', name: 'Electric Dipole', category: 'electrostatics' },

    // Gravitation Labs
    { simulationId: 'keplers-laws', name: "Kepler's Laws", category: 'gravitation' },
    { simulationId: 'gravitational-field', name: 'Gravitational Field', category: 'gravitation' },
    { simulationId: 'satellite-motion', name: 'Satellite Motion', category: 'gravitation' },
    { simulationId: 'gravitational-potential', name: 'Gravitational Potential', category: 'gravitation' },
];

const syncSimulations = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        let created = 0;
        let updated = 0;

        for (const simData of simulations) {
            const existing = await Simulation.findOne({ simulationId: simData.simulationId });

            if (existing) {
                existing.name = simData.name;
                existing.category = simData.category;
                await existing.save();
                updated++;
            } else {
                await Simulation.create(simData);
                created++;
            }
        }

        console.log(`\n✅ Sync Complete!`);
        console.log(`📦 Created: ${created} new simulations`);
        console.log(`🔄 Updated: ${updated} existing simulations`);
        console.log(`📊 Total: ${simulations.length} simulations in database\n`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error syncing simulations:', error);
        process.exit(1);
    }
};

syncSimulations();
