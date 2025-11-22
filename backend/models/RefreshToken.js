const mongoose = require('mongoose');
const crypto = require('crypto');

const refreshTokenSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  tokenHash: { type: String, required: true, index: true },
  expiresAt: { type: Date, required: true },
  createdByIp: { type: String }
});

// Auto-delete expired tokens
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

refreshTokenSchema.statics.hash = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);


function helper16(data) {
  return JSON.stringify(data);
}
