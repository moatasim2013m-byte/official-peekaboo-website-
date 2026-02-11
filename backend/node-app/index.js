require('dotenv').config();
console.log('BOOT_START');
console.log('PORT', process.env.PORT);

// ==================== PROCESS ERROR HANDLERS ====================
process.on('unhandledRejection', (reason, promise) => {
  console.error('[UNHANDLED_REJECTION]', reason);
  console.error('[UNHANDLED_REJECTION_STACK]', reason?.stack || 'no stack');
});

process.on('uncaughtException', (err) => {
  console.error('[UNCAUGHT_EXCEPTION]', err.message);
  console.error('[UNCAUGHT_EXCEPTION_STACK]', err.stack);
});

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');

const app = express();

const allowedOrigins =
  process.env.CORS_ORIGINS === '*'
    ? true
    : (process.env.CORS_ORIGINS || '').split(',').filter(Boolean);

// Middleware
app.use(cors({
  origin: allowedOrigins.length ? allowedOrigins : true,
  credentials: true
}));
app.use(express.json({ limit: '1mb' }));
app.use(helmet());
app.use(mongoSanitize());

// ==================== HEALTH CHECK (before rate limiting) ====================
app.get('/healthz', (req, res) => res.status(200).send('ok'));

// Basic API rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false
});

// Strict rate limiting for auth endpoints (login, forgot-password)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'OPTIONS', // Allow CORS preflight
  message: { error: 'محاولات كثيرة جداً، الرجاء المحاولة بعد 15 دقيقة' }
});

app.use('/api', apiLimiter);

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
// Apply strict auth limiter to sensitive endpoints
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);

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

// ================= FRONTEND =================
const fs = require('fs');

const frontendPaths = [
  path.join(__dirname, '../frontend/build'),      // Cloud Run
  path.join(__dirname, '../../frontend/build')   // Local dev
];

const frontendBuildPath = frontendPaths.find(p => fs.existsSync(p));

if (frontendBuildPath) {
  console.log('[Peekaboo] Serving frontend from:', frontendBuildPath);

  app.use(express.static(frontendBuildPath));

  // SPA catch-all (Express 5 safe)
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(frontendBuildPath, 'index.html'));
  });

} else {
  console.log('[Peekaboo] Frontend build not found. Serving API only.');
}

// ==================== GLOBAL ERROR HANDLER ====================
app.use((err, req, res, next) => {
  console.error('[GLOBAL_ERROR]', {
    method: req.method,
    url: req.originalUrl,
    message: err.message,
    stack: err.stack
  });
  res.status(err.status || 500).json({ error: 'حدث خطأ في الخادم' });
});

// ==================== ENV VALIDATION (before server start) ====================
const requiredEnvVars = ['SENDER_EMAIL', 'RESEND_API_KEY', 'MONGO_URL', 'FRONTEND_URL', 'JWT_SECRET'];
const isProduction = process.env.NODE_ENV === 'production';

console.log('=== Environment Variables Check ===');
let hasAllVars = true;
requiredEnvVars.forEach(varName => {
  const isPresent = Boolean(process.env[varName]);
  console.log(`ENV_OK ${varName} ${isPresent}`);
  if (!isPresent) {
    console.error(`FATAL: Required env var ${varName} is missing`);
    hasAllVars = false;
  }
});

if (!hasAllVars && isProduction) {
  console.error('FATAL: Missing required env vars in production. Exiting.');
  process.exit(1);
} else if (hasAllVars) {
  console.log('=== All required env vars present ===');
}

// ==================== MONGODB CONNECT ====================
const mongoUrl = process.env.MONGO_URL;

if (!mongoUrl) {
  console.error('❌ MONGO_URL is missing. App will run but DB features will NOT work.');
} else {
  console.log('⏳ Attempting to connect to MongoDB...');
  
  const options = { serverSelectionTimeoutMS: 10000 };
  if (process.env.DB_NAME) {
    options.dbName = process.env.DB_NAME;
  }
  
  mongoose
    .connect(mongoUrl, options)
    .then(() => {
      const dbName = process.env.DB_NAME || 'from URI';
      console.log('✅ Connected to MongoDB:', dbName);
      console.log('DB_CONNECTED name=' + mongoose.connection.name + ' host=' + mongoose.connection.host);
    })
    .catch((err) => console.error('❌ MongoDB connection error:', err));
}

// ==================== START SERVER ====================
const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
  console.log('LISTENING', PORT);
});
