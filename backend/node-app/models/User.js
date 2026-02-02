const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  password_hash: { type: String, required: true },
  name: { type: String, required: true },
  phone: { type: String },
  role: { type: String, enum: ['parent', 'admin', 'staff'], default: 'parent' },
  loyalty_points: { type: Number, default: 0 },
  reset_token: { type: String },
  reset_token_expires: { type: Date },
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
    return ret;
  }
});

module.exports = mongoose.model('User', userSchema);
