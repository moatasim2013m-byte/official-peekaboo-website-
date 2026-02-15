const crypto = require('crypto');
const ReferralCode = require('../models/ReferralCode');
const ReferralRedemption = require('../models/ReferralRedemption');
const HourlyBooking = require('../models/HourlyBooking');
const BirthdayBooking = require('../models/BirthdayBooking');
const UserSubscription = require('../models/UserSubscription');
const User = require('../models/User');
const LoyaltyHistory = require('../models/LoyaltyHistory');

const REFERRER_POINTS = Number(process.env.REFERRAL_REFERRER_POINTS || 20);
const REFERRED_POINTS = Number(process.env.REFERRAL_REFERRED_POINTS || 10);

const randomCode = () => crypto.randomBytes(4).toString('hex').toUpperCase();

const createReferralCodeForUser = async (userId) => {
  let attempts = 0;

  while (attempts < 5) {
    attempts += 1;
    try {
      const referralCode = new ReferralCode({
        userId,
        code: randomCode()
      });

      await referralCode.save();
      return referralCode;
    } catch (error) {
      if (error?.code === 11000) {
        const existing = await ReferralCode.findOne({ userId });
        if (existing) return existing;
        continue;
      }
      throw error;
    }
  }

  throw new Error('Failed to generate referral code');
};

const getOrCreateReferralCode = async (userId) => {
  const existing = await ReferralCode.findOne({ userId });
  if (existing) return existing;
  return createReferralCodeForUser(userId);
};

const hasSingleConfirmedOrder = async (userId) => {
  const [hourlyPaidCount, birthdayPaidCount, subscriptionPaidCount] = await Promise.all([
    HourlyBooking.countDocuments({ user_id: userId, payment_status: 'paid' }),
    BirthdayBooking.countDocuments({ user_id: userId, payment_status: 'paid' }),
    UserSubscription.countDocuments({ user_id: userId, payment_status: 'paid' })
  ]);

  return (hourlyPaidCount + birthdayPaidCount + subscriptionPaidCount) === 1;
};

const awardReferralForFirstConfirmedOrder = async (referredUserId, reference) => {
  if (!referredUserId) return false;

  const isFirstConfirmedOrder = await hasSingleConfirmedOrder(referredUserId);
  if (!isFirstConfirmedOrder) return false;

  const redemption = await ReferralRedemption.findOneAndUpdate(
    { referredUserId, status: 'pending' },
    { $set: { status: 'awarded' } },
    { new: true }
  );

  if (!redemption) return false;

  const [referrerUser, referredUser] = await Promise.all([
    User.findById(redemption.referrerUserId),
    User.findById(referredUserId)
  ]);

  if (!referrerUser || !referredUser) return false;

  const historyReference = `referral:${reference || redemption._id.toString()}`;

  await Promise.all([
    User.findByIdAndUpdate(referrerUser._id, { $inc: { loyalty_points: REFERRER_POINTS } }),
    User.findByIdAndUpdate(referredUser._id, { $inc: { loyalty_points: REFERRED_POINTS } }),
    LoyaltyHistory.create({
      user_id: referrerUser._id,
      points: REFERRER_POINTS,
      type: 'earned',
      source: 'admin',
      reference: historyReference,
      description: `Referral reward (+${REFERRER_POINTS}) for inviting a new customer`
    }),
    LoyaltyHistory.create({
      user_id: referredUser._id,
      points: REFERRED_POINTS,
      type: 'earned',
      source: 'admin',
      reference: historyReference,
      description: `Referral welcome reward (+${REFERRED_POINTS})`
    })
  ]);

  return true;
};

module.exports = {
  getOrCreateReferralCode,
  awardReferralForFirstConfirmedOrder
};
