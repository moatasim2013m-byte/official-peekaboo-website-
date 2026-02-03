const express = require('express');
const TimeSlot = require('../models/TimeSlot');
const HourlyBooking = require('../models/HourlyBooking');
const Settings = require('../models/Settings');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { format, addDays, parse, isBefore, subMinutes, addMinutes } = require('date-fns');
const { toZonedTime } = require('date-fns-tz');

const router = express.Router();
const TIMEZONE = 'Asia/Amman';
const BOOKING_CUTOFF_MINUTES = 30;

// HOURLY: 10:00 AM to 12:00 AM (midnight), every 10 minutes, session = 60 min
// Last entry at 23:00 (session ends at midnight)
const HOURLY_CONFIG = {
  startHour: 10,
  startMinute: 0,
  lastEntryHour: 23, // Last entry at 23:00
  lastEntryMinute: 0,
  intervalMinutes: 10,
  sessionDurationMinutes: 60,
  maxCapacity: 70 // max kids at any moment
};

// BIRTHDAY: 1:00 PM to 12:00 AM, every 2 hours, duration = 2 hours
// Slots: 13:00, 15:00, 17:00, 19:00, 21:00, 23:00
const BIRTHDAY_CONFIG = {
  startHour: 13,
  endHour: 24,
  intervalHours: 2,
  durationHours: 2,
  slots: ['13:00', '15:00', '17:00', '19:00', '21:00', '23:00']
};

// Generate hourly slots for a date (every 10 minutes from 10:00 to 23:00)
const generateHourlySlotsForDate = async (date) => {
  const slots = [];
  let hour = HOURLY_CONFIG.startHour;
  let minute = HOURLY_CONFIG.startMinute;
  
  while (hour < HOURLY_CONFIG.lastEntryHour || 
         (hour === HOURLY_CONFIG.lastEntryHour && minute <= HOURLY_CONFIG.lastEntryMinute)) {
    const startTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    
    const existing = await TimeSlot.findOne({ date, start_time: startTime, slot_type: 'hourly' });
    if (!existing) {
      const slot = new TimeSlot({
        date,
        start_time: startTime,
        slot_type: 'hourly',
        capacity: HOURLY_CONFIG.maxCapacity,
        booked_count: 0
      });
      await slot.save();
      slots.push(slot);
    } else {
      slots.push(existing);
    }
    
    // Increment by 10 minutes
    minute += HOURLY_CONFIG.intervalMinutes;
    if (minute >= 60) {
      minute = 0;
      hour += 1;
    }
  }
  return slots;
};

// Generate birthday slots for a date
const generateBirthdaySlotsForDate = async (date) => {
  const slots = [];
  
  for (const startTime of BIRTHDAY_CONFIG.slots) {
    const existing = await TimeSlot.findOne({ date, start_time: startTime, slot_type: 'birthday' });
    if (!existing) {
      const capacitySetting = await Settings.findOne({ key: 'birthday_capacity' });
      const capacity = capacitySetting?.value || 1;
      
      const slot = new TimeSlot({
        date,
        start_time: startTime,
        slot_type: 'birthday',
        capacity,
        booked_count: 0
      });
      await slot.save();
      slots.push(slot);
    } else {
      slots.push(existing);
    }
  }
  return slots;
};

// Calculate active kids count at a specific time for a given date
// This checks all sessions that would be active at that moment
const getActiveKidsAtTime = async (date, timeStr) => {
  const [checkHour, checkMinute] = timeStr.split(':').map(Number);
  const checkTimeMinutes = checkHour * 60 + checkMinute;
  
  // Find all confirmed/checked_in hourly bookings for this date only
  // Use aggregation to filter by slot date efficiently
  const bookings = await HourlyBooking.find({
    status: { $in: ['confirmed', 'checked_in'] }
  }).populate({
    path: 'slot_id',
    match: { date: date },
    select: 'date start_time'
  }).lean();
  
  let activeCount = 0;
  
  for (const booking of bookings) {
    // Skip if slot doesn't match the date filter (populate match returns null)
    if (!booking.slot_id) continue;
    
    const [slotHour, slotMinute] = booking.slot_id.start_time.split(':').map(Number);
    const slotStartMinutes = slotHour * 60 + slotMinute;
    const slotEndMinutes = slotStartMinutes + HOURLY_CONFIG.sessionDurationMinutes;
    
    // Check if this session overlaps with the check time
    // A session is active if: slotStart <= checkTime < slotEnd
    if (slotStartMinutes <= checkTimeMinutes && checkTimeMinutes < slotEndMinutes) {
      activeCount++;
    }
  }
  
  return activeCount;
};

// Calculate available capacity for a new booking at a given slot
// Must check all 60-minute windows this session would occupy
const getAvailableCapacityForSlot = async (date, startTimeStr) => {
  const [startHour, startMinute] = startTimeStr.split(':').map(Number);
  const startTimeMinutes = startHour * 60 + startMinute;
  const endTimeMinutes = startTimeMinutes + HOURLY_CONFIG.sessionDurationMinutes;
  
  let maxActiveKids = 0;
  
  // Check every 10-minute interval during this session
  for (let t = startTimeMinutes; t < endTimeMinutes; t += 10) {
    const hour = Math.floor(t / 60);
    const minute = t % 60;
    const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    
    const activeKids = await getActiveKidsAtTime(date, timeStr);
    maxActiveKids = Math.max(maxActiveKids, activeKids);
  }
  
  return HOURLY_CONFIG.maxCapacity - maxActiveKids;
};

