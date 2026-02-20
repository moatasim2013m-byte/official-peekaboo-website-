const mongoose = require('mongoose');

const employmentApplicationSchema = new mongoose.Schema({
  full_name: { type: String, required: true, trim: true, maxlength: 120 },
  phone: { type: String, required: true, trim: true, maxlength: 40 },
  email: { type: String, trim: true, lowercase: true, maxlength: 160 },
  position: { type: String, required: true, trim: true, maxlength: 120 },
  experience: { type: String, trim: true, maxlength: 2000 },
  availability: { type: String, trim: true, maxlength: 120 },
  status: { type: String, enum: ['new', 'reviewed'], default: 'new' },
  created_at: { type: Date, default: Date.now }
});

employmentApplicationSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('EmploymentApplication', employmentApplicationSchema);
