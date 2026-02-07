const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Simulation = require('./models/Simulation');

dotenv.config();

// Paths to scan for simulation components
const simulationPaths = {
    kinematics: '../frontend/src/components/unit/kinematics/labs',
    electrostatics: '../frontend/src/components/unit/electrostatics',
    gravitation: '../frontend/src/components/unit/gravitation/labs',
    experimental: '../frontend/src/components/freelab',
};

const autoDiscoverSimulations = () => {
    const simulations = [];

    // Scan each category folder
    for (const [category, folderPath] of Object.entries(simulationPaths)) {
        const fullPath = path.join(__dirname, folderPath);

        if (!fs.existsSync(fullPath)) {
            console.log(`⚠️  Skipping ${category}: folder not found`);
            continue;
        }

        const files = fs.readdirSync(fullPath);

        files.forEach(file => {
            if (file.endsWith('Lab.vue') || file.endsWith('Motion.vue')) {
                // Extract simulation name from filename
                const name = file
                    .replace('Lab.vue', '')
                    .replace('.vue', '')
                    .replace(/([A-Z])/g, ' $1')
                    .trim();

                const simulationId = file
                    .replace('Lab.vue', '')
                    .replace('.vue', '')
                    .replace(/([A-Z])/g, '-$1')
                    .toLowerCase()
                    .substring(1); // Remove leading dash

                simulations.push({
                    simulationId,
                    name,
                    category
                });
            }
        });
    }

    return simulations;
};

const autoSyncSimulations = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('🔍 Scanning for simulations...\n');

        const discovered = autoDiscoverSimulations();
        console.log(`📦 Found ${discovered.length} simulation components:\n`);

        discovered.forEach(sim => {
            console.log(`  • ${sim.name} (${sim.category})`);
        });

        console.log('\n🔄 Syncing to database...\n');

        let created = 0;
        let updated = 0;
        let unchanged = 0;

        for (const simData of discovered) {
            const existing = await Simulation.findOne({ simulationId: simData.simulationId });

            if (existing) {
                // Only update name and category, preserve visibility setting
                if (existing.name !== simData.name || existing.category !== simData.category) {
                    existing.name = simData.name;
                    existing.category = simData.category;
                    await existing.save();
                    updated++;
                } else {
                    unchanged++;
                }
            } else {
                await Simulation.create({
                    ...simData,
                    isVisible: true // New simulations visible by default
                });
                created++;
            }
        }

        console.log('✅ Auto-sync complete!');
        console.log(`📦 Created: ${created} new simulations`);
        console.log(`🔄 Updated: ${updated} existing simulations`);
        console.log(`✔️  Unchanged: ${unchanged} simulations`);

        // Show all simulations
        const all = await Simulation.find().sort({ category: 1, name: 1 });
        console.log(`\n📊 Total in database: ${all.length} simulations\n`);

        const byCategory = {};
        all.forEach(sim => {
            if (!byCategory[sim.category]) byCategory[sim.category] = [];
            byCategory[sim.category].push(sim);
        });

        Object.keys(byCategory).sort().forEach(cat => {
            console.log(`\n${cat.toUpperCase()}:`);
            byCategory[cat].forEach(sim => {
                const status = sim.isVisible ? '✅' : '❌';
                console.log(`  ${status} ${sim.name}`);
            });
        });

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

autoSyncSimulations();
