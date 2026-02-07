const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Simulation = require('./models/Simulation');

dotenv.config();

const fixVisibility = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB\n');

        // Keep these 3 visible (the ones you already enabled)
        const keepVisible = ['vernier-calipers', 'screw-gauge', 'simple-pendulum'];

        // Hide all others
        const result = await Simulation.updateMany(
            {
                category: 'experimental',
                simulationId: { $nin: keepVisible }
            },
            { isVisible: false }
        );

        console.log(`✅ Hidden ${result.modifiedCount} experiments`);
        console.log(`✅ Kept visible: ${keepVisible.join(', ')}\n`);

        // Show final state
        const all = await Simulation.find({ category: 'experimental' }).sort({ simulationId: 1 });
        console.log('📋 Final state:');
        all.forEach(s => {
            const status = s.isVisible ? '✅ VISIBLE' : '❌ HIDDEN ';
            console.log(`${status} | ${s.simulationId.padEnd(35)} | ${s.name}`);
        });

        console.log(`\n✅ Visible: ${all.filter(s => s.isVisible).length}`);
        console.log(`❌ Hidden: ${all.filter(s => !s.isVisible).length}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

fixVisibility();
