const mongoose = require('mongoose');

const referralCodeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
  code: { type: String, required: true, unique: true, index: true }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

module.exports = mongoose.model('ReferralCode', referralCodeSchema);
