const mongoose = require('mongoose');

const subscriptionPlanSchema = new mongoose.Schema({
  name: { type: String, required: true },
  name_ar: { type: String },
  description: { type: String },
  description_ar: { type: String },
  visits: { type: Number, required: true },
  price: { type: Number, required: true },
  is_daily_pass: { type: Boolean, default: false },
  valid_days: { type: [String], default: [] }, // ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday']
  is_active: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now }
});

subscriptionPlanSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);
