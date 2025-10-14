const { ethers } = require('ethers');

// Your Complete Contract ABI
const CONTRACT_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "donationId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "donor",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "charity",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "charityName",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "charityEIN",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "fraudScore",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "status",
        "type": "string"
      }
    ],
    "name": "DonationMade",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "donationId",
        "type": "uint256"
      }
    ],
    "name": "DonationVerified",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "donationCounter",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "donations",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "donor",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "charity",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "charityName",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "charityEIN",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "fraudScore",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "isVerified",
        "type": "bool"
      },
      {
        "internalType": "string",
        "name": "status",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "donorHistory",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_donationId",
        "type": "uint256"
      }
    ],
    "name": "getDonation",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "id",
            "type": "uint256"
          },
          {
            "internalType": "address",
            "name": "donor",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "charity",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "amount",
            "type": "uint256"
          },
          {
            "internalType": "string",
            "name": "charityName",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "charityEIN",
            "type": "string"
          },
          {
            "internalType": "uint256",
            "name": "timestamp",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "fraudScore",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "isVerified",
            "type": "bool"
          },
          {
            "internalType": "string",
            "name": "status",
            "type": "string"
          }
        ],
        "internalType": "struct CharityGuardDonations.Donation",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_donor",
        "type": "address"
      }
    ],
    "name": "getDonorHistory",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getTotalAmount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getTotalDonations",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_charity",
        "type": "address"
      },
      {
        "internalType": "string",
        "name": "_charityName",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_charityEIN",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "_fraudScore",
        "type": "uint256"
      }
    ],
    "name": "makeDonation",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalDonationsAmount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_donationId",
        "type": "uint256"
      }
    ],
    "name": "verifyDonation",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

class BlockchainService {
  constructor() {
    // Validate environment variables
    if (!process.env.SEPOLIA_RPC_URL) {
      console.warn('SEPOLIA_RPC_URL not set - blockchain features disabled');
      this.isEnabled = false;
      return;
    }

    if (!process.env.CONTRACT_ADDRESS) {
      console.warn('CONTRACT_ADDRESS not set - blockchain features disabled');
      this.isEnabled = false;
      return;
    }

    try {
      this.provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
      this.contractAddress = process.env.CONTRACT_ADDRESS;
      this.contract = new ethers.Contract(this.contractAddress, CONTRACT_ABI, this.provider);
      
      // For write operations (requires private key)
      if (process.env.PRIVATE_KEY) {
        this.wallet = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
        this.contractWithSigner = this.contract.connect(this.wallet);
      }

      this.isEnabled = true;
      console.log('✅ Blockchain service initialized successfully');
      console.log(`📍 Contract Address: ${this.contractAddress}`);
    } catch (error) {
      console.error('❌ Failed to initialize blockchain service:', error);
      this.isEnabled = false;
    }
  }

  async recordDonation(donationData) {
    if (!this.isEnabled || !this.contractWithSigner) {
      return { success: false, error: 'Blockchain service not available' };
    }

    try {
      const { charity, charityName, charityEIN, amount, fraudScore } = donationData;
      
      const amountInWei = ethers.parseEther(amount.toString());
      const fraudScorePercent = Math.round((fraudScore || 0) * 100);
      
      console.log(`🔄 Recording donation: ${amount} ETH to ${charityName}`);
      
      const tx = await this.contractWithSigner.makeDonation(
        charity.walletAddress || this.wallet.address,
        charityName || 'Unknown Charity',
        charityEIN || 'N/A',
        fraudScorePercent,
        { 
          value: amountInWei,
          gasLimit: 300000
        }
      );

      console.log(`📡 Transaction submitted: ${tx.hash}`);
      
      const receipt = await tx.wait();
      const donationId = this.extractDonationId(receipt);
      
      console.log(`✅ Donation recorded on blockchain - ID: ${donationId}`);
      
      return {
        success: true,
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        donationId: donationId
      };
    } catch (error) {
      console.error('❌ Blockchain recording error:', error);
      return {
        success: false,
        error: error.reason || error.message || 'Unknown blockchain error'
      };
    }
  }

  async getDonationById(donationId) {
    if (!this.isEnabled) {
      return { success: false, error: 'Blockchain service not available' };
    }

    try {
      const donation = await this.contract.getDonation(donationId);
      
      return {
        success: true,
        donation: {
          id: Number(donation.id),
          donor: donation.donor,
          charity: donation.charity,
          amount: ethers.formatEther(donation.amount),
          charityName: donation.charityName,
          charityEIN: donation.charityEIN,
          timestamp: new Date(Number(donation.timestamp) * 1000),
          fraudScore: Number(donation.fraudScore),
          isVerified: donation.isVerified,
          status: donation.status
        }
      };
    } catch (error) {
      console.error('Failed to get donation by ID:', error);
      return { 
        success: false, 
        error: error.reason || error.message || 'Failed to fetch donation'
      };
    }
  }

  async getTotalStats() {
    if (!this.isEnabled) {
      return { success: false, error: 'Blockchain service not available' };
    }

    try {
      const totalDonations = await this.contract.getTotalDonations();
      const totalAmount = await this.contract.getTotalAmount();
      
      return {
        success: true,
        stats: {
          totalDonations: Number(totalDonations),
          totalAmount: ethers.formatEther(totalAmount),
          contractAddress: this.contractAddress,
          network: 'Sepolia Testnet'
        }
      };
    } catch (error) {
      console.error('Failed to get blockchain stats:', error);
      return { 
        success: false, 
        error: error.reason || error.message || 'Failed to fetch blockchain statistics'
      };
    }
  }

  extractDonationId(receipt) {
    try {
      for (const log of receipt.logs) {
        try {
          const parsed = this.contract.interface.parseLog(log);
          if (parsed && parsed.name === 'DonationMade') {
            return Number(parsed.args.donationId);
          }
        } catch (e) {
          continue;
        }
      }
      return null;
    } catch (error) {
      console.error('Failed to extract donation ID:', error);
      return null;
    }
  }

  async healthCheck() {
    if (!this.isEnabled) {
      return { healthy: false, error: 'Service not enabled' };
    }

    try {
      const blockNumber = await this.provider.getBlockNumber();
      const totalDonations = await this.contract.getTotalDonations();
      
      return {
        healthy: true,
        currentBlock: blockNumber,
        totalDonations: Number(totalDonations),
        contractAddress: this.contractAddress
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message
      };
    }
  }
}

module.exports = new BlockchainService();