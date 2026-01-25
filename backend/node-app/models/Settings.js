const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true },
  updated_at: { type: Date, default: Date.now }
});

settingsSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Settings', settingsSchema);
