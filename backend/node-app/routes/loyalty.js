const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const LoyaltyHistory = require('../models/LoyaltyHistory');
const LoyaltyLedger = require('../models/LoyaltyLedger');
const LoyaltyBalance = require('../models/LoyaltyBalance');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

async function awardPoints(userId, pointsDelta, reason, refType, refId) {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const [ledgerEntry] = await LoyaltyLedger.create([
      {
        userId,
        pointsDelta,
        reason,
        refType,
        refId
      }
    ], { session });

    const balance = await LoyaltyBalance.findOneAndUpdate(
      { userId },
      { $inc: { pointsTotal: pointsDelta }, $set: { updatedAt: new Date() } },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
        session
      }
    );

    await session.commitTransaction();
    return { ledgerEntry, balance };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

// Get loyalty points balance
router.get('/balance', authMiddleware, async (req, res) => {
  try {
    const balance = await LoyaltyBalance.findOne({ userId: req.userId }).lean();
    res.json({ pointsTotal: balance?.pointsTotal || 0 });
  } catch (error) {
    console.error('Get loyalty balance error:', error);
    res.status(500).json({ error: 'Failed to get loyalty balance' });
  }
});

// Get loyalty points ledger history
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const requestedLimit = Number.parseInt(req.query.limit, 10);
    const limit = Number.isNaN(requestedLimit) ? 50 : Math.min(Math.max(requestedLimit, 1), 200);

    const history = await LoyaltyLedger.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    res.json({ history });
  } catch (error) {
    console.error('Get loyalty history error:', error);
    res.status(500).json({ error: 'Failed to get loyalty history' });
  }
});

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

router.awardPoints = awardPoints;

module.exports = router;
