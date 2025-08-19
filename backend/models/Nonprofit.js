const mongoose = require('mongoose');

const NonprofitSchema = new mongoose.Schema({
  name: { type: String, required: true },
  registrationNumber: { type: String, unique: true, required: true },
  address: { type: String },
  verificationStatus: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Nonprofit', NonprofitSchema);
