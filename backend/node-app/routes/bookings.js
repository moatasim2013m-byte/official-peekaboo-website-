const express = require('express');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const HourlyBooking = require('../models/HourlyBooking');
const BirthdayBooking = require('../models/BirthdayBooking');
const TimeSlot = require('../models/TimeSlot');
const Child = require('../models/Child');
const Theme = require('../models/Theme');
const User = require('../models/User');
const LoyaltyHistory = require('../models/LoyaltyHistory');
const Settings = require('../models/Settings');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { sendEmail, emailTemplates } = require('../utils/email');
const { addMinutes, isBefore, isAfter } = require('date-fns');

const router = express.Router();
const LOYALTY_POINTS_PER_ORDER = 10;

// Generate QR code as data URL
const generateQRCode = async (data) => {
  try {
    return await QRCode.toDataURL(data, { width: 300, margin: 2 });
  } catch (error) {
    console.error('QR generation error:', error);
    return null;
  }
};

// Award loyalty points (idempotent by payment_id)
const awardLoyaltyPoints = async (userId, paymentId, source) => {
  // Check if points already awarded for this payment
  const existing = await LoyaltyHistory.findOne({ reference: paymentId, type: 'earned' });
  if (existing) {
    console.log(`Loyalty points already awarded for payment ${paymentId}`);
    return false;
  }

  // Award points
  const loyaltyEntry = new LoyaltyHistory({
    user_id: userId,
    points: LOYALTY_POINTS_PER_ORDER,
    type: 'earned',
    reference: paymentId,
    source,
    description: `Earned ${LOYALTY_POINTS_PER_ORDER} points from ${source} booking`
  });
  await loyaltyEntry.save();

  // Update user's total points
  await User.findByIdAndUpdate(userId, { $inc: { loyalty_points: LOYALTY_POINTS_PER_ORDER } });
  
  return true;
};

// ==================== HOURLY BOOKINGS ====================

