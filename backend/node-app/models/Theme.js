const mongoose = require('mongoose');

const themeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  image_url: { type: String },
  is_active: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now }
});

themeSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Theme', themeSchema);
