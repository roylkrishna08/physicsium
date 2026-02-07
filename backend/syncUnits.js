const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Unit = require('./models/Unit');

dotenv.config();

// Complete list of all 20 JEE Physics units
const allJeeUnits = [
    { unitId: 'unit-1-measurements', unitNumber: 'UNIT 1', title: 'Units and Measurements', title_hi: 'मात्रक और मापन', category: 'other', hasSimulations: false },
    { unitId: 'unit-2-kinematics', unitNumber: 'UNIT 2', title: 'Kinematics', title_hi: 'कीनेमेटिक्स', category: 'mechanics', hasSimulations: true },
    { unitId: 'unit-3-laws-of-motion', unitNumber: 'UNIT 3', title: 'Laws of Motion', title_hi: 'गति के नियम', category: 'mechanics', hasSimulations: false },
    { unitId: 'unit-4-work-energy-power', unitNumber: 'UNIT 4', title: 'Work, Energy and Power', title_hi: 'कार्य, ऊर्जा और शक्ति', category: 'mechanics', hasSimulations: false },
    { unitId: 'unit-5-rotational-motion', unitNumber: 'UNIT 5', title: 'Rotational Motion', title_hi: 'घूर्णन गति', category: 'mechanics', hasSimulations: false },
    { unitId: 'unit-6-gravitation', unitNumber: 'UNIT 6', title: 'Gravitation', title_hi: 'गुरुत्वाकर्षण', category: 'mechanics', hasSimulations: true },
    { unitId: 'unit-7-properties-solids-liquids', unitNumber: 'UNIT 7', title: 'Properties of Solids and Liquids', title_hi: 'ठोस और द्रवों के गुण', category: 'mechanics', hasSimulations: false },
    { unitId: 'unit-8-thermodynamics', unitNumber: 'UNIT 8', title: 'Thermodynamics', title_hi: 'ऊष्मप्रवैगिकी', category: 'thermodynamics', hasSimulations: false },
    { unitId: 'unit-9-kinetic-theory-gases', unitNumber: 'UNIT 9', title: 'Kinetic Theory of Gases', title_hi: 'गैसों का अणुगति सिद्धांत', category: 'thermodynamics', hasSimulations: false },
    { unitId: 'unit-10-oscillations-waves', unitNumber: 'UNIT 10', title: 'Oscillations and Waves', title_hi: 'दोलन और तरंगें', category: 'mechanics', hasSimulations: false },
    { unitId: 'unit-11-electrostatics', unitNumber: 'UNIT 11', title: 'Electrostatics', title_hi: 'स्थिरवैद्युतिकी', category: 'electromagnetism', hasSimulations: true },
    { unitId: 'unit-12-current-electricity', unitNumber: 'UNIT 12', title: 'Current Electricity', title_hi: 'विद्युत धारा', category: 'electromagnetism', hasSimulations: false },
    { unitId: 'unit-13-magnetic-effects', unitNumber: 'UNIT 13', title: 'Magnetic Effects of Current', title_hi: 'धारा का चुंबकीय प्रभाव', category: 'electromagnetism', hasSimulations: false },
    { unitId: 'unit-14-electromagnetic-induction', unitNumber: 'UNIT 14', title: 'Electromagnetic Induction', title_hi: 'विद्युत चुंबकीय प्रेरण', category: 'electromagnetism', hasSimulations: false },
    { unitId: 'unit-15-ac', unitNumber: 'UNIT 15', title: 'Alternating Current', title_hi: 'प्रत्यावर्ती धारा', category: 'electromagnetism', hasSimulations: false },
    { unitId: 'unit-16-em-waves', unitNumber: 'UNIT 16', title: 'Electromagnetic Waves', title_hi: 'विद्युत चुंबकीय तरंगें', category: 'electromagnetism', hasSimulations: false },
    { unitId: 'unit-17-optics', unitNumber: 'UNIT 17', title: 'Optics', title_hi: 'प्रकाशिकी', category: 'optics', hasSimulations: false },
    { unitId: 'unit-18-dual-nature', unitNumber: 'UNIT 18', title: 'Dual Nature of Matter and Radiation', title_hi: 'द्रव्य और विकिरण की द्वैत प्रकृति', category: 'modern-physics', hasSimulations: false },
    { unitId: 'unit-19-atoms-nuclei', unitNumber: 'UNIT 19', title: 'Atoms and Nuclei', title_hi: 'परमाणु और नाभिक', category: 'modern-physics', hasSimulations: false },
    { unitId: 'unit-20-electronic-devices', unitNumber: 'UNIT 20', title: 'Electronic Devices', title_hi: 'इलेक्ट्रॉनिक युक्तियां', category: 'modern-physics', hasSimulations: false },
    { unitId: 'unit-21-experimental-skills', unitNumber: 'UNIT 21', title: 'Experimental Skills', title_hi: 'प्रायोगिक कौशल', category: 'other', hasSimulations: false }
];

const syncAll20Units = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB\n');

        let created = 0;
        let updated = 0;

        for (const unitData of allJeeUnits) {
            const existing = await Unit.findOne({ unitId: unitData.unitId });

            if (existing) {
                existing.title = unitData.title;
                existing.title_hi = unitData.title_hi;
                existing.category = unitData.category;
                existing.hasSimulations = unitData.hasSimulations;
                existing.unitNumber = unitData.unitNumber;
                await existing.save();
                updated++;
            } else {
                await Unit.create(unitData);
                created++;
            }
        }

        console.log('✅ All JEE Units Sync Complete!');
        console.log(`📦 Created: ${created} new units`);
        console.log(`🔄 Updated: ${updated} existing units`);
        console.log(`📊 Total: ${allJeeUnits.length} JEE units in database\n`);

        // Show final state
        const all = await Unit.find().sort({ unitNumber: 1 });
        console.log('📋 All units in database:');
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
        console.error('❌ Error syncing units:', error);
        process.exit(1);
    }
};

syncAll20Units();
