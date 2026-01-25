const express = require('express');
const User = require('../models/User');
const LoyaltyHistory = require('../models/LoyaltyHistory');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get user's loyalty points and history
router.get('/', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const history = await LoyaltyHistory.find({ user_id: req.userId })
      .sort({ created_at: -1 })
      .limit(50);

    res.json({
      points: user.loyalty_points,
      history: history.map(h => h.toJSON())
    });
  } catch (error) {
    console.error('Get loyalty error:', error);
    res.status(500).json({ error: 'Failed to get loyalty data' });
  }
});

// Admin: Adjust points
router.post('/adjust', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { user_id, points, description } = req.body;
    
    if (!user_id || points === undefined) {
      return res.status(400).json({ error: 'user_id and points are required' });
    }

    const user = await User.findById(user_id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Create loyalty history entry
    const loyaltyEntry = new LoyaltyHistory({
      user_id,
      points,
      type: 'adjusted',
      source: 'admin',
      description: description || `Points adjusted by admin: ${points > 0 ? '+' : ''}${points}`
    });
    await loyaltyEntry.save();

    // Update user's total points
    user.loyalty_points += points;
    await user.save();

    res.json({
      message: 'Points adjusted successfully',
      new_balance: user.loyalty_points
    });
  } catch (error) {
    console.error('Adjust points error:', error);
    res.status(500).json({ error: 'Failed to adjust points' });
  }
});

// Admin: Get user's loyalty history
router.get('/user/:userId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const history = await LoyaltyHistory.find({ user_id: req.params.userId })
      .sort({ created_at: -1 });

    res.json({
      user: { id: user._id, name: user.name, email: user.email },
      points: user.loyalty_points,
      history: history.map(h => h.toJSON())
    });
  } catch (error) {
    console.error('Get user loyalty error:', error);
    res.status(500).json({ error: 'Failed to get loyalty data' });
  }
});

module.exports = router;
