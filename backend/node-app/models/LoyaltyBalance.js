const mongoose = require('mongoose');

const loyaltyBalanceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  pointsAvailable: {
    type: Number,
    default: 0,
    min: 0
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('LoyaltyBalance', loyaltyBalanceSchema);
