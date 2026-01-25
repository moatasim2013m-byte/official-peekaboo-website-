const express = require('express');
const bcrypt = require('bcryptjs');
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

// Apply auth middleware to all admin routes
router.use(authMiddleware, adminMiddleware);

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
    const { name, description, visits, price } = req.body;
    const plan = new SubscriptionPlan({ name, description, visits, price });
    await plan.save();
    res.status(201).json({ plan: plan.toJSON() });
  } catch (error) {
    console.error('Create plan error:', error);
    res.status(500).json({ error: 'Failed to create plan' });
  }
});

router.put('/plans/:id', async (req, res) => {
  try {
    const { name, description, visits, price, is_active } = req.body;
    const plan = await SubscriptionPlan.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    if (name !== undefined) plan.name = name;
    if (description !== undefined) plan.description = description;
    if (visits !== undefined) plan.visits = visits;
    if (price !== undefined) plan.price = price;
    if (is_active !== undefined) plan.is_active = is_active;
    
    await plan.save();
    res.json({ plan: plan.toJSON() });
  } catch (error) {
    console.error('Update plan error:', error);
    res.status(500).json({ error: 'Failed to update plan' });
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

module.exports = router;
