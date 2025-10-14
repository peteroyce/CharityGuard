const mongoose = require('mongoose');

const NonprofitSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  registrationNumber: { type: String, required: true, unique: true, uppercase: true, trim: true },
  address: { type: String, required: true, trim: true },
  
  // Verification and trust fields
  verificationStatus: { 
    type: String, 
    enum: ['pending', 'verified', 'rejected', 'suspended'], 
    default: 'pending' 
  },
  trustLevel: { 
    type: String, 
    enum: ['new', 'trusted', 'whitelisted', 'blacklisted'], 
    default: 'new' 
  },
  
  // Trust management
  whitelistedAt: { type: Date },
  whitelistReason: { type: String },
  trustScore: { type: Number, min: 0, max: 1, default: 0.5 },
  
  // Additional verification data
  verifiedAt: { type: Date },
  verifiedBy: { type: String },
  verificationDocuments: [{ 
    type: String,
    url: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  
  // Contact information
  contactEmail: { 
    type: String,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
  },
  contactPhone: { type: String, trim: true },
  website: { type: String, trim: true },
  
  // Organization details
  category: {
    type: String,
    enum: ['education', 'healthcare', 'environment', 'social', 'religious', 'arts', 'animals', 'human_rights', 'other'],
    default: 'other'
  },
  description: { type: String, maxlength: 1000 },
  establishedYear: { type: Number, min: 1800, max: new Date().getFullYear() },
  
  // Operational metrics
  donationCount: { type: Number, default: 0 },
  totalDonationsReceived: { type: Number, default: 0 },
  averageDonationAmount: { type: Number, default: 0 },
  lastDonationDate: { type: Date },
  
  // Risk management
  riskFlags: [{
    type: String,
    reason: String,
    flaggedAt: { type: Date, default: Date.now },
    flaggedBy: String,
    resolved: { type: Boolean, default: false }
  }],
  fraudScore: { type: Number, min: 0, max: 1, default: 0 },
  
  // Compliance
  taxExemptStatus: { type: Boolean, default: false },
  taxExemptNumber: { type: String },
  complianceNotes: { type: String },
  
  // System fields
  isActive: { type: Boolean, default: true },
  lastUpdated: { type: Date, default: Date.now },
  notes: { type: String, maxlength: 2000 }
}, {
  timestamps: true
});

// Pre-save middleware to update metrics
NonprofitSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

// Methods for trust management
NonprofitSchema.methods.updateTrustScore = function(newScore, reason) {
  this.trustScore = Math.max(0, Math.min(newScore, 1));
  if (newScore > 0.9 && this.donationCount > 20) {
    this.trustLevel = 'whitelisted';
    this.whitelistedAt = new Date();
    this.whitelistReason = reason || 'High trust score and donation volume';
  }
};

NonprofitSchema.methods.addRiskFlag = function(flag, reason, flaggedBy) {
  this.riskFlags.push({
    type: flag,
    reason: reason,
    flaggedBy: flaggedBy
  });
  
  // Update fraud score based on flags
  const activeFlags = this.riskFlags.filter(f => !f.resolved);
  this.fraudScore = Math.min(0.3 + (activeFlags.length * 0.2), 1.0);
};

NonprofitSchema.methods.updateDonationMetrics = async function() {
  const Transaction = mongoose.model('Transaction');
  
  const stats = await Transaction.aggregate([
    { $match: { nonprofit: this._id } },
    {
      $group: {
        _id: null,
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        avgAmount: { $avg: '$amount' },
        lastDonation: { $max: '$date' }
      }
    }
  ]);
  
  if (stats.length > 0) {
    const stat = stats[0];
    this.donationCount = stat.count; 
    this.totalDonationsReceived = stat.totalAmount;
    this.averageDonationAmount = stat.avgAmount;
    this.lastDonationDate = stat.lastDonation;
  }
  
  return this.save();
};

// Static methods
NonprofitSchema.statics.findTrusted = function() {
  return this.find({ 
    trustLevel: { $in: ['trusted', 'whitelisted'] },
    isActive: true 
  });
};

NonprofitSchema.statics.findHighRisk = function() {
  return this.find({ 
    $or: [
      { fraudScore: { $gte: 0.5 } },
      { trustLevel: 'blacklisted' },
      { riskFlags: { $elemMatch: { resolved: false } } }
    ]
  });
};

NonprofitSchema.statics.getVerificationStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: '$verificationStatus',
        count: { $sum: 1 }
      }
    }
  ]);
  
  return stats.reduce((acc, stat) => {
    acc[stat._id] = stat.count;
    return acc;
  }, {});
};

module.exports = mongoose.model('Nonprofit', NonprofitSchema);