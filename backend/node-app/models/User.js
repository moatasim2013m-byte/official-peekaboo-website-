const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  password_hash: { type: String, required: true },
  name: { type: String, required: true },
  phone: { type: String },
  role: { type: String, enum: ['parent', 'admin', 'staff'], default: 'parent' },
  loyalty_points: { type: Number, default: 0 },
  is_disabled: { type: Boolean, default: false },
  email_verified: { type: Boolean, default: false },
  email_verify_token: { type: String, default: null },
  email_verify_expires: { type: Date, default: null },
  reset_token: { type: String },
  reset_token_expires: { type: Date },
  lastWinbackAt: { type: Date },
  created_at: { type: Date, default: Date.now }
});

// Remove _id from JSON responses
userSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    delete ret.password_hash;
    delete ret.reset_token;
    delete ret.reset_token_expires;
    delete ret.email_verify_token;
    delete ret.email_verify_expires;
    return ret;
  }
});

module.exports = mongoose.model('User', userSchema);
