const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  nonprofit: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Nonprofit',
    required: true,
    index: true
  },
  nonprofitName: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0.01
  },
  donorWallet: {
    type: String,
    trim: true,
    default: 'anonymous'
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000,
    default: ''
  },
  fraudScore: {
    type: Number,
    min: 0,
    max: 1,
    default: 0
  },
  status: {
    type: String,
    enum: ['completed', 'flagged', 'under_review', 'blocked'],
    default: 'completed',
    index: true
  },
  date: {
    type: Date,
    default: Date.now,
    index: true
  },
  createdBy: {
    type: String,
    trim: true,
    default: ''
  }
}, {
  timestamps: true
});

// Compound indexes for optimized queries
TransactionSchema.index({ nonprofit: 1, date: -1 });
TransactionSchema.index({ fraudScore: -1, status: 1 });

module.exports = mongoose.model('Transaction', TransactionSchema);