const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Unit = require('./models/Unit');

dotenv.config();

// Import the actual jeeSyllabus data from frontend
const { jeeSyllabus } = require('../frontend/src/data/jee-syllabus.js');

const syncFromFrontend = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB\n');

        console.log(`📚 Found ${jeeSyllabus.length} units in jee-syllabus.js\n`);

        // Map category based on unit number or content
        const getCategoryFromUnit = (unit, title) => {
            const titleLower = title.toLowerCase();
            if (titleLower.includes('experimental')) return 'other';
            if (titleLower.includes('therm') || titleLower.includes('gas')) return 'thermodynamics';
            if (titleLower.includes('electric') || titleLower.includes('magnetic') || titleLower.includes('ac') || titleLower.includes('current')) return 'electromagnetism';
            if (titleLower.includes('optic') || titleLower.includes('wave') && titleLower.includes('electromagnetic')) return 'optics';
            if (titleLower.includes('atom') || titleLower.includes('dual') || titleLower.includes('electronic') || titleLower.includes('nucle')) return 'modern-physics';
            return 'mechanics'; // default
        };

        // Check which units have simulations (based on existing routes/components)
        const unitsWithSimulations = ['kinematics', 'electrostatics', 'gravitation'];

        let created = 0;
        let updated = 0;

        for (const sylItem of jeeSyllabus) {
            const unitId = `unit-${sylItem.unit.toLowerCase().replace(/\s+/g, '-')}`;
            const category = getCategoryFromUnit(sylItem.unit, sylItem.title);
            const hasSimulations = unitsWithSimulations.some(sim => sylItem.title.toLowerCase().includes(sim));

            const unitData = {
                unitId,
                unitNumber: sylItem.unit,
                title: sylItem.title,
                title_hi: sylItem.title_hi,
                category,
                hasSimulations,
                isVisible: true // All visible by default
            };

            const existing = await Unit.findOne({ unitId });

            if (existing) {
                existing.unitNumber = unitData.unitNumber;
                existing.title = unitData.title;
                existing.title_hi = unitData.title_hi;
                existing.category = unitData.category;
                existing.hasSimulations = unitData.hasSimulations;
                await existing.save();
                updated++;
            } else {
                await Unit.create(unitData);
                created++;
            }
        }

        console.log('✅ Frontend Sync Complete!');
        console.log(`📦 Created: ${created} new units`);
        console.log(`🔄 Updated: ${updated} existing units`);
        console.log(`📊 Total: ${jeeSyllabus.length} units in database\n`);

        // Show final state sorted by unit number
        const all = await Unit.find().sort({ unitNumber: 1 });
        console.log('📋 All units (sorted by number):');
        all.forEach(u => {
            const status = u.isVisible ? '✅' : '❌';
            const sims = u.hasSimulations ? '🧪' : '  ';
            console.log(`${status} ${sims} ${u.unitNumber.padEnd(8)} | ${u.title}`);
        });

        console.log(`\n✅ Visible: ${all.filter(u => u.isVisible).length}`);
        console.log(`❌ Hidden: ${all.filter(u => !u.isVisible).length}`);
        console.log(`🧪 With Simulations: ${all.filter(u => u.hasSimulations).length}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error syncing from frontend:', error);
        process.exit(1);
    }
};

syncFromFrontend();
