const express = require('express');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const Child = require('../models/Child');
const TimeSlot = require('../models/TimeSlot');
const HourlyBooking = require('../models/HourlyBooking');
const BirthdayBooking = require('../models/BirthdayBooking');
const UserSubscription = require('../models/UserSubscription');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const Theme = require('../models/Theme');
const Settings = require('../models/Settings');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { sendEmail, emailTemplates } = require('../utils/email');

const router = express.Router();

// Configure multer for image uploads
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10MB compressed upload limit
const MAX_INPUT_PIXELS = 40 * 1024 * 1024; // 40MP guardrail to prevent decode memory spikes
const MAX_OUTPUT_WIDTH = 1200;

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: MAX_UPLOAD_BYTES },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      return cb(null, true);
    }
    return cb(new Error('Unsupported file type. Use PNG, JPG, or WEBP.'));
  }
});

// Apply auth middleware to all admin routes
router.use(authMiddleware, adminMiddleware);

// ==================== IMAGE UPLOAD ====================
router.post('/upload-image', (req, res) => {
  upload.single('image')(req, res, async (uploadErr) => {
    if (uploadErr instanceof multer.MulterError) {
      if (uploadErr.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'Image is too large. Max size is 10MB.' });
      }
      return res.status(400).json({ error: uploadErr.message || 'Upload failed.' });
    }

    if (uploadErr) {
      return res.status(400).json({ error: uploadErr.message || 'Invalid upload payload.' });
    }

  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image provided' });
    }

    const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.webp`;
    const filepath = path.join(uploadDir, filename);

    // Guard against pathological image dimensions that can cause memory spikes.
    const imageProcessor = sharp(req.file.buffer, { failOn: 'warning', limitInputPixels: MAX_INPUT_PIXELS });

    // Resize to max configured width and convert to webp.
    await imageProcessor
      .rotate() // respect EXIF orientation
      .resize({ width: MAX_OUTPUT_WIDTH, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(filepath);

    const imageUrl = `/api/uploads/${filename}`;
    res.json({ image_url: imageUrl });
  } catch (error) {
    console.error('Upload error:', error);
    const msg = (error && error.message) || '';
    if (msg.includes('Input image exceeds pixel limit')) {
      return res.status(400).json({ error: 'Image dimensions are too large. Please upload a smaller image.' });
    }
    res.status(500).json({ error: 'Failed to upload image' });
  }
  });
});

// ==================== DASHBOARD ====================

router.get('/dashboard', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const stats = {
      total_parents: await User.countDocuments({ role: 'parent' }),
      total_children: await Child.countDocuments(),
      today_hourly_bookings: await HourlyBooking.countDocuments({
        created_at: { $gte: new Date(today) }
      }),
      today_birthday_bookings: await BirthdayBooking.countDocuments({
        created_at: { $gte: new Date(today) }
      }),
      active_subscriptions: await UserSubscription.countDocuments({ status: 'active' }),
      pending_custom_parties: await BirthdayBooking.countDocuments({ status: 'custom_pending' })
    };

    res.json({ stats });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to get dashboard' });
  }
});

// ==================== USERS ====================

router.get('/users', async (req, res) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;
    const query = {};
    
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ created_at: -1 });

    const total = await User.countDocuments(query);

    res.json({
      users: users.map(u => u.toJSON()),
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const children = await Child.find({ parent_id: req.params.id });
    const hourlyBookings = await HourlyBooking.find({ user_id: req.params.id })
      .populate('slot_id')
      .populate('child_id')
      .sort({ created_at: -1 })
      .limit(10);
    const birthdayBookings = await BirthdayBooking.find({ user_id: req.params.id })
      .populate('slot_id')
      .populate('child_id')
      .populate('theme_id')
      .sort({ created_at: -1 })
      .limit(10);
    const subscriptions = await UserSubscription.find({ user_id: req.params.id })
      .populate('plan_id')
      .populate('child_id')
      .sort({ created_at: -1 });

    res.json({
      user: user.toJSON(),
      children: children.map(c => c.toJSON()),
      hourly_bookings: hourlyBookings.map(b => b.toJSON()),
      birthday_bookings: birthdayBookings.map(b => b.toJSON()),
      subscriptions: subscriptions.map(s => s.toJSON())
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// Create admin user
router.post('/users/admin', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const user = new User({
      email: email.toLowerCase(),
      password_hash,
      name,
      role: 'admin'
    });
    await user.save();

    res.status(201).json({ user: user.toJSON() });
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({ error: 'Failed to create admin' });
  }
});

// Create staff user
router.post('/staff', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hash = await bcrypt.hash(password, 10);

    const staffUser = await User.create({
      email: email.toLowerCase().trim(),
      password_hash: hash,
      name: name || 'Staff',
      role: 'staff'
    });

    return res.status(201).json({
      ok: true,
      staff: {
        id: staffUser._id,
        email: staffUser.email,
        name: staffUser.name,
        role: staffUser.role
      }
    });
  } catch (err) {
    console.error('Create staff error:', err);
    return res.status(500).json({ error: 'Failed to create staff user' });
  }
});

// ==================== BOOKINGS ====================

router.get('/bookings/hourly', async (req, res) => {
  try {
    const { date, status, page = 1, limit = 20 } = req.query;
    const query = {};
    
    if (date) {
      const slots = await TimeSlot.find({ date });
      query.slot_id = { $in: slots.map(s => s._id) };
    }
    if (status) query.status = status;

    const bookings = await HourlyBooking.find(query)
      .populate('user_id')
      .populate('slot_id')
      .populate('child_id')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ created_at: -1 });

    const total = await HourlyBooking.countDocuments(query);

    res.json({
      bookings: bookings.map(b => ({
        ...b.toJSON(),
        user: b.user_id?.toJSON(),
        slot: b.slot_id?.toJSON(),
        child: b.child_id?.toJSON()
      })),
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Get hourly bookings error:', error);
    res.status(500).json({ error: 'Failed to get bookings' });
  }
});

router.get('/bookings/birthday', async (req, res) => {
  try {
    const { date, status, page = 1, limit = 20 } = req.query;
    const query = {};
    
    if (date) {
      const slots = await TimeSlot.find({ date });
      query.slot_id = { $in: slots.map(s => s._id) };
    }
    if (status) query.status = status;

    const bookings = await BirthdayBooking.find(query)
      .populate('user_id')
      .populate('slot_id')
      .populate('child_id')
      .populate('theme_id')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ created_at: -1 });

    const total = await BirthdayBooking.countDocuments(query);

    res.json({
      bookings: bookings.map(b => ({
        ...b.toJSON(),
        user: b.user_id?.toJSON(),
        slot: b.slot_id?.toJSON(),
        child: b.child_id?.toJSON(),
        theme: b.theme_id?.toJSON()
      })),
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Get birthday bookings error:', error);
    res.status(500).json({ error: 'Failed to get bookings' });
  }
});

// Update booking status
router.put('/bookings/hourly/:id', async (req, res) => {
  try {
    const { status, payment_status } = req.body;
    const booking = await HourlyBooking.findById(req.params.id)
      .populate('slot_id')
      .populate('child_id')
      .populate('user_id');

    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    const wasPending = ['pending_cash', 'pending_cliq'].includes(booking.payment_status);
    if (status !== undefined) booking.status = status;
    if (payment_status !== undefined) booking.payment_status = payment_status;
    await booking.save();

    const becamePaid = wasPending && booking.payment_status === 'paid';
    if (becamePaid && booking.user_id?.email) {
      try {
        const template = emailTemplates.finalOrderConfirmation({
          userName: booking.user_id?.name,
          orderType: 'Hourly Play',
          serviceName: 'Hourly Play',
          serviceDate: booking.slot_id?.date,
          serviceTime: booking.slot_id?.start_time,
          totalPrice: booking.amount || 0
        });
        await sendEmail(booking.user_id.email, template.subject, template.html);
      } catch (emailErr) {
        console.error('ADMIN_HOURLY_FINAL_EMAIL_ERROR', emailErr.message || emailErr);
      }
    }

    res.json({ booking: booking.toJSON() });
  } catch (error) {
    console.error('Update booking error:', error);
    res.status(500).json({ error: 'Failed to update booking' });
  }
});

router.put('/bookings/birthday/:id', async (req, res) => {
  try {
    const { status, payment_status } = req.body;
    const booking = await BirthdayBooking.findById(req.params.id)
      .populate('slot_id')
      .populate('child_id')
      .populate('theme_id')
      .populate('user_id');

    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    const wasPending = ['pending_cash', 'pending_cliq'].includes(booking.payment_status);
    if (status !== undefined) booking.status = status;
    if (payment_status !== undefined) booking.payment_status = payment_status;
    await booking.save();

    const becamePaid = wasPending && booking.payment_status === 'paid';
    if (becamePaid && booking.user_id?.email) {
      try {
        const template = emailTemplates.finalOrderConfirmation({
          userName: booking.user_id?.name,
          orderType: 'Birthday',
          serviceName: booking.theme_id?.name || 'Birthday Party',
          serviceDate: booking.slot_id?.date,
          serviceTime: booking.slot_id?.start_time,
          totalPrice: booking.amount || 0
        });
        await sendEmail(booking.user_id.email, template.subject, template.html);
      } catch (emailErr) {
        console.error('ADMIN_BIRTHDAY_FINAL_EMAIL_ERROR', emailErr.message || emailErr);
      }
    }

    res.json({ booking: booking.toJSON() });
  } catch (error) {
    console.error('Update booking error:', error);
    res.status(500).json({ error: 'Failed to update booking' });
  }
});

// ==================== SUBSCRIPTIONS ====================

router.get('/subscriptions', async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;

    const subscriptions = await UserSubscription.find(query)
      .populate('user_id')
      .populate('child_id')
      .populate('plan_id')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ created_at: -1 });

    const total = await UserSubscription.countDocuments(query);

    res.json({
      subscriptions: subscriptions.map(s => ({
        ...s.toJSON(),
        user: s.user_id?.toJSON(),
        child: s.child_id?.toJSON(),
        plan: s.plan_id?.toJSON()
      })),
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Get subscriptions error:', error);
    res.status(500).json({ error: 'Failed to get subscriptions' });
  }
});

router.put('/subscriptions/:id/payment-confirmation', async (req, res) => {
  try {
    const { payment_status = 'paid' } = req.body;
    const subscription = await UserSubscription.findById(req.params.id)
      .populate('user_id')
      .populate('child_id')
      .populate('plan_id');

    if (!subscription) return res.status(404).json({ error: 'Subscription not found' });

    const wasPending = ['pending_cash', 'pending_cliq'].includes(subscription.payment_status);
    subscription.payment_status = payment_status;
    await subscription.save();

    const becamePaid = wasPending && subscription.payment_status === 'paid';
    if (becamePaid && subscription.user_id?.email) {
      try {
        const template = emailTemplates.finalOrderConfirmation({
          userName: subscription.user_id?.name,
          orderType: 'Subscription',
          serviceName: subscription.plan_id?.name_ar || subscription.plan_id?.name || 'Subscription',
          serviceDate: new Date(subscription.created_at).toLocaleDateString('en-GB'),
          serviceTime: new Date(subscription.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
          totalPrice: subscription.plan_id?.price || 0
        });
        await sendEmail(subscription.user_id.email, template.subject, template.html);
      } catch (emailErr) {
        console.error('ADMIN_SUBSCRIPTION_FINAL_EMAIL_ERROR', emailErr.message || emailErr);
      }
    }

    res.json({ subscription: subscription.toJSON() });
  } catch (error) {
    console.error('Update subscription payment error:', error);
    res.status(500).json({ error: 'Failed to update subscription payment' });
  }
});

// ==================== SUBSCRIPTION PLANS ====================

router.get('/plans', async (req, res) => {
  try {
    const plans = await SubscriptionPlan.find().sort({ price: 1 });
    res.json({ plans: plans.map(p => p.toJSON()) });
  } catch (error) {
    console.error('Get plans error:', error);
    res.status(500).json({ error: 'Failed to get plans' });
  }
});

router.post('/plans', async (req, res) => {
  try {
    const { name, name_ar, description, description_ar, visits, price, is_daily_pass, valid_days } = req.body;
    const plan = new SubscriptionPlan({ 
      name, 
      name_ar, 
      description, 
      description_ar, 
      visits, 
      price,
      is_daily_pass,
      valid_days
    });
    await plan.save();
    res.status(201).json({ plan: plan.toJSON() });
  } catch (error) {
    console.error('Create plan error:', error);
    res.status(500).json({ error: 'Failed to create plan' });
  }
});

router.put('/plans/:id', async (req, res) => {
  try {
    const { name, name_ar, description, description_ar, visits, price, is_active, is_daily_pass, valid_days } = req.body;
    const plan = await SubscriptionPlan.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    if (name !== undefined) plan.name = name;
    if (name_ar !== undefined) plan.name_ar = name_ar;
    if (description !== undefined) plan.description = description;
    if (description_ar !== undefined) plan.description_ar = description_ar;
    if (visits !== undefined) plan.visits = visits;
    if (price !== undefined) plan.price = price;
    if (is_active !== undefined) plan.is_active = is_active;
    if (is_daily_pass !== undefined) plan.is_daily_pass = is_daily_pass;
    if (valid_days !== undefined) plan.valid_days = valid_days;
    
    await plan.save();
    res.json({ plan: plan.toJSON() });
  } catch (error) {
    console.error('Update plan error:', error);
    res.status(500).json({ error: 'Failed to update plan' });
  }
});

router.delete('/plans/:id', async (req, res) => {
  try {
    await SubscriptionPlan.findByIdAndDelete(req.params.id);
    res.json({ message: 'Plan deleted successfully' });
  } catch (error) {
    console.error('Delete plan error:', error);
    res.status(500).json({ error: 'Failed to delete plan' });
  }
});

// ==================== SETTINGS ====================

router.get('/settings', async (req, res) => {
  try {
    const settings = await Settings.find();
    const settingsObj = {};
    settings.forEach(s => { settingsObj[s.key] = s.value; });
    res.json({ settings: settingsObj });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Failed to get settings' });
  }
});

router.put('/settings', async (req, res) => {
  try {
    const updates = req.body;
    
    for (const [key, value] of Object.entries(updates)) {
      await Settings.findOneAndUpdate(
        { key },
        { key, value, updated_at: new Date() },
        { upsert: true }
      );
    }
    
    res.json({ message: 'Settings updated' });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// ==================== PRICING MANAGEMENT ====================

// Get pricing configuration
router.get('/pricing', async (req, res) => {
  try {
    const pricing = await Settings.find({ 
      key: { $in: ['hourly_1hr', 'hourly_2hr', 'hourly_3hr', 'hourly_extra_hr'] } 
    });
    
    const pricingObj = {
      hourly_1hr: 7,
      hourly_2hr: 10,
      hourly_3hr: 13,
      hourly_extra_hr: 3
    };
    
    pricing.forEach(p => { pricingObj[p.key] = parseFloat(p.value); });
    res.json({ pricing: pricingObj });
  } catch (error) {
    console.error('Get pricing error:', error);
    res.status(500).json({ error: 'Failed to get pricing' });
  }
});

// Update pricing
router.put('/pricing', async (req, res) => {
  try {
    const { hourly_1hr, hourly_2hr, hourly_3hr, hourly_extra_hr } = req.body;
    
    const updates = [
      { key: 'hourly_1hr', value: parseFloat(hourly_1hr) || 7 },
      { key: 'hourly_2hr', value: parseFloat(hourly_2hr) || 10 },
      { key: 'hourly_3hr', value: parseFloat(hourly_3hr) || 13 },
      { key: 'hourly_extra_hr', value: parseFloat(hourly_extra_hr) || 3 }
    ];
    
    for (const update of updates) {
      await Settings.findOneAndUpdate(
        { key: update.key },
        { key: update.key, value: update.value, updated_at: new Date() },
        { upsert: true }
      );
    }
    
    res.json({ message: 'Pricing updated successfully' });
  } catch (error) {
    console.error('Update pricing error:', error);
    res.status(500).json({ error: 'Failed to update pricing' });
  }
});

// ==================== THEMES ====================

router.get('/themes', async (req, res) => {
  try {
    const themes = await Theme.find().sort({ created_at: -1 });
    res.json({ themes: themes.map(t => t.toJSON()) });
  } catch (error) {
    console.error('Get themes error:', error);
    res.status(500).json({ error: 'Failed to get themes' });
  }
});

router.post('/themes', async (req, res) => {
  try {
    const { name, name_ar, description, description_ar, price, image_url } = req.body;
    const theme = new Theme({ name, name_ar, description, description_ar, price, image_url });
    await theme.save();
    res.status(201).json({ theme: theme.toJSON() });
  } catch (error) {
    console.error('Create theme error:', error);
    res.status(500).json({ error: 'Failed to create theme' });
  }
});

router.put('/themes/:id', async (req, res) => {
  try {
    const { name, name_ar, description, description_ar, price, image_url, is_active } = req.body;
    const theme = await Theme.findById(req.params.id);
    if (!theme) {
      return res.status(404).json({ error: 'Theme not found' });
    }

    if (name !== undefined) theme.name = name;
    if (name_ar !== undefined) theme.name_ar = name_ar;
    if (description !== undefined) theme.description = description;
    if (description_ar !== undefined) theme.description_ar = description_ar;
    if (price !== undefined) theme.price = parseFloat(price);
    if (image_url !== undefined) theme.image_url = image_url;
    if (is_active !== undefined) theme.is_active = is_active;
    
    await theme.save();
    res.json({ theme: theme.toJSON() });
  } catch (error) {
    console.error('Update theme error:', error);
    res.status(500).json({ error: 'Failed to update theme' });
  }
});

router.delete('/themes/:id', async (req, res) => {
  try {
    await Theme.findByIdAndDelete(req.params.id);
    res.json({ message: 'Theme deleted successfully' });
  } catch (error) {
    console.error('Delete theme error:', error);
    res.status(500).json({ error: 'Failed to delete theme' });
  }
});

// ==================== SLOTS ====================

router.get('/slots', async (req, res) => {
  try {
    const { date, slot_type } = req.query;
    const query = {};
    if (date) query.date = date;
    if (slot_type) query.slot_type = slot_type;

    const slots = await TimeSlot.find(query).sort({ date: 1, start_time: 1 });
    res.json({ slots: slots.map(s => s.toJSON()) });
  } catch (error) {
    console.error('Get slots error:', error);
    res.status(500).json({ error: 'Failed to get slots' });
  }
});

// ==================== BUSINESS HOURS SETTINGS ====================

// Get business hours
router.get('/business-hours', async (req, res) => {
  try {
    const settings = await Settings.find({ 
      key: { $in: ['opening_time', 'closing_time'] } 
    });
    
    const hours = {
      opening_time: '10:00',
      closing_time: '23:00'
    };
    settings.forEach(s => { hours[s.key] = s.value; });
    
    res.json(hours);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get hours' });
  }
});

// Update business hours
router.put('/business-hours', async (req, res) => {
  try {
    const { opening_time, closing_time } = req.body;
    
    await Settings.findOneAndUpdate(
      { key: 'opening_time' },
      { key: 'opening_time', value: opening_time },
      { upsert: true }
    );
    
    await Settings.findOneAndUpdate(
      { key: 'closing_time' },
      { key: 'closing_time', value: closing_time },
      { upsert: true }
    );
    
    res.json({ message: 'Hours updated' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update hours' });
  }
});

// Get blackout times
router.get('/blackouts', async (req, res) => {
  try {
    const blackouts = await Settings.findOne({ key: 'blackout_ranges' });
    res.json({ blackouts: blackouts?.value ? JSON.parse(blackouts.value) : [] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get blackouts' });
  }
});

// Add blackout
router.post('/blackouts', async (req, res) => {
  try {
    const { date, day_of_week, start_time, end_time, reason } = req.body;
    
    const setting = await Settings.findOne({ key: 'blackout_ranges' });
    const blackouts = setting?.value ? JSON.parse(setting.value) : [];
    
    blackouts.push({ date, day_of_week, start_time, end_time, reason, id: Date.now().toString() });
    
    await Settings.findOneAndUpdate(
      { key: 'blackout_ranges' },
      { key: 'blackout_ranges', value: JSON.stringify(blackouts) },
      { upsert: true }
    );
    
    res.json({ message: 'Blackout added' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add blackout' });
  }
});

// Delete blackout
router.delete('/blackouts/:id', async (req, res) => {
  try {
    const setting = await Settings.findOne({ key: 'blackout_ranges' });
    let blackouts = setting?.value ? JSON.parse(setting.value) : [];
    
    blackouts = blackouts.filter(b => b.id !== req.params.id);
    
    await Settings.findOneAndUpdate(
      { key: 'blackout_ranges' },
      { key: 'blackout_ranges', value: JSON.stringify(blackouts) },
      { upsert: true }
    );
    
    res.json({ message: 'Blackout deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete blackout' });
  }
});

// ==================== CUSTOMERS MANAGEMENT ====================

// Get all customers (parents) with search
router.get('/customers', async (req, res) => {
  try {
    const { search, page = 1, limit = 50 } = req.query;
    const query = { role: 'parent' };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const customers = await User.find(query)
      .select('name email phone loyalty_points is_disabled created_at')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ created_at: -1 });

    // Get children count for each customer
    const customerIds = customers.map(c => c._id);
    const childrenCounts = await Child.aggregate([
      { $match: { parent_id: { $in: customerIds } } },
      { $group: { _id: '$parent_id', count: { $sum: 1 } } }
    ]);
    
    const childCountMap = {};
    childrenCounts.forEach(c => { childCountMap[c._id.toString()] = c.count; });

    const total = await User.countDocuments(query);

    res.json({
      customers: customers.map(c => ({
        ...c.toJSON(),
        children_count: childCountMap[c._id.toString()] || 0
      })),
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({ error: 'Failed to get customers' });
  }
});

// Get single customer details with related data
router.get('/customers/:id', async (req, res) => {
  try {
    const customer = await User.findOne({ _id: req.params.id, role: 'parent' });
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Get children
    const children = await Child.find({ parent_id: req.params.id });
    
    // Get booking summaries
    const hourlyCount = await HourlyBooking.countDocuments({ user_id: req.params.id });
    const birthdayCount = await BirthdayBooking.countDocuments({ user_id: req.params.id });
    
    // Get last booking date
    const lastHourly = await HourlyBooking.findOne({ user_id: req.params.id }).sort({ created_at: -1 });
    const lastBirthday = await BirthdayBooking.findOne({ user_id: req.params.id }).sort({ created_at: -1 });
    
    let lastBookingDate = null;
    if (lastHourly && lastBirthday) {
      lastBookingDate = lastHourly.created_at > lastBirthday.created_at ? lastHourly.created_at : lastBirthday.created_at;
    } else {
      lastBookingDate = lastHourly?.created_at || lastBirthday?.created_at || null;
    }

    // Get active subscriptions
    const activeSubscriptions = await UserSubscription.countDocuments({ user_id: req.params.id, status: 'active' });

    res.json({
      customer: customer.toJSON(),
      children: children.map(c => c.toJSON()),
      bookings_summary: {
        hourly_count: hourlyCount,
        birthday_count: birthdayCount,
        active_subscriptions: activeSubscriptions,
        last_booking_date: lastBookingDate
      }
    });
  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({ error: 'Failed to get customer' });
  }
});

// Create new customer
router.post('/customers', async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Generate random password
    const randomPassword = Math.random().toString(36).slice(-10);
    const password_hash = await bcrypt.hash(randomPassword, 10);
    
    const customer = new User({
      email: email.toLowerCase(),
      password_hash,
      name,
      phone: phone || null,
      role: 'parent'
    });
    await customer.save();

    res.status(201).json({ customer: customer.toJSON() });
  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

// Update customer
router.put('/customers/:id', async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    
    const customer = await User.findOne({ _id: req.params.id, role: 'parent' });
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Check email uniqueness if changed
    if (email && email.toLowerCase() !== customer.email) {
      const existing = await User.findOne({ email: email.toLowerCase() });
      if (existing) {
        return res.status(400).json({ error: 'Email already exists' });
      }
      customer.email = email.toLowerCase();
    }

    if (name) customer.name = name;
    if (phone !== undefined) customer.phone = phone || null;
    
    await customer.save();
    res.json({ customer: customer.toJSON() });
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

// Toggle customer disabled status
router.patch('/customers/:id/disable', async (req, res) => {
  try {
    const customer = await User.findOne({ _id: req.params.id, role: 'parent' });
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    customer.is_disabled = !customer.is_disabled;
    await customer.save();
    
    res.json({ 
      customer: customer.toJSON(),
      message: customer.is_disabled ? 'Customer disabled' : 'Customer enabled'
    });
  } catch (error) {
    console.error('Toggle customer status error:', error);
    res.status(500).json({ error: 'Failed to update customer status' });
  }
});

// Delete customer (safe-delete: blocked if customer has booking/subscription history)
router.delete('/customers/:id', async (req, res) => {
  try {
    const customer = await User.findOne({ _id: req.params.id, role: 'parent' });
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const [hourlyCount, birthdayCount, subscriptionCount] = await Promise.all([
      HourlyBooking.countDocuments({ user_id: req.params.id }),
      BirthdayBooking.countDocuments({ user_id: req.params.id }),
      UserSubscription.countDocuments({ user_id: req.params.id })
    ]);

    if (hourlyCount > 0 || birthdayCount > 0 || subscriptionCount > 0) {
      return res.status(400).json({
        error: 'Cannot delete customer with booking/subscription history. Disable the customer instead.'
      });
    }

    await Promise.all([
      Child.deleteMany({ parent_id: req.params.id }),
      User.deleteOne({ _id: req.params.id })
    ]);

    res.json({ message: 'Customer deleted' });
  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({ error: 'Failed to delete customer' });
  }
});

// Change current admin password
router.put('/change-password', async (req, res) => {
  try {
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (new_password.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }

    const isValid = await bcrypt.compare(current_password, req.user.password_hash);
    if (!isValid) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    req.user.password_hash = await bcrypt.hash(new_password, 10);
    await req.user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change admin password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// Add child to customer
router.post('/customers/:id/children', async (req, res) => {
  try {
    const { name, birthday } = req.body;
    
    if (!name || !birthday) {
      return res.status(400).json({ error: 'Name and birthday are required' });
    }

    const customer = await User.findOne({ _id: req.params.id, role: 'parent' });
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const child = new Child({
      parent_id: req.params.id,
      name,
      birthday: new Date(birthday)
    });
    await child.save();

    res.status(201).json({ child: child.toJSON() });
  } catch (error) {
    console.error('Add child error:', error);
    res.status(500).json({ error: 'Failed to add child' });
  }
});

// Update child
router.put('/customers/:id/children/:childId', async (req, res) => {
  try {
    const { name, birthday } = req.body;
    
    const child = await Child.findOne({ _id: req.params.childId, parent_id: req.params.id });
    if (!child) {
      return res.status(404).json({ error: 'Child not found' });
    }

    if (name) child.name = name;
    if (birthday) child.birthday = new Date(birthday);
    
    await child.save();
    res.json({ child: child.toJSON() });
  } catch (error) {
    console.error('Update child error:', error);
    res.status(500).json({ error: 'Failed to update child' });
  }
});

// Delete child
router.delete('/customers/:id/children/:childId', async (req, res) => {
  try {
    const child = await Child.findOne({ _id: req.params.childId, parent_id: req.params.id });
    if (!child) {
      return res.status(404).json({ error: 'Child not found' });
    }

    await Child.deleteOne({ _id: req.params.childId });
    res.json({ message: 'Child deleted' });
  } catch (error) {
    console.error('Delete child error:', error);
    res.status(500).json({ error: 'Failed to delete child' });
  }
});

module.exports = router;