// Create hourly booking (after payment confirmed)
router.post('/hourly', authMiddleware, async (req, res) => {
  try {
    const { slot_id, child_id, payment_id, amount, duration_hours, custom_notes } = req.body;
    
    // ATOMIC capacity check - use findOneAndUpdate to prevent race conditions
    const slot = await TimeSlot.findOneAndUpdate(
      { 
        _id: slot_id, 
        slot_type: 'hourly',
        $expr: { $lt: ['$booked_count', '$capacity'] } // Only if capacity available
      },
      { $inc: { booked_count: 1 } },
      { new: true }
    );
    
    if (!slot) {
      // Check if slot exists but is full
      const existingSlot = await TimeSlot.findById(slot_id);
      if (!existingSlot) {
        return res.status(400).json({ error: 'Invalid slot' });
      }
      return res.status(400).json({ error: 'عذراً، الوقت محجوز بالكامل. يرجى اختيار وقت آخر.' }); // Slot is full (Arabic)
    }

    // Validate child belongs to user
    const child = await Child.findOne({ _id: child_id, parent_id: req.userId });
    if (!child) {
      // Rollback capacity increment
      await TimeSlot.findByIdAndUpdate(slot_id, { $inc: { booked_count: -1 } });
      return res.status(400).json({ error: 'Invalid child' });
    }

    // Generate booking code and QR
    const booking_code = `PK-H-${uuidv4().substring(0, 8).toUpperCase()}`;
    const qr_code = await generateQRCode(booking_code);

    const booking = new HourlyBooking({
      user_id: req.userId,
      child_id,
      slot_id,
      duration_hours: parseInt(duration_hours) || 2,
      custom_notes: custom_notes || '',
      qr_code,
      booking_code,
      status: 'confirmed',
      payment_id,
      amount
    });

    await booking.save();
    
    // Capacity already incremented atomically above

    // Award loyalty points
    if (payment_id) {
      await awardLoyaltyPoints(req.userId, payment_id, 'hourly');
    }

    // Send confirmation email
    const user = await User.findById(req.userId);
    const template = emailTemplates.bookingConfirmation(booking, slot, child);
    await sendEmail(user.email, template.subject, template.html);

    res.status(201).json({ booking: booking.toJSON() });
  } catch (error) {
    console.error('Create hourly booking error:', error);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

// Get user's hourly bookings
router.get('/hourly', authMiddleware, async (req, res) => {
  try {
    const bookings = await HourlyBooking.find({ user_id: req.userId })
      .populate('slot_id')
      .populate('child_id')
      .sort({ created_at: -1 });

    res.json({ bookings: bookings.map(b => b.toJSON()) });
  } catch (error) {
    console.error('Get hourly bookings error:', error);
    res.status(500).json({ error: 'Failed to get bookings' });
  }
});

// Get active session
router.get('/hourly/active', authMiddleware, async (req, res) => {
  try {
    const activeBooking = await HourlyBooking.findOne({
      user_id: req.userId,
      status: 'checked_in',
      session_end_time: { $gt: new Date() }
    })
    .populate('slot_id')
    .populate('child_id');

    if (!activeBooking) {
      return res.json({ active_session: null });
    }

    const now = new Date();
    const remaining_ms = activeBooking.session_end_time - now;
    const remaining_minutes = Math.max(0, Math.ceil(remaining_ms / 60000));

    res.json({
      active_session: {
        ...activeBooking.toJSON(),
        remaining_minutes,
        warning_5min: remaining_minutes <= 5 && remaining_minutes > 0
      }
    });
  } catch (error) {
    console.error('Get active session error:', error);
    res.status(500).json({ error: 'Failed to get active session' });
  }
});

// Check-in (reception scan)
router.post('/hourly/checkin', authMiddleware, async (req, res) => {
  try {
    const { booking_code } = req.body;
    
    const booking = await HourlyBooking.findOne({ booking_code })
      .populate('slot_id')
      .populate('child_id');

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.status !== 'confirmed') {
      return res.status(400).json({ error: `Cannot check in - booking status is ${booking.status}` });
    }

    const now = new Date();
    const durationMinutes = (booking.duration_hours || 2) * 60;
    const sessionEndTime = addMinutes(now, durationMinutes);

    booking.status = 'checked_in';
    booking.check_in_time = now;
    booking.session_end_time = sessionEndTime;
    await booking.save();

    res.json({
      message: 'Check-in successful',
      booking: booking.toJSON(),
      session_end_time: sessionEndTime
    });
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({ error: 'Failed to check in' });
  }
});

// ==================== BIRTHDAY BOOKINGS ====================

// Create birthday booking
router.post('/birthday', authMiddleware, async (req, res) => {
  try {
    const { slot_id, child_id, theme_id, is_custom, custom_request, guest_count, special_notes, payment_id, amount } = req.body;
    
    // Validate slot
    const slot = await TimeSlot.findById(slot_id);
    if (!slot || slot.slot_type !== 'birthday') {
      return res.status(400).json({ error: 'Invalid birthday slot' });
    }
    
    if (slot.booked_count >= slot.capacity) {
      return res.status(400).json({ error: 'Slot is full' });
    }

    // Validate child
    const child = await Child.findOne({ _id: child_id, parent_id: req.userId });
    if (!child) {
      return res.status(400).json({ error: 'Invalid child' });
    }

    // Validate theme if not custom
    let theme = null;
    if (!is_custom && theme_id) {
      theme = await Theme.findById(theme_id);
      if (!theme) {
        return res.status(400).json({ error: 'Invalid theme' });
      }
    }

    const booking_code = `PK-B-${uuidv4().substring(0, 8).toUpperCase()}`;

    const booking = new BirthdayBooking({
      user_id: req.userId,
      child_id,
      slot_id,
      theme_id: is_custom ? null : theme_id,
      is_custom,
      custom_request: is_custom ? custom_request : null,
      booking_code,
      status: is_custom ? 'custom_pending' : 'confirmed',
      payment_id: is_custom ? null : payment_id,
      amount: is_custom ? null : amount,
      guest_count,
      special_notes
    });

    await booking.save();
    
    // Increment slot booked count
    await TimeSlot.findByIdAndUpdate(slot_id, { $inc: { booked_count: 1 } });

    // NO loyalty points for birthday bookings (only hourly gets points)

    // Send confirmation email
    const user = await User.findById(req.userId);
    const template = emailTemplates.birthdayConfirmation(booking, slot, child, theme);
    await sendEmail(user.email, template.subject, template.html);

    res.status(201).json({ booking: booking.toJSON() });
  } catch (error) {
    console.error('Create birthday booking error:', error);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

// Get user's birthday bookings
router.get('/birthday', authMiddleware, async (req, res) => {
  try {
    const bookings = await BirthdayBooking.find({ user_id: req.userId })
      .populate('slot_id')
      .populate('child_id')
      .populate('theme_id')
      .sort({ created_at: -1 });

    res.json({ bookings: bookings.map(b => b.toJSON()) });
  } catch (error) {
    console.error('Get birthday bookings error:', error);
    res.status(500).json({ error: 'Failed to get bookings' });
  }
});

// Custom birthday request (no payment)
router.post('/birthday/custom', authMiddleware, async (req, res) => {
  try {
    const { slot_id, child_id, custom_request, guest_count, special_notes } = req.body;
    
    const slot = await TimeSlot.findById(slot_id);
    if (!slot || slot.slot_type !== 'birthday') {
      return res.status(400).json({ error: 'Invalid birthday slot' });
    }

    const child = await Child.findOne({ _id: child_id, parent_id: req.userId });
    if (!child) {
      return res.status(400).json({ error: 'Invalid child' });
    }

    const booking_code = `PK-BC-${uuidv4().substring(0, 8).toUpperCase()}`;

    const booking = new BirthdayBooking({
      user_id: req.userId,
      child_id,
      slot_id,
      is_custom: true,
      custom_request,
      booking_code,
      status: 'custom_pending',
      guest_count,
      special_notes
    });

    await booking.save();

    // Send confirmation email
    const user = await User.findById(req.userId);
    const template = emailTemplates.birthdayConfirmation(booking, slot, child, null);
    await sendEmail(user.email, template.subject, template.html);

    res.status(201).json({ 
      booking: booking.toJSON(),
      message: 'Custom theme request submitted. Our team will contact you soon.'
    });
  } catch (error) {
    console.error('Create custom birthday request error:', error);
    res.status(500).json({ error: 'Failed to submit request' });
  }
});

module.exports = router;
