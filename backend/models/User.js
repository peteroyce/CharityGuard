const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  googleId: { 
    type: String, 
    required: true, 
    unique: true,
    index: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true,
    trim: true 
  },
  name: { 
    type: String, 
    required: true,
    trim: true 
  },
  picture: { 
    type: String,
    default: '' 
  },
  donations: [{
    charityId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Nonprofit',
      required: true 
    },
    amount: { 
      type: Number, 
      required: true,
      min: 0.01 
    },
    date: { 
      type: Date, 
      default: Date.now 
    },
    paymentIntentId: { 
      type: String,
      required: true 
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'completed'
    }
  }],
  isActive: { 
    type: Boolean, 
    default: true 
  },
  lastLoginAt: { 
    type: Date, 
    default: Date.now 
  }
}, { 
  timestamps: true 
});

module.exports = mongoose.model('User', UserSchema);