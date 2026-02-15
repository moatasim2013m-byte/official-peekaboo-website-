const mongoose = require('mongoose');

const winbackLogSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  refType: {
    type: String,
    required: true,
    enum: ['winback'],
    default: 'winback'
  },
  refId: {
    type: String,
    required: true,
    unique: true
  },
  points_awarded: {
    type: Number,
    default: 0
  },
  sent_at: {
    type: Date,
    default: Date.now,
    index: true
  }
});

winbackLogSchema.index({ user_id: 1, sent_at: -1 });

module.exports = mongoose.model('WinbackLog', winbackLogSchema);
