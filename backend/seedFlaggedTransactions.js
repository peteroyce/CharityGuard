const mongoose = require('mongoose');
const Transaction = require('./models/Transaction');

// MongoDB connection
const MONGODB_URI = 'your_mongodb_connection_string_here';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('MongoDB connected for seeding');
  seedTransactions();
}).catch(err => console.error('MongoDB connection error:', err));

const sampleTransactions = [
  {
    transactionHash: '0x1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z',
    donorAddress: '0xABCDEF1234567890ABCDEF1234567890ABCDEF12',
    nonprofitName: 'Suspicious Cancer Research Foundation',
    nonprofitEIN: '12-3456789',
    amount: 5.5,
    timestamp: new Date('2025-10-24T10:30:00'),
    fraudScore: 0.85,
    riskFlags: ['High amount for new donor', 'Rapid consecutive donations', 'Suspicious nonprofit name pattern'],
    status: 'flagged',
    reviewerNotes: ''
  },
  {
    transactionHash: '0x9z8y7x6w5v4u3t2s1r0q9p8o7n6m5l4k3j2i1h0g9f8e7d6c5b4a',
    donorAddress: '0x1234567890ABCDEF1234567890ABCDEF12345678',
    nonprofitName: 'International Relief Fund',
    nonprofitEIN: '98-7654321',
    amount: 2.3,
    timestamp: new Date('2025-10-24T09:15:00'),
    fraudScore: 0.65,
    riskFlags: ['Unverified EIN', 'Transaction from high-risk region'],
    status: 'under_review',
    reviewerNotes: 'Investigating EIN validity with IRS database'
  },
  {
    transactionHash: '0xABCDEF1234567890FEDCBA0987654321ABCDEF1234567890FEDCBA',
    donorAddress: '0xFEDCBA0987654321FEDCBA0987654321FEDCBA09',
    nonprofitName: 'Help The Children Foundation',
    nonprofitEIN: '45-6789012',
    amount: 10.0,
    timestamp: new Date('2025-10-24T08:00:00'),
    fraudScore: 0.92,
    riskFlags: ['Extremely high fraud score', 'Donor address blacklisted', 'Multiple failed verification attempts', 'Nonprofit not in IRS database'],
    status: 'flagged',
    reviewerNotes: ''
  },
  {
    transactionHash: '0x5A6B7C8D9E0F1A2B3C4D5E6F7A8B9C0D1E2F3A4B5C6D7E8F9A0B',
    donorAddress: '0x7890ABCDEF1234567890ABCDEF1234567890ABCD',
    nonprofitName: 'Veterans Support Network',
    nonprofitEIN: '23-4567890',
    amount: 1.8,
    timestamp: new Date('2025-10-23T20:45:00'),
    fraudScore: 0.55,
    riskFlags: ['Unusual transaction time', 'New nonprofit (< 6 months)'],
    status: 'under_review',
    reviewerNotes: 'Waiting for additional donor verification documents'
  },
  {
    transactionHash: '0xDEADBEEF1234567890DEADBEEF1234567890DEADBEEF1234567890',
    donorAddress: '0xBADC0FFEE1234567890BADC0FFEE1234567890BA',
    nonprofitName: 'Emergency Food Bank Association',
    nonprofitEIN: '34-5678901',
    amount: 7.2,
    timestamp: new Date('2025-10-24T11:20:00'),
    fraudScore: 0.78,
    riskFlags: ['Donor wallet flagged in past', 'Large amount for first donation', 'IP mismatch with donor location'],
    status: 'flagged',
    reviewerNotes: ''
  }
];

async function seedTransactions() {
  try {
    // Clear existing flagged transactions (optional)
    await Transaction.deleteMany({ fraudScore: { $gt: 0.5 } });
    console.log('Cleared existing test transactions');

    // Insert sample transactions
    const result = await Transaction.insertMany(sampleTransactions);
    console.log(`✅ Successfully created ${result.length} flagged transactions`);
    
    // Log summary
    const flagged = result.filter(t => t.status === 'flagged').length;
    const underReview = result.filter(t => t.status === 'under_review').length;
    
    console.log(`\n📊 Summary:`);
    console.log(`   - Flagged: ${flagged}`);
    console.log(`   - Under Review: ${underReview}`);
    console.log(`   - Total: ${result.length}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding transactions:', error);
    process.exit(1);
  }
}
