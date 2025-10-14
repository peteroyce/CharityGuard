const mongoose = require('mongoose');
const Nonprofit = require('../models/Nonprofit');
const Transaction = require('../models/Transaction');
require('dotenv').config();

const demoNonprofits = [
  {
    name: 'American Red Cross',
    registrationNumber: '53-0196605',
    contactEmail: 'demo@redcross.org',
    address: '431 18th St NW, Washington, DC 20006',
    verificationStatus: 'verified',
    trustLevel: 'trusted',
    trustScore: 0.95
  },
  {
    name: 'United Way Worldwide', 
    registrationNumber: '13-1624107',
    contactEmail: 'demo@unitedway.org',
    address: '1150 Connecticut Ave NW, Washington, DC 20036',
    verificationStatus: 'verified',
    trustLevel: 'trusted',
    trustScore: 0.92
  }
];

async function generateDemoData() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing demo data (optional)
    // await Nonprofit.deleteMany({});
    // await Transaction.deleteMany({});

    // Create demo nonprofits
    const createdNonprofits = await Nonprofit.insertMany(demoNonprofits);
    console.log(`Created ${createdNonprofits.length} demo nonprofits`);

    // Create demo transactions
    const demoTransactions = [];
    for (let nonprofit of createdNonprofits) {
      for (let i = 0; i < 5; i++) {
        demoTransactions.push({
          nonprofit: nonprofit._id,
          nonprofitName: nonprofit.name,
          amount: Math.floor(Math.random() * 1000) + 10,
          donorWallet: `donor_${Math.random().toString(36).substr(2, 9)}`,
          description: 'Demo donation',
          fraudScore: Math.random() * 0.3, // Low fraud scores for demo
          status: 'completed'
        });
      }
    }

    const createdTransactions = await Transaction.insertMany(demoTransactions);
    console.log(`Created ${createdTransactions.length} demo transactions`);

    console.log('Demo data generation complete!');
    process.exit(0);
  } catch (error) {
    console.error('Demo data generation failed:', error);
    process.exit(1);
  }
}

generateDemoData();
