const mongoose = require('mongoose');

const paymentTransactionSchema = new mongoose.Schema({
  session_id: { type: String, required: true, unique: true },
  payment_id: { type: String },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'usd' },
  status: { type: String, enum: ['pending', 'paid', 'failed', 'expired'], default: 'pending' },
  payment_status: { type: String },
  type: { type: String, enum: ['hourly', 'birthday', 'subscription'], required: true },
  reference_id: { type: String }, // booking_id or subscription_id
  metadata: { type: Object },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

paymentTransactionSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    ret.user_id = ret.user_id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('PaymentTransaction', paymentTransactionSchema);
