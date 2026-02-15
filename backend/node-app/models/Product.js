const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  nameAr: { type: String, required: true, trim: true },
  nameEn: { type: String, required: true, trim: true },
  priceJD: { type: Number, required: true, min: 0 },
  imageUrl: { type: String, default: '' },
  active: { type: Boolean, default: true },
  sku: { type: String, required: true, unique: true, trim: true },
  stockQty: { type: Number, min: 0 }
}, {
  timestamps: true
});

productSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Product', productSchema);