// Get available slots for a date (public - no auth required for viewing)
router.get('/available', async (req, res) => {
  try {
    const { date, slot_type = 'hourly' } = req.query;
    
    if (!date) {
      return res.status(400).json({ error: 'Date is required' });
    }

    // Generate slots if they don't exist
    if (slot_type === 'hourly') {
      await generateHourlySlotsForDate(date);
    } else {
      await generateBirthdaySlotsForDate(date);
    }

    // Get current time in Amman timezone
    const nowInAmman = toZonedTime(new Date(), TIMEZONE);
    const cutoffTime = addMinutes(nowInAmman, BOOKING_CUTOFF_MINUTES);

    const slots = await TimeSlot.find({ 
      date, 
      slot_type,
      is_active: true
    }).sort({ start_time: 1 });

    // Process slots with availability
    const availableSlots = await Promise.all(slots.map(async (slot) => {
      const slotDateTime = parse(`${slot.date} ${slot.start_time}`, 'yyyy-MM-dd HH:mm', new Date());
      const slotInAmman = toZonedTime(slotDateTime, TIMEZONE);
      
      const isPast = isBefore(slotInAmman, cutoffTime);
      
      let availableSpots;
      let isAvailable;
      
      if (slot_type === 'hourly') {
        // For hourly, calculate based on overlapping sessions
        availableSpots = await getAvailableCapacityForSlot(date, slot.start_time);
        isAvailable = !isPast && availableSpots > 0;
      } else {
        // For birthday, simple capacity check
        availableSpots = slot.capacity - slot.booked_count;
        isAvailable = !isPast && availableSpots > 0;
      }
      
      return {
        ...slot.toJSON(),
        available_spots: availableSpots,
        is_available: isAvailable,
        is_past: isPast
      };
    }));

    res.json({ slots: availableSlots });
  } catch (error) {
    console.error('Get available slots error:', error);
    res.status(500).json({ error: 'Failed to get slots' });
  }
});

// Get single slot
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const slot = await TimeSlot.findById(req.params.id);
    if (!slot) {
      return res.status(404).json({ error: 'Slot not found' });
    }
    res.json({ slot: slot.toJSON() });
  } catch (error) {
    console.error('Get slot error:', error);
    res.status(500).json({ error: 'Failed to get slot' });
  }
});

// Check capacity before booking (internal helper exported for use in bookings.js)
const checkHourlyCapacity = async (date, startTimeStr) => {
  const availableCapacity = await getAvailableCapacityForSlot(date, startTimeStr);
  return availableCapacity > 0;
};

// Admin: Create slot
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { date, start_time, slot_type, capacity } = req.body;
    
    const existing = await TimeSlot.findOne({ date, start_time, slot_type });
    if (existing) {
      return res.status(400).json({ error: 'Slot already exists' });
    }

    const slot = new TimeSlot({ date, start_time, slot_type, capacity: capacity || 25 });
    await slot.save();
    
    res.status(201).json({ slot: slot.toJSON() });
  } catch (error) {
    console.error('Create slot error:', error);
    res.status(500).json({ error: 'Failed to create slot' });
  }
});

// Admin: Update slot
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { capacity, is_active } = req.body;
    
    const slot = await TimeSlot.findById(req.params.id);
    if (!slot) {
      return res.status(404).json({ error: 'Slot not found' });
    }

    if (capacity !== undefined) slot.capacity = capacity;
    if (is_active !== undefined) slot.is_active = is_active;
    
    await slot.save();
    res.json({ slot: slot.toJSON() });
  } catch (error) {
    console.error('Update slot error:', error);
    res.status(500).json({ error: 'Failed to update slot' });
  }
});

// Admin: Bulk generate slots for date range
router.post('/generate', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { start_date, end_date, slot_type = 'hourly' } = req.body;
    
    const start = new Date(start_date);
    const end = new Date(end_date);
    const generatedSlots = [];

    let current = start;
    while (current <= end) {
      const dateStr = format(current, 'yyyy-MM-dd');
      const slots = slot_type === 'hourly' 
        ? await generateHourlySlotsForDate(dateStr)
        : await generateBirthdaySlotsForDate(dateStr);
      generatedSlots.push(...slots);
      current = addDays(current, 1);
    }

    res.json({ 
      message: `Generated ${generatedSlots.length} slots`,
      slots: generatedSlots.map(s => s.toJSON())
    });
  } catch (error) {
    console.error('Generate slots error:', error);
    res.status(500).json({ error: 'Failed to generate slots' });
  }
});

module.exports = router;
module.exports.checkHourlyCapacity = checkHourlyCapacity;
module.exports.getAvailableCapacityForSlot = getAvailableCapacityForSlot;
