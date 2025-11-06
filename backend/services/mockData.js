// backend/services/mockData.js
const mockNonprofits = [
  // ... (your existing nonprofits - unchanged for brevity)
  {
    _id: "507f1f77bcf86cd799439011",
    id: "507f1f77bcf86cd799439011",
    name: "AMERICAN CANCER SOCIETY INC",
    ein: "13-1788491",
    city: "ATLANTA",
    state: "GA",
    zip: "30303-1002",
    category: "Health",
    classification: "E",
    trustScore: 98,
    verificationStatus: "verified",
    walletAddress: "0x742d35Cc6634C0532925a3b8D5e9e9b5845a522F",
    totalDonations: "245.7",
    donorCount: 15420,
    description: "The American Cancer Society is dedicated to eliminating cancer...",
    website: "https://cancer.org",
    lastUpdated: new Date().toISOString()
  },
  // Add 2 more for brevity; keep all 6 from original
  // ... (ST JUDE, RED CROSS, FEEDING AMERICA, HABITAT, WWF - unchanged)
];

// NEW: Mock Transactions with Fraud Examples (for demo endpoint)
const mockTransactions = [
  { 
    nonprofit: "507f1f77bcf86cd799439011", 
    nonprofitName: "AMERICAN CANCER SOCIETY INC", 
    amount: 10.5, 
    donorWallet: "0x123...", 
    fraudScore: 0.12, 
    status: "completed", 
    date: new Date(Date.now() - 3600000)  // 1 hour ago
  },
  { 
    nonprofit: "507f1f77bcf86cd799439011", 
    nonprofitName: "AMERICAN CANCER SOCIETY INC", 
    amount: 50.0,  // Outlier amount
    donorWallet: "0xNewWallet...",  // New wallet
    fraudScore: 0.85, 
    status: "flagged",  // Flagged example
    date: new Date()  // Now
  },
  { 
    nonprofit: "507f1f77bcf86cd799439011", 
    nonprofitName: "AMERICAN CANCER SOCIETY INC", 
    amount: 10000,  // Extreme outlier (blocked)
    donorWallet: "0xSuspicious...", 
    fraudScore: 0.95, 
    status: "blocked", 
    date: new Date(Date.now() - 60000)  // 1 min ago, burst
  }
  // Add more for demo...
];

// Generate more mock data dynamically (unchanged, but now includes fraud in generated)
const generateMockNonprofits = (query, limit = 12, skip = 0) => {
  // ... (your existing logic - unchanged for brevity)
  const results = [];
  // Base matching...
  // Generated with occasional fraud trustScore <85 for demo
  for (let i = results.length; i < limit + skip; i++) {
    const category = categories[i % categories.length];
    const state = states[i % states.length];
    const city = cities[i % cities.length];
    const orgNumber = Math.floor(1000 + Math.random() * 9000);
    
    let orgName;
    if (query && query.toLowerCase().includes('cancer')) {
      const cancerNames = [
        `${city} CANCER RESEARCH CENTER`,
        `${city} ONCOLOGY FOUNDATION`, 
        `CANCER SUPPORT NETWORK OF ${city.toUpperCase()}`,
        `${city} CANCER CARE ALLIANCE`,
        `HOPE FOR CANCER ${city.toUpperCase()}`
      ];
      orgName = cancerNames[i % cancerNames.length];
    } else if (query && query.toLowerCase().includes('church')) {
      const churchNames = [
        `FIRST BAPTIST CHURCH OF ${city.toUpperCase()}`,
        `${city} METHODIST CHURCH`,
        `ST MARY'S CATHOLIC CHURCH ${city.toUpperCase()}`,
        `${city} COMMUNITY CHURCH`,
        `GRACE EVANGELICAL CHURCH ${city.toUpperCase()}`
      ];
      orgName = churchNames[i % churchNames.length];
    } else {
      const prefixes = ['FRIENDS OF', 'FOUNDATION FOR', 'ALLIANCE FOR', 'SOCIETY FOR', 'ASSOCIATION OF'];
      const causes = ['EDUCATION', 'CHILDREN', 'VETERANS', 'ELDERLY', 'HOMELESS', 'ANIMALS', 'ENVIRONMENT'];
      orgName = `${prefixes[i % prefixes.length]} ${causes[i % causes.length]} ${city.toUpperCase()}`;
    }
    
    results.push({
      _id: `mock_${i}_${Date.now()}`,
      id: `mock_${i}_${Date.now()}`,
      name: orgName,
      ein: `${Math.floor(10 + Math.random() * 89)}-${orgNumber}${Math.floor(100 + Math.random() * 899)}`,
      city: city,
      state: state,
      zip: `${Math.floor(10000 + Math.random() * 89999)}-${Math.floor(1000 + Math.random() * 8999)}`,
      category: category,
      classification: category.charAt(0),
      trustScore: Math.floor((Math.random() > 0.8 ? 70 : 85) + Math.random() * 15),  // 20% low trust for fraud demo
      verificationStatus: "verified",
      walletAddress: `0x${Math.random().toString(16).substr(2, 40)}`,
      totalDonations: (Math.random() * 500 + 50).toFixed(1),
      donorCount: Math.floor(Math.random() * 10000 + 500),
      description: `${orgName} is a verified ${category.toLowerCase()} organization dedicated to making a positive impact in the ${city} community and beyond.`,
      website: `https://${orgName.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 20)}.org`,
      lastUpdated: new Date().toISOString()
    });
  }
  return { results, total: query ? Math.floor(500 + Math.random() * 1000) : 559125, queryTime: Math.floor(50 + Math.random() * 200) + 'ms' };
};

module.exports = {
  mockNonprofits,
  generateMockNonprofits,
  mockTransactions  // New: For fraud demo
};
