const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const User = require('../models/User');
const ReferralCode = require('../models/ReferralCode');
const ReferralRedemption = require('../models/ReferralRedemption');
const {
  getOrCreateReferralCode,
  hasAnyConfirmedOrder,
  usersMatchByPhoneOrEmail,
  createRedemption
} = require('../utils/referrals');

const router = express.Router();

router.get('/my-code', authMiddleware, async (req, res) => {
  try {
    const referralCode = await getOrCreateReferralCode(req.userId);
    return res.json({ code: referralCode.code });
  } catch (error) {
    console.error('Get referral code error:', error);
    return res.status(500).json({ error: 'Failed to get referral code' });
  }
});

router.post('/redeem', authMiddleware, async (req, res) => {
  try {
    const code = (req.body?.code || '').trim().toUpperCase();
    if (!code) {
      return res.status(400).json({ error: 'Referral code is required' });
    }

    const existingRedemption = await ReferralRedemption.findOne({ referredUserId: req.userId });
    if (existingRedemption) {
      return res.status(400).json({ error: 'Referral already redeemed for this user' });
    }

    const referralCode = await ReferralCode.findOne({ code });
    if (!referralCode) {
      return res.status(404).json({ error: 'Invalid referral code' });
    }

    if (referralCode.userId.toString() === req.userId.toString()) {
      return res.status(400).json({ error: 'Self referral is not allowed' });
    }

    const [referrerUser, referredUser] = await Promise.all([
      User.findById(referralCode.userId),
      User.findById(req.userId)
    ]);

    if (!referrerUser || !referredUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (usersMatchByPhoneOrEmail(referrerUser, referredUser)) {
      return res.status(400).json({ error: 'Referral blocked for matching phone or email' });
    }

    const alreadyConfirmedOrder = await hasAnyConfirmedOrder(req.userId);
    if (alreadyConfirmedOrder) {
      return res.status(400).json({ error: 'Referral must be redeemed before first confirmed order' });
    }

    const redemption = await createRedemption({
      referrerUserId: referrerUser._id,
      referredUserId: referredUser._id
    });

    return res.status(201).json({
      redemption: {
        id: redemption._id,
        status: redemption.status,
        redeemedAt: redemption.redeemedAt
      }
    });
  } catch (error) {
    if (error && error.code === 11000) {
      return res.status(400).json({ error: 'Referral already redeemed for this user' });
    }

    console.error('Redeem referral error:', error);
    return res.status(500).json({ error: 'Failed to redeem referral code' });
  }
});

module.exports = router;
