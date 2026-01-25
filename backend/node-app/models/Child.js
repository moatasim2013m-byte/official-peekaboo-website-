const mongoose = require('mongoose');

const childSchema = new mongoose.Schema({
  parent_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  birthday: { type: Date, required: true },
  created_at: { type: Date, default: Date.now }
});

childSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    ret.parent_id = ret.parent_id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Child', childSchema);
