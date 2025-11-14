const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  walletAddress: { 
    type: String, 
    unique: true,
    sparse: true,
    index: true 
  },
  email: { 
    type: String, 
    sparse: true,
    lowercase: true,
    trim: true 
  },
  name: { 
    type: String,
    trim: true 
  },
  username: {
    type: String,
    trim: true
  },
  picture: { 
    type: String,
    default: '' 
  },
  totalDonated: {
    type: Number,
    default: 0,
    min: 0
  },
  donationCount: {
    type: Number,
    default: 0,
    min: 0
  },
  favoriteNonprofits: [{
    type: String
  }],
  donations: [{
    charityId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Nonprofit'
    },
    amount: { 
      type: Number,
      min: 0.01 
    },
    date: { 
      type: Date, 
      default: Date.now 
    },
    transactionHash: { 
      type: String
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'completed'
    }
  }],
  accountStatus: {
    type: String,
    enum: ['active', 'suspended', 'banned'],
    default: 'active'
  },
  suspensionReason: {
    type: String
  },
  suspendedAt: {
    type: Date
  },
  suspendedBy: {
    type: String
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationLevel: {
    type: String,
    enum: ['none', 'email', 'kyc'],
    default: 'none'
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  lastLoginAt: { 
    type: Date, 
    default: Date.now 
  },
  notes: {
    type: String
  }
}, { 
  timestamps: true
});

module.exports = mongoose.model('User', UserSchema);
