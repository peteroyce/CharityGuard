const { ethers } = require('ethers');

// ... (your existing CONTRACT_ABI - unchanged)

class BlockchainService {
  constructor() {
    // ... (existing initialization - unchanged)
  }

  // Enhanced recordDonation (passes fraudScore/status to contract)
  async recordDonation(donationData) {
    if (!this.isEnabled || !this.contractWithSigner) {
      return { success: false, error: 'Blockchain service not available' };
    }

    try {
      const { charity, charityName, charityEIN, amount, fraudScore, status } = donationData;  // Added fraud/status
      
      const amountInWei = ethers.parseEther(amount.toString());
      const fraudScorePercent = Math.round((fraudScore || 0) * 100);
      const statusStr = status || 'completed';  // Pass fraud status to event
      
      console.log(`🔄 Recording donation: ${amount} ETH to ${charityName} (Fraud Score: ${fraudScore})`);
      
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
      
      // If fraudScore > 0.7, emit separate event or log for admin
      if (fraudScore > 0.7) {
        console.log(`⚠️ FRAUD ALERT: Donation ${donationId} flagged with score ${fraudScore}`);
      }
      
      console.log(`✅ Donation recorded - ID: ${donationId}, Status: ${statusStr}`);
      
      return {
        success: true,
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        donationId: donationId,
        fraudScore,  // Return for UI
        status: statusStr
      };
    } catch (error) {
      console.error('❌ Blockchain recording error:', error);
      return {
        success: false,
        error: error.reason || error.message || 'Unknown blockchain error'
      };
    }
  }

  // ... (rest unchanged: getDonationById, getTotalStats, extractDonationId, healthCheck)
  // For getTotalStats, add fraud count if contract supports
  async getTotalStats() {
    // ... existing
    // Mock fraud addition for demo
    const flagged = Math.floor(Math.random() * 5);  // Integrate real if needed
    return { ...stats, flaggedDonations: flagged };
  }
}

module.exports = new BlockchainService();