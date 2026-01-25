const express = require('express');
const TimeSlot = require('../models/TimeSlot');
const Settings = require('../models/Settings');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { format, addDays, parse, isBefore, subMinutes } = require('date-fns');
const { toZonedTime, formatInTimeZone } = require('date-fns-tz');

const router = express.Router();
const TIMEZONE = 'Asia/Amman';
const OPERATING_HOURS = { start: 10, end: 22 }; // 10 AM - 10 PM
const BOOKING_CUTOFF_MINUTES = 30;

// Generate slots for a date range
const generateSlotsForDate = async (date, slotType) => {
  const slots = [];
  for (let hour = OPERATING_HOURS.start; hour < OPERATING_HOURS.end; hour++) {
    const startTime = `${hour.toString().padStart(2, '0')}:00`;
    
    // Check if slot already exists
    const existing = await TimeSlot.findOne({ date, start_time: startTime, slot_type: slotType });
    if (!existing) {
      // Get default capacity from settings
      const capacitySetting = await Settings.findOne({ key: `${slotType}_capacity` });
      const capacity = capacitySetting?.value || 25;
      
      const slot = new TimeSlot({
        date,
        start_time: startTime,
        slot_type: slotType,
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

// Get available slots for a date (public - no auth required for viewing)
router.get('/available', async (req, res) => {
  try {
    const { date, slot_type = 'hourly' } = req.query;
    
    if (!date) {
      return res.status(400).json({ error: 'Date is required' });
    }

    // Generate slots if they don't exist
    await generateSlotsForDate(date, slot_type);

    // Get current time in Amman timezone
    const nowInAmman = toZonedTime(new Date(), TIMEZONE);
    const cutoffTime = subMinutes(nowInAmman, -BOOKING_CUTOFF_MINUTES);

    const slots = await TimeSlot.find({ 
      date, 
      slot_type,
      is_active: true
    }).sort({ start_time: 1 });

    // Filter slots that are still bookable
    const availableSlots = slots.map(slot => {
      const slotDateTime = parse(`${slot.date} ${slot.start_time}`, 'yyyy-MM-dd HH:mm', new Date());
      const slotInAmman = toZonedTime(slotDateTime, TIMEZONE);
      
      const isPast = isBefore(slotInAmman, cutoffTime);
      const isAvailable = !isPast && slot.booked_count < slot.capacity;
      
      return {
        ...slot.toJSON(),
        available_spots: slot.capacity - slot.booked_count,
        is_available: isAvailable,
        is_past: isPast
      };
    });

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
      const slots = await generateSlotsForDate(dateStr, slot_type);
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
