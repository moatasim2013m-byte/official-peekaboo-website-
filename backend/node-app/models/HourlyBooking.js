const mongoose = require('mongoose');

const hourlyBookingSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  child_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Child', required: true },
  slot_id: { type: mongoose.Schema.Types.ObjectId, ref: 'TimeSlot', required: true },
  qr_code: { type: String, required: true },
  booking_code: { type: String, required: true, unique: true },
  status: { type: String, enum: ['pending', 'confirmed', 'checked_in', 'completed', 'cancelled'], default: 'pending' },
  check_in_time: { type: Date },
  session_end_time: { type: Date },
  payment_id: { type: String },
  amount: { type: Number, required: true },
  created_at: { type: Date, default: Date.now }
});

hourlyBookingSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    ret.user_id = ret.user_id.toString();
    ret.child_id = ret.child_id.toString();
    ret.slot_id = ret.slot_id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('HourlyBooking', hourlyBookingSchema);
