const mongoose = require('mongoose');

const ActivityLogSchema = new mongoose.Schema({
  adminId: {
    type: String,
    required: true
  },
  adminName: {
    type: String,
    default: 'Admin'
  },
  action: {
    type: String,
    required: true,
    enum: [
      'transaction_blocked',
      'transaction_cleared',
      'transaction_review',
      'user_suspended',
      'user_activated',
      'user_banned',
      'bulk_action',
      'settings_changed'
    ]
  },
  targetType: {
    type: String,
    enum: ['transaction', 'user', 'system'],
    required: true
  },
  targetId: {
    type: String,
    required: true
  },
  details: {
    type: String
  },
  metadata: {
    type: Object
  },
  ipAddress: {
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

ActivityLogSchema.index({ timestamp: -1 });
ActivityLogSchema.index({ adminId: 1 });
ActivityLogSchema.index({ targetId: 1 });

module.exports = mongoose.model('ActivityLog', ActivityLogSchema);
