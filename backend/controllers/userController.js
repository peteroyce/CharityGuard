const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');

exports.generateTestUsers = async (req, res) => {
  try {
    console.log('🎲 Generating test users...');

    // DELETE ALL EXISTING TEST USERS FIRST
    await User.deleteMany({
      email: { $in: [
        'test1@example.com', 
        'test2@example.com', 
        'test3@example.com', 
        'test4@example.com', 
        'test5@example.com', 
        'test6@example.com', 
        'test7@example.com', 
        'test8@example.com'
      ]}
    });

    console.log('🗑️  Cleared existing test users');

    const testUsers = [
      {
        walletAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1",
        email: "test1@example.com",
        username: "CryptoPhilanthropist",
        accountStatus: "active",
        isVerified: true,
        totalDonations: 23.445,
        donationCount: 12,
        createdAt: new Date("2025-05-12"),
        lastActive: new Date("2025-10-27")
      },
      {
        walletAddress: "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199",
        email: "test2@example.com",
        username: "DonorJane",
        accountStatus: "active",
        isVerified: true,
        totalDonations: 8.923,
        donationCount: 7,
        createdAt: new Date("2025-07-20"),
        lastActive: new Date("2025-10-27")
      },
      {
        walletAddress: "0xdD2FD4581271e230360230F9337D5c0430Bf44C0",
        email: "test3@example.com",
        username: "BlockchainBenefactor",
        accountStatus: "active",
        isVerified: true,
        totalDonations: 31.892,
        donationCount: 18,
        createdAt: new Date("2025-03-25"),
        lastActive: new Date("2025-10-27")
      },
      {
        walletAddress: "0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826",
        email: "test4@example.com",
        username: "EthicalDonor",
        accountStatus: "suspended",
        isVerified: false,
        totalDonations: 3.567,
        donationCount: 4,
        createdAt: new Date("2025-09-05"),
        lastActive: new Date("2025-10-15")
      },
      {
        walletAddress: "0x2546BcD3c84621e976D8185a91A922aE77ECEc30",
        email: "test5@example.com",
        username: "CharityChampion",
        accountStatus: "active",
        isVerified: true,
        totalDonations: 45.123,
        donationCount: 31,
        createdAt: new Date("2025-02-10"),
        lastActive: new Date("2025-10-27")
      },
      {
        walletAddress: "0xbDA5747bFD65F08deb54cb465eB87D40e51B197E",
        email: "test6@example.com",
        username: "GenerousDonor",
        accountStatus: "active",
        isVerified: true,
        totalDonations: 15.678,
        donationCount: 9,
        createdAt: new Date("2025-06-01"),
        lastActive: new Date("2025-10-25")
      },
      {
        walletAddress: "0x5A0b54D5dc17e0AadC383d2db43B0a0D3E029c4c",
        email: "test7@example.com",
        username: "BlockchainAngel",
        accountStatus: "banned",
        isVerified: false,
        totalDonations: 12.456,
        donationCount: 5,
        createdAt: new Date("2025-08-10"),
        lastActive: new Date("2025-10-20")
      },
      {
        walletAddress: "0x6c3e4cb2750C46d77073fe3C13Ba0eD3aCfA2d8a",
        email: "test8@example.com",
        username: "CryptoGiver",
        accountStatus: "active",
        isVerified: true,
        totalDonations: 18.234,
        donationCount: 14,
        createdAt: new Date("2025-04-18"),
        lastActive: new Date("2025-10-26")
      }
    ];

    // Insert test users
    const result = await User.insertMany(testUsers);

    console.log(`✅ Successfully created ${result.length} test users`);

    res.json({
      success: true,
      message: `Successfully created ${result.length} test users`,
      data: result
    });
  } catch (error) {
    console.error('❌ Error generating test users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate test users',
      error: error.message
    });
  }
};

