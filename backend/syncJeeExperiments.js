const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Simulation = require('./models/Simulation');

dotenv.config();

// All 18 JEE Experimental Skills from official syllabus
const jeeExperiments = [
    { simulationId: 'vernier-calipers', name: 'Vernier Calipers - Measuring Diameter and Depth', category: 'experimental' },
    { simulationId: 'screw-gauge', name: 'Screw Gauge - Thickness/Diameter Measurement', category: 'experimental' },
    { simulationId: 'simple-pendulum', name: 'Simple Pendulum - Energy Dissipation', category: 'experimental' },
    { simulationId: 'meter-scale-mass', name: 'Meter Scale - Mass by Moments Principle', category: 'experimental' },
    { simulationId: 'youngs-modulus', name: "Young's Modulus of Elasticity", category: 'experimental' },
    { simulationId: 'surface-tension', name: 'Surface Tension by Capillary Rise', category: 'experimental' },
    { simulationId: 'viscosity', name: 'Coefficient of Viscosity by Terminal Velocity', category: 'experimental' },
    { simulationId: 'speed-of-sound', name: 'Speed of Sound using Resonance Tube', category: 'experimental' },
    { simulationId: 'specific-heat-solid', name: 'Specific Heat Capacity of Solid', category: 'experimental' },
    { simulationId: 'specific-heat-liquid', name: 'Specific Heat Capacity of Liquid', category: 'experimental' },
    { simulationId: 'resistivity-wire', name: 'Resistivity using Meter Bridge', category: 'experimental' },
    { simulationId: 'ohms-law', name: "Ohm's Law - Resistance of Wire", category: 'experimental' },
    { simulationId: 'galvanometer-resistance', name: 'Galvanometer Resistance and Figure of Merit', category: 'experimental' },
    { simulationId: 'focal-length-mirrors-lenses', name: 'Focal Length of Mirrors and Lenses', category: 'experimental' },
    { simulationId: 'prism-deviation', name: 'Prism - Angle of Deviation vs Incidence', category: 'experimental' },
    { simulationId: 'refractive-index-glass', name: 'Refractive Index using Travelling Microscope', category: 'experimental' },
    { simulationId: 'pn-junction-diode', name: 'P-N Junction Diode Characteristics', category: 'experimental' },
    { simulationId: 'zener-diode', name: 'Zener Diode and Breakdown Voltage', category: 'experimental' },
    { simulationId: 'component-identification', name: 'Identification of Electronic Components', category: 'experimental' },
];

const syncJeeExperiments = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB\n');

        let created = 0;
        let updated = 0;

        for (const expData of jeeExperiments) {
            const existing = await Simulation.findOne({ simulationId: expData.simulationId });

            if (existing) {
                existing.name = expData.name;
                existing.category = expData.category;
                await existing.save();
                updated++;
            } else {
                await Simulation.create(expData);
                created++;
            }
        }

        console.log('✅ JEE Experiments Sync Complete!');
        console.log(`📦 Created: ${created} new experiments`);
        console.log(`🔄 Updated: ${updated} existing experiments`);
        console.log(`📊 Total: ${jeeExperiments.length} JEE experiments in database\n`);

        // Show current state
        const all = await Simulation.find({ category: 'experimental' }).sort({ simulationId: 1 });
        console.log('📋 All experimental simulations:');
        all.forEach(s => {
            const status = s.isVisible ? '✅' : '❌';
            console.log(`${status} ${s.simulationId.padEnd(35)} | ${s.name}`);
        });

        console.log(`\n✅ Visible: ${all.filter(s => s.isVisible).length}`);
        console.log(`❌ Hidden: ${all.filter(s => !s.isVisible).length}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error syncing JEE experiments:', error);
        process.exit(1);
    }
};

syncJeeExperiments();
