const express = require('express');
const HourlyBooking = require('../models/HourlyBooking');
const BirthdayBooking = require('../models/BirthdayBooking');
const UserSubscription = require('../models/UserSubscription');
const Child = require('../models/Child');
const TimeSlot = require('../models/TimeSlot');
const { authMiddleware, staffMiddleware } = require('../middleware/auth');
const { addMinutes, format } = require('date-fns');

const router = express.Router();

// Apply staff middleware to all routes
router.use(authMiddleware, staffMiddleware);

// Get today's active sessions (checked-in hourly bookings)
router.get('/active-sessions', async (req, res) => {
  try {
    const now = new Date();
    
    const activeSessions = await HourlyBooking.find({
      status: 'checked_in',
      session_end_time: { $gt: now }
    })
    .populate('child_id')
    .populate('slot_id')
    .sort({ check_in_time: -1 });

    const sessions = activeSessions.map(session => {
      const remaining_ms = session.session_end_time - now;
      const remaining_minutes = Math.max(0, Math.ceil(remaining_ms / 60000));
      
      return {
        id: session._id.toString(),
        booking_code: session.booking_code,
        child_name: session.child_id?.name || 'Unknown',
        slot_time: session.slot_id?.start_time || 'N/A',
        check_in_time: session.check_in_time,
        session_end_time: session.session_end_time,
        remaining_minutes,
        warning: remaining_minutes <= 5
      };
    });

    res.json({ sessions });
  } catch (error) {
    console.error('Get active sessions error:', error);
    res.status(500).json({ error: 'Failed to get active sessions' });
  }
});

// Get today's confirmed hourly bookings (pending check-in)
router.get('/pending-checkins', async (req, res) => {
  try {
    const today = format(new Date(), 'yyyy-MM-dd');
    
    // Get today's slots
    const todaySlots = await TimeSlot.find({ date: today, slot_type: 'hourly' });
    const slotIds = todaySlots.map(s => s._id);
    
    const pendingBookings = await HourlyBooking.find({
      slot_id: { $in: slotIds },
      status: 'confirmed'
    })
    .populate('child_id')
    .populate('slot_id')
    .sort({ 'slot_id.start_time': 1 });

    const bookings = pendingBookings.map(booking => ({
      id: booking._id.toString(),
      booking_code: booking.booking_code,
      child_name: booking.child_id?.name || 'Unknown',
      slot_time: booking.slot_id?.start_time || 'N/A',
      qr_code: booking.qr_code
    }));

    res.json({ bookings });
  } catch (error) {
    console.error('Get pending check-ins error:', error);
    res.status(500).json({ error: 'Failed to get pending check-ins' });
  }
});

// Check-in a booking (QR scan)
router.post('/checkin', async (req, res) => {
  try {
    const { booking_code } = req.body;
    
    const booking = await HourlyBooking.findOne({ booking_code })
      .populate('slot_id')
      .populate('child_id');

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.status !== 'confirmed') {
      return res.status(400).json({ error: `Cannot check in - status is ${booking.status}` });
    }

    const now = new Date();
    const sessionEndTime = addMinutes(now, 60);

    booking.status = 'checked_in';
    booking.check_in_time = now;
    booking.session_end_time = sessionEndTime;
    await booking.save();

    res.json({
      success: true,
      message: 'Check-in successful',
      session: {
        child_name: booking.child_id?.name,
        check_in_time: now,
        session_end_time: sessionEndTime
      }
    });
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({ error: 'Failed to check in' });
  }
});

// Get active subscriptions for a child (for consumption)
router.get('/subscription/:childId', async (req, res) => {
  try {
    const subscription = await UserSubscription.findOne({
      child_id: req.params.childId,
      status: { $in: ['pending', 'active'] },
      remaining_visits: { $gt: 0 },
      $or: [
        { expires_at: null },
        { expires_at: { $gt: new Date() } }
      ]
    }).populate('plan_id').populate('child_id');

    if (!subscription) {
      return res.status(404).json({ error: 'No active subscription found' });
    }

    res.json({
      subscription: {
        id: subscription._id.toString(),
        child_name: subscription.child_id?.name,
        plan_name: subscription.plan_id?.name,
        remaining_visits: subscription.remaining_visits,
        status: subscription.status,
        expires_at: subscription.expires_at
      }
    });
  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({ error: 'Failed to get subscription' });
  }
});

// Consume subscription visit
router.post('/consume-visit', async (req, res) => {
  try {
    const { child_id } = req.body;
    
    const subscription = await UserSubscription.findOne({
      child_id,
      status: { $in: ['pending', 'active'] },
      remaining_visits: { $gt: 0 },
      $or: [
        { expires_at: null },
        { expires_at: { $gt: new Date() } }
      ]
    }).populate('plan_id').populate('child_id');

    if (!subscription) {
      return res.status(400).json({ error: 'No active subscription found for this child' });
    }

    // Activate if first use
    if (subscription.status === 'pending') {
      subscription.status = 'active';
      subscription.expires_at = addMinutes(new Date(), 30 * 24 * 60); // 30 days
      subscription.first_checkin_at = new Date();
    }

    subscription.remaining_visits -= 1;
    if (subscription.remaining_visits === 0) {
      subscription.status = 'consumed';
    }
    await subscription.save();

    res.json({
      success: true,
      message: 'Visit consumed',
      remaining_visits: subscription.remaining_visits,
      child_name: subscription.child_id?.name
    });
  } catch (error) {
    console.error('Consume visit error:', error);
    res.status(500).json({ error: 'Failed to consume visit' });
  }
});

// Get today's birthday parties (read-only)
router.get('/today-birthdays', async (req, res) => {
  try {
    const today = format(new Date(), 'yyyy-MM-dd');
    
    // Get today's birthday slots
    const todaySlots = await TimeSlot.find({ date: today, slot_type: 'birthday' });
    const slotIds = todaySlots.map(s => s._id);
    
    const birthdayBookings = await BirthdayBooking.find({
      slot_id: { $in: slotIds },
      status: { $in: ['confirmed', 'custom_pending'] }
    })
    .populate('child_id')
    .populate('slot_id')
    .populate('theme_id')
    .sort({ 'slot_id.start_time': 1 });

    const parties = birthdayBookings.map(booking => ({
      id: booking._id.toString(),
      booking_code: booking.booking_code,
      child_name: booking.child_id?.name || 'Unknown',
      slot_time: booking.slot_id?.start_time || 'N/A',
      theme: booking.is_custom ? 'Custom Request' : booking.theme_id?.name,
      guest_count: booking.guest_count,
      special_notes: booking.special_notes,
      status: booking.status
    }));

    res.json({ parties });
  } catch (error) {
    console.error('Get today birthdays error:', error);
    res.status(500).json({ error: 'Failed to get birthday parties' });
  }
});

// Search child by name (for subscription consumption)
router.get('/search-child', async (req, res) => {
  try {
    const { name } = req.query;
    
    if (!name || name.length < 2) {
      return res.json({ children: [] });
    }

    const children = await Child.find({
      name: { $regex: name, $options: 'i' }
    }).limit(10);

    res.json({
      children: children.map(c => ({
        id: c._id.toString(),
        name: c.name
      }))
    });
  } catch (error) {
    console.error('Search child error:', error);
    res.status(500).json({ error: 'Failed to search' });
  }
});

module.exports = router;
