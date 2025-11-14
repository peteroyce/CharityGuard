const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  transactionHash: {
    type: String,
    required: true,
    unique: true
  },
  nonprofitName: {
    type: String,
    required: true
  },
  nonprofitEIN: {
    type: String,
    default: "Unknown"
  },
  donorAddress: {
    type: String,
    required: true
  },
  recipientAddress: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  blockNumber: {
    type: Number,
    default: 0
  },
  gasUsed: {
    type: String,
    default: "21000"
  },
  status: {
    type: String,
    enum: ['pending', 'verified', 'flagged', 'blocked'],
    default: 'pending'
  },
  isFraudulent: {
    type: Boolean,
    default: false
  },
  fraudScore: {
    type: Number,
    min: 0,
    max: 1,
    default: 0
  },
  riskFlags: [{
    type: String
  }],
  aiAnalysis: {
    patternMatch: String,
    amountAnomaly: String,
    walletAge: String,
    transactionCount: String
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
transactionSchema.index({ status: 1, isFraudulent: 1, fraudScore: -1 });
transactionSchema.index({ donorAddress: 1 });
transactionSchema.index({ timestamp: -1 });
transactionSchema.index({ nonprofitEIN: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);

