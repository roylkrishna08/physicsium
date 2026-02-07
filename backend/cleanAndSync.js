const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Unit = require('./models/Unit');

dotenv.config();

const cleanAndSync = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB\n');

        // Delete ALL existing units
        const deleted = await Unit.deleteMany({});
        console.log(`🗑️  Deleted ${deleted.deletedCount} existing units\n`);

        // Import frontend data
        const { jeeSyllabus } = require('../frontend/src/data/jee-syllabus.js');
        console.log(`📚 Found ${jeeSyllabus.length} units in frontend\n`);

        // Auto-categorize based on content
        const getCategoryFromTitle = (title) => {
            const t = title.toLowerCase();
            if (t.includes('experimental')) return 'other';
            if (t.includes('therm') || t.includes('gas')) return 'thermodynamics';
            if (t.includes('electric') || t.includes('magnetic') || t.includes('current') || t.includes('ac') || t.includes('induction')) return 'electromagnetism';
            if (t.includes('optic') || t.includes('wave') && !t.includes('oscillation')) return 'optics';
            if (t.includes('atom') || t.includes('dual') || t.includes('device') || t.includes('nucle')) return 'modern-physics';
            return 'mechanics';
        };

        const unitsWithSims = ['kinematics', 'electrostatics', 'gravitation'];

        // Create new units from frontend data
        for (const item of jeeSyllabus) {
            const unitId = item.unit.toLowerCase().replace(/\s+/g, '-');
            const category = getCategoryFromTitle(item.title);
            const hasSims = unitsWithSims.some(sim => item.title.toLowerCase().includes(sim));

            await Unit.create({
                unitId,
                unitNumber: item.unit,
                title: item.title,
                title_hi: item.title_hi,
                category,
                hasSimulations: hasSims,
                isVisible: true
            });
        }

        console.log(`✅ Created ${jeeSyllabus.length} units from frontend data\n`);

        // Show final result
        const all = await Unit.find().sort({ unitNumber: 1 });
        console.log('📋 Database units (sorted):');
        all.forEach(u => {
            const sims = u.hasSimulations ? '🧪' : '  ';
            console.log(`${sims} ${u.unitNumber.padEnd(8)} | ${u.title}`);
        });

        console.log(`\n📊 Total: ${all.length} units`);
        console.log(`🧪 With Simulations: ${all.filter(u => u.hasSimulations).length}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

cleanAndSync();
