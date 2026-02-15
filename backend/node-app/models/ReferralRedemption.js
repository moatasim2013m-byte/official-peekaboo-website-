const mongoose = require('mongoose');

const referralRedemptionSchema = new mongoose.Schema({
  referrerUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  referredUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  redeemedAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['pending', 'awarded'], default: 'pending' }
});

referralRedemptionSchema.index({ referrerUserId: 1, status: 1 });

module.exports = mongoose.model('ReferralRedemption', referralRedemptionSchema);
