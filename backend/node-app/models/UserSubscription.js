const mongoose = require('mongoose');

const userSubscriptionSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  child_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Child', required: true },
  plan_id: { type: mongoose.Schema.Types.ObjectId, ref: 'SubscriptionPlan', required: true },
  remaining_visits: { type: Number, required: true },
  expires_at: { type: Date, required: true },
  payment_id: { type: String },
  status: { type: String, enum: ['active', 'expired', 'consumed'], default: 'active' },
  created_at: { type: Date, default: Date.now }
});

userSubscriptionSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    ret.user_id = ret.user_id.toString();
    ret.child_id = ret.child_id.toString();
    ret.plan_id = ret.plan_id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('UserSubscription', userSubscriptionSchema);
