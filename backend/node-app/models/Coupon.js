const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, trim: true, uppercase: true },
  description: { type: String, default: '' },
  discount_type: { type: String, enum: ['fixed', 'percent'], required: true },
  discount_value: { type: Number, required: true, min: 0 },
  max_discount: { type: Number, min: 0 },
  min_order_amount: { type: Number, min: 0, default: 0 },
  applies_to: [{ type: String, enum: ['hourly', 'birthday', 'subscription'] }],
  usage_limit: { type: Number, min: 1 },
  redeemed_count: { type: Number, default: 0 },
  is_active: { type: Boolean, default: true },
  starts_at: { type: Date },
  expires_at: { type: Date },
  created_at: { type: Date, default: Date.now }
});

couponSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Coupon', couponSchema);
