require('dotenv').config({ path: '../.env' });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = 8001;

// Middleware
app.use(cors({ origin: process.env.CORS_ORIGINS === '*' ? true : process.env.CORS_ORIGINS?.split(',') }));
app.use(express.json());

// Import routes
const authRoutes = require('./routes/auth');
const slotsRoutes = require('./routes/slots');
const bookingsRoutes = require('./routes/bookings');
const subscriptionsRoutes = require('./routes/subscriptions');
const loyaltyRoutes = require('./routes/loyalty');
const adminRoutes = require('./routes/admin');
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
app.use('/api/payments', paymentsRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/themes', themesRoutes);

// Health check
app.get('/api/', (req, res) => {
  res.json({ message: 'Peekaboo API is running!' });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URL, { dbName: process.env.DB_NAME })
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
