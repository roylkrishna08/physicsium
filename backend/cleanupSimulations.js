const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Simulation = require('./models/Simulation');

dotenv.config();

const cleanupDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Delete the duplicate ohm-law (without 's')
        await Simulation.deleteOne({ simulationId: 'ohm-law' });
        console.log('✅ Deleted duplicate ohm-law');

        // Show all experimental simulations
        const all = await Simulation.find({ category: 'experimental' }).sort({ simulationId: 1 });
        console.log('\n📊 All experimental simulations:');
        all.forEach(s => {
            const status = s.isVisible ? '✅ VISIBLE  ' : '❌ HIDDEN   ';
            console.log(`${status} ${s.simulationId.padEnd(30)} - ${s.name}`);
        });

        console.log(`\n📈 Total: ${all.length} experimental simulations`);
        console.log(`✅ Visible: ${all.filter(s => s.isVisible).length}`);
        console.log(`❌ Hidden: ${all.filter(s => !s.isVisible).length}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

cleanupDatabase();
