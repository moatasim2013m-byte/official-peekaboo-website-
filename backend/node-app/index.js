require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();


// Middleware
app.use(cors({ origin: process.env.CORS_ORIGINS === '*' ? true : process.env.CORS_ORIGINS?.split(',') }));
app.use(express.json());

// Serve uploaded images
app.use('/api/uploads', express.static(path.join(__dirname, 'uploads')));

// Import routes
const authRoutes = require('./routes/auth');
const slotsRoutes = require('./routes/slots');
const bookingsRoutes = require('./routes/bookings');
const subscriptionsRoutes = require('./routes/subscriptions');
const loyaltyRoutes = require('./routes/loyalty');
const adminRoutes = require('./routes/admin');
const staffRoutes = require('./routes/staff');
const paymentsRoutes = require('./routes/payments');
const galleryRoutes = require('./routes/gallery');
const profileRoutes = require('./routes/profile');
const themesRoutes = require('./routes/themes');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/slots', slotsRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/subscriptions', subscriptionsRoutes);
app.use('/api/loyalty', loyaltyRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/themes', themesRoutes);
// ==================== START SERVER ====================
// 2. Connect to MongoDB in the background
console.log('⏳ Attempting to connect to MongoDB...');
mongoose.connect(process.env.MONGO_URL, { dbName: process.env.DB_NAME })
  .then(() => {
    console.log('✅ Connected to MongoDB');
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
  });


// ==================== MONGODB CONNECT ====================
const mongoUrl = process.env.MONGO_URL;
const dbName = process.env.DB_NAME || 'peekaboo';

if (!mongoUrl) {
  console.error('❌ MONGO_URL is missing. App will run but DB features will NOT work.');
} else {
  console.log('⏳ Attempting to connect to MongoDB Atlas...');
  mongoose
    .connect(mongoUrl, { dbName })
    .then(() => console.log('✅ Connected to MongoDB:', dbName))
    .catch((err) => console.error('❌ MongoDB connection error:', err));
}


// ================= FRONTEND =================

// Serve frontend build
// ================= FRONTEND =================
const fs = require('fs');
const frontendBuildPath = path.join(__dirname, '../../frontend/build');

console.log('[Peekaboo] Serving frontend from:', frontendBuildPath);

app.use(express.static(frontendBuildPath));

app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(frontendBuildPath, 'index.html'));
});


// Public settings endpoint (for homepage hero config)
const Settings = require('./models/Settings');
app.get('/api/settings', async (req, res) => {
  try {
    // Settings are stored as individual key-value documents
    const settingsDocs = await Settings.find({
      key: { $in: ['hero_title', 'hero_subtitle', 'hero_cta_text', 'hero_cta_route', 'hero_image'] }
    });
    
    // Convert to object
    const settings = {};
    settingsDocs.forEach(doc => {
      settings[doc.key] = doc.value;
    });
    
    res.json({ settings });
  } catch (error) {
    res.json({ settings: {} });
  }
});

// Health check
app.get('/api/', (req, res) => {
  res.json({ message: 'Peekaboo API is running!' });
});

// Connect to MongoDB
// --- NEW STARTUP CODE ---

// FIX: Define the PORT variable here!
const PORT = process.env.PORT || 8080;
// 1. Start the server IMMEDIATELY (Don't wait for DB)
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running immediately on port ${PORT}`);
});

// 2. Connect to MongoDB in the background
console.log('⏳ Attempting to connect to MongoDB...');
mongoose.connect(process.env.MONGO_URL, { dbName: process.env.DB_NAME })
  .then(() => {
    console.log('✅ Connected to MongoDB');
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    // Keep server alive even if DB fails initially
  });
