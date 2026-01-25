const mongoose = require('mongoose');

const loyaltyHistorySchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  points: { type: Number, required: true },
  type: { type: String, enum: ['earned', 'adjusted'], required: true },
  reference: { type: String }, // payment_id for earned, admin note for adjusted
  source: { type: String, enum: ['hourly', 'birthday', 'subscription', 'admin'] },
  description: { type: String },
  created_at: { type: Date, default: Date.now }
});

loyaltyHistorySchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    ret.user_id = ret.user_id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('LoyaltyHistory', loyaltyHistorySchema);
