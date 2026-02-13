const mongoose = require('mongoose');

const aiThemeSchema = new mongoose.Schema({
  prompt: { type: String, required: true, trim: true },
  aspect_ratio: { type: String, default: null },
  status: { type: String, enum: ['pending', 'generated', 'failed'], default: 'pending' },
  image_url: { type: String, default: null },
  error_message: { type: String, default: null }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

module.exports = mongoose.model('AITheme', aiThemeSchema);
