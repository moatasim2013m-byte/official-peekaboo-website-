const mongoose = require('mongoose');

const ALLOWED_REF_TYPES = ['hourly', 'birthday', 'subscription', 'product', 'referral', 'admin', 'winback'];

const loyaltyLedgerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  pointsDelta: {
    type: Number,
    required: true
  },
  reason: {
    type: String,
    required: true,
    trim: true
  },
  refType: {
    type: String,
    enum: ALLOWED_REF_TYPES,
    required: true
  },
  refId: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
    validate: {
      validator(value) {
        return typeof value === 'string' || value instanceof mongoose.Types.ObjectId;
      },
      message: 'refId must be a string or ObjectId'
    }
  },
  expiresAt: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

loyaltyLedgerSchema.index({ userId: 1, refType: 1, refId: 1 }, { unique: true });

module.exports = mongoose.model('LoyaltyLedger', loyaltyLedgerSchema);
