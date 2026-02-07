const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Simulation = require('./models/Simulation');

dotenv.config();

const checkVisible = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const visible = await Simulation.find({ category: 'experimental', isVisible: true });
        console.log('\n✅ VISIBLE experiments on frontend:');
        visible.forEach(s => console.log(`   - ${s.simulationId} | ${s.name}`));

        const hidden = await Simulation.find({ category: 'experimental', isVisible: false });
        console.log(`\n❌ HIDDEN experiments (${hidden.length} total):`);
        hidden.forEach(s => console.log(`   - ${s.simulationId}`));

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

checkVisible();
