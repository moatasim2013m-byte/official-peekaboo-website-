const mongoose = require('mongoose');

const referralRedemptionSchema = new mongoose.Schema({
  referrerUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  referredUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
  status: { type: String, enum: ['pending', 'awarded'], default: 'pending', index: true },
  redeemedAt: { type: Date, default: Date.now }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

module.exports = mongoose.model('ReferralRedemption', referralRedemptionSchema);
