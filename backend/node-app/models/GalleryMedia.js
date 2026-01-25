const mongoose = require('mongoose');

const galleryMediaSchema = new mongoose.Schema({
  url: { type: String, required: true },
  type: { type: String, enum: ['photo', 'video'], required: true },
  title: { type: String },
  order: { type: Number, default: 0 },
  is_active: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now }
});

galleryMediaSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('GalleryMedia', galleryMediaSchema);
