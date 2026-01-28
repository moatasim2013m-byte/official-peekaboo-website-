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

const router = express.Router();

// Configure multer for image uploads
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/png', 'image/jpeg', 'image/webp'];
    cb(null, allowed.includes(file.mimetype));
  }
});

// Apply auth middleware to all admin routes
router.use(authMiddleware, adminMiddleware);

// ==================== IMAGE UPLOAD ====================
router.post('/upload-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image provided' });
    }

    const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.webp`;
    const filepath = path.join(uploadDir, filename);

    // Resize to max 1200px width and convert to webp
    await sharp(req.file.buffer)
      .resize({ width: 1200, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(filepath);

    const imageUrl = `/api/uploads/${filename}`;
    res.json({ image_url: imageUrl });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
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
    const { status } = req.body;
    const booking = await HourlyBooking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('slot_id').populate('child_id');

    res.json({ booking: booking.toJSON() });
  } catch (error) {
    console.error('Update booking error:', error);
    res.status(500).json({ error: 'Failed to update booking' });
  }
});

router.put('/bookings/birthday/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await BirthdayBooking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('slot_id').populate('child_id').populate('theme_id');

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

module.exports = router;
