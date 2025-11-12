// backend/services/mockData.js
const mockNonprofits = [
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
      description: "The American Cancer Society is dedicated to eliminating cancer as a major health problem by preventing cancer, saving lives, and diminishing suffering from cancer through research, education, advocacy, and service.",
      website: "https://cancer.org",
      lastUpdated: new Date().toISOString()
    },
    {
      _id: "507f1f77bcf86cd799439012",
      id: "507f1f77bcf86cd799439012", 
      name: "ST JUDE CHILDREN'S RESEARCH HOSPITAL",
      ein: "35-1044585",
      city: "MEMPHIS",
      state: "TN",
      zip: "38105-3678",
      category: "Health",
      classification: "E",
      trustScore: 100,
      verificationStatus: "verified",
      walletAddress: "0x8ba1f109551bD432803012645Hac136c22C27ec",
      totalDonations: "892.3",
      donorCount: 28950,
      description: "St. Jude Children's Research Hospital is leading the way the world understands, treats and defeats childhood cancer and other life-threatening diseases.",
      website: "https://stjude.org",
      lastUpdated: new Date().toISOString()
    },
    {
      _id: "507f1f77bcf86cd799439013",
      id: "507f1f77bcf86cd799439013",
      name: "AMERICAN RED CROSS",
      ein: "53-0196605", 
      city: "WASHINGTON",
      state: "DC",
      zip: "20006-1544",
      category: "Human Services",
      classification: "P",
      trustScore: 95,
      verificationStatus: "verified", 
      walletAddress: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
      totalDonations: "1205.8",
      donorCount: 45230,
      description: "The American Red Cross prevents and alleviates human suffering in the face of emergencies by mobilizing the power of volunteers and the generosity of donors.",
      website: "https://redcross.org",
      lastUpdated: new Date().toISOString()
    },
    {
      _id: "507f1f77bcf86cd799439014", 
      id: "507f1f77bcf86cd799439014",
      name: "FEEDING AMERICA",
      ein: "36-3673599",
      city: "CHICAGO", 
      state: "IL",
      zip: "60601-5927",
      category: "Human Services",
      classification: "K",
      trustScore: 97,
      verificationStatus: "verified",
      walletAddress: "0xA0b86a33E6441885dD93e6dd6Edba6b6f23E30Fe", 
      totalDonations: "678.2",
      donorCount: 32180,
      description: "Feeding America is the largest hunger-relief organization in the United States. Through a network of more than 200 food banks, we provide meals to more than 46 million people each year.",
      website: "https://feedingamerica.org",
      lastUpdated: new Date().toISOString()
    },
    {
      _id: "507f1f77bcf86cd799439015",
      id: "507f1f77bcf86cd799439015", 
      name: "HABITAT FOR HUMANITY INTERNATIONAL INC",
      ein: "91-1914868",
      city: "AMERICUS",
      state: "GA", 
      zip: "31709-3498",
      category: "Human Services",
      classification: "L",
      trustScore: 94,
      verificationStatus: "verified",
      walletAddress: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
      totalDonations: "423.9",
      donorCount: 18760,
      description: "Habitat for Humanity International is a nonprofit organization that helps people in your community and around the world build or improve a place they can call home.",
      website: "https://habitat.org", 
      lastUpdated: new Date().toISOString()
    },
    {
      _id: "507f1f77bcf86cd799439016",
      id: "507f1f77bcf86cd799439016",
      name: "WORLD WILDLIFE FUND INC",
      ein: "52-1693387",
      city: "WASHINGTON", 
      state: "DC",
      zip: "20037-1193",
      category: "Environment", 
      classification: "C",
      trustScore: 92,
      verificationStatus: "verified",
      walletAddress: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
      totalDonations: "234.5",
      donorCount: 12450,
      description: "World Wildlife Fund works to sustain the natural world for the benefit of people and wildlife, collaborating with partners from local to global levels.",
      website: "https://worldwildlife.org",
      lastUpdated: new Date().toISOString()
    }
  ];
  
  // Generate more mock data dynamically
  const generateMockNonprofits = (query, limit = 12, skip = 0) => {
    const categories = ['Health', 'Education', 'Human Services', 'Environment', 'Religion', 'Arts & Culture', 'Animal Welfare'];
    const states = ['CA', 'TX', 'FL', 'NY', 'PA', 'IL', 'OH', 'GA', 'NC', 'MI'];
    const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose'];
    
    const results = [];
    
    // Always include base nonprofits if they match query
    const matchingBase = mockNonprofits.filter(org => 
      !query || org.name.toLowerCase().includes(query.toLowerCase()) ||
      org.category.toLowerCase().includes(query.toLowerCase())
    );
    
    results.push(...matchingBase);
    
    // Generate additional results to reach limit
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
        trustScore: Math.floor(85 + Math.random() * 15),
        verificationStatus: "verified",
        walletAddress: `0x${Math.random().toString(16).substr(2, 40)}`,
        totalDonations: (Math.random() * 500 + 50).toFixed(1),
        donorCount: Math.floor(Math.random() * 10000 + 500),
        description: `${orgName} is a verified ${category.toLowerCase()} organization dedicated to making a positive impact in the ${city} community and beyond.`,
        website: `https://${orgName.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 20)}.org`,
        lastUpdated: new Date().toISOString()
      });
    }
    
    // Apply pagination
    const paginatedResults = results.slice(skip, skip + limit);
    
    return {
      results: paginatedResults,
      total: query ? Math.floor(500 + Math.random() * 1000) : 559125, // Mock total count
      queryTime: Math.floor(50 + Math.random() * 200) + 'ms'
    };
  };
  
  module.exports = {
    mockNonprofits,
    generateMockNonprofits
  };  