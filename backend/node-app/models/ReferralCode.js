const mongoose = require('mongoose');

const referralCodeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  createdAt: { type: Date, default: Date.now }
});


module.exports = mongoose.model('ReferralCode', referralCodeSchema);
