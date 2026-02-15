const mongoose = require('mongoose');

const loyaltyLedgerSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  pointsDelta: { type: Number, required: true },
  reason: { type: String, required: true },
  refType: {
    type: String,
    enum: ['hourly', 'birthday', 'subscription', 'purchase', 'admin', 'referral'],
    required: true
  },
  refId: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('LoyaltyLedger', loyaltyLedgerSchema);
