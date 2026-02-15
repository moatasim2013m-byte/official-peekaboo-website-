const crypto = require('crypto');
const ReferralCode = require('../models/ReferralCode');
const ReferralRedemption = require('../models/ReferralRedemption');
const LoyaltyHistory = require('../models/LoyaltyHistory');
const User = require('../models/User');
const HourlyBooking = require('../models/HourlyBooking');
const BirthdayBooking = require('../models/BirthdayBooking');
const UserSubscription = require('../models/UserSubscription');

const REFERRER_REWARD_POINTS = 200;
const REFERRED_REWARD_POINTS = 100;

const normalizeEmail = (value) => (value || '').trim().toLowerCase();
const normalizePhone = (value) => (value || '').replace(/\s+/g, '').trim();

const generateReferralCode = () => `PKB${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

const getOrCreateReferralCode = async (userId) => {
  const existing = await ReferralCode.findOne({ userId });
  if (existing) return existing;

  for (let i = 0; i < 5; i += 1) {
    const code = generateReferralCode();
    try {
      const created = await ReferralCode.create({ userId, code });
      return created;
    } catch (error) {
      if (error && error.code === 11000) {
        const byUser = await ReferralCode.findOne({ userId });
        if (byUser) return byUser;
      } else {
        throw error;
      }
    }
  }

  throw new Error('Failed to generate unique referral code');
};

const hasAnyConfirmedOrder = async (userId) => {
  const [hourlyCount, birthdayCount, subscriptionCount] = await Promise.all([
    HourlyBooking.countDocuments({ user_id: userId, status: { $in: ['confirmed', 'checked_in', 'completed'] } }),
    BirthdayBooking.countDocuments({ user_id: userId, status: { $in: ['confirmed', 'completed'] } }),
    UserSubscription.countDocuments({ user_id: userId, payment_status: 'paid' })
  ]);

  return (hourlyCount + birthdayCount + subscriptionCount) > 0;
};

const countConfirmedOrders = async (userId) => {
  const [hourlyCount, birthdayCount, subscriptionCount] = await Promise.all([
    HourlyBooking.countDocuments({ user_id: userId, status: { $in: ['confirmed', 'checked_in', 'completed'] } }),
    BirthdayBooking.countDocuments({ user_id: userId, status: { $in: ['confirmed', 'completed'] } }),
    UserSubscription.countDocuments({ user_id: userId, payment_status: 'paid' })
  ]);

  return hourlyCount + birthdayCount + subscriptionCount;
};

const usersMatchByPhoneOrEmail = (referrer, referred) => {
  const referrerEmail = normalizeEmail(referrer?.email);
  const referredEmail = normalizeEmail(referred?.email);
  const referrerPhone = normalizePhone(referrer?.phone);
  const referredPhone = normalizePhone(referred?.phone);

  const sameEmail = referrerEmail && referredEmail && referrerEmail === referredEmail;
  const samePhone = referrerPhone && referredPhone && referrerPhone === referredPhone;

  return sameEmail || samePhone;
};

const createRedemption = async ({ referrerUserId, referredUserId }) => {
  const redemption = new ReferralRedemption({
    referrerUserId,
    referredUserId,
    status: 'pending',
    redeemedAt: new Date()
  });

  return redemption.save();
};

const createReferralLoyaltyEntry = async ({ userId, points, reference, description }) => {
  const existing = await LoyaltyHistory.findOne({ user_id: userId, type: 'earned', reference });
  if (existing) return false;

  await LoyaltyHistory.create({
    user_id: userId,
    points,
    type: 'earned',
    source: 'admin',
    reference,
    description
  });

  await User.findByIdAndUpdate(userId, { $inc: { loyalty_points: points } });
  return true;
};

const handleReferralAwardForConfirmedOrder = async (referredUserId) => {
  const pendingRedemption = await ReferralRedemption.findOne({ referredUserId, status: 'pending' });
  if (!pendingRedemption) {
    return { awarded: false, reason: 'no_pending_redemption' };
  }

  const confirmedOrdersCount = await countConfirmedOrders(referredUserId);
  if (confirmedOrdersCount !== 1) {
    return { awarded: false, reason: 'not_first_confirmed_order' };
  }

  const awardedRedemption = await ReferralRedemption.findOneAndUpdate(
    { _id: pendingRedemption._id, status: 'pending' },
    { $set: { status: 'awarded' } },
    { new: true }
  );

  if (!awardedRedemption) {
    return { awarded: false, reason: 'already_awarded' };
  }

  await createReferralLoyaltyEntry({
    userId: awardedRedemption.referrerUserId,
    points: REFERRER_REWARD_POINTS,
    reference: `referral_referrer:${awardedRedemption._id.toString()}`,
    description: 'Referral reward: referrer first confirmed order bonus'
  });

  await createReferralLoyaltyEntry({
    userId: awardedRedemption.referredUserId,
    points: REFERRED_REWARD_POINTS,
    reference: `referral_referred:${awardedRedemption._id.toString()}`,
    description: 'Referral reward: referred first confirmed order bonus'
  });

  return { awarded: true };
};

module.exports = {
  REFERRER_REWARD_POINTS,
  REFERRED_REWARD_POINTS,
  getOrCreateReferralCode,
  hasAnyConfirmedOrder,
  usersMatchByPhoneOrEmail,
  createRedemption,
  handleReferralAwardForConfirmedOrder
};
