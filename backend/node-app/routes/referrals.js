const express = require('express');
const ReferralCode = require('../models/ReferralCode');
const ReferralRedemption = require('../models/ReferralRedemption');
const { authMiddleware } = require('../middleware/auth');
const { getOrCreateReferralCode } = require('../utils/referrals');

const router = express.Router();

const GENERIC_REDEEM_ERROR = { error: 'Unable to redeem referral code' };

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
    const normalizedCode = String(req.body?.code || '').trim().toUpperCase();
    if (!normalizedCode) {
      return res.status(400).json(GENERIC_REDEEM_ERROR);
    }

    const referredUserId = req.userId;
    const referralCode = await ReferralCode.findOne({ code: normalizedCode });
    if (!referralCode) {
      return res.status(400).json(GENERIC_REDEEM_ERROR);
    }

    if (referralCode.userId.toString() === referredUserId) {
      return res.status(400).json(GENERIC_REDEEM_ERROR);
    }

    const existingRedemption = await ReferralRedemption.findOne({ referredUserId });
    if (existingRedemption) {
      return res.status(400).json(GENERIC_REDEEM_ERROR);
    }

    await ReferralRedemption.create({
      referrerUserId: referralCode.userId,
      referredUserId,
      status: 'pending'
    });

    return res.json({ success: true });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(400).json(GENERIC_REDEEM_ERROR);
    }

    console.error('Redeem referral code error:', error);
    return res.status(500).json(GENERIC_REDEEM_ERROR);
  }
});

module.exports = router;
