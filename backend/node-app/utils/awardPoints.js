const mongoose = require('mongoose');
const LoyaltyLedger = require('../models/LoyaltyLedger');
const LoyaltyBalance = require('../models/LoyaltyBalance');

const POINTS_PER_JD = 10;
const DUPLICATE_KEY_CODE = 11000;
const ALLOWED_REF_TYPES = new Set(['hourly', 'birthday', 'subscription', 'product', 'referral', 'admin', 'winback']);

const addMonths = (date, months) => {
  const copy = new Date(date);
  copy.setMonth(copy.getMonth() + months);
  return copy;
};

const normalizeRefType = (refType, type) => {
  if (ALLOWED_REF_TYPES.has(refType)) return refType;

  const combined = `${refType || ''} ${type || ''}`.toLowerCase();
  if (combined.includes('hourly')) return 'hourly';
  if (combined.includes('birthday')) return 'birthday';
  if (combined.includes('subscription')) return 'subscription';
  if (combined.includes('product')) return 'product';
  return 'admin';
};

const toObjectId = (value) => {
  if (value instanceof mongoose.Types.ObjectId) return value;
  return new mongoose.Types.ObjectId(value);
};

const getNonExpiredPoints = async (userId, session) => {
  const now = new Date();
  const [summary] = await LoyaltyLedger.aggregate([
    { $match: { userId: toObjectId(userId) } },
    {
      $match: {
        $or: [
          { pointsDelta: { $lt: 0 } },
          { expiresAt: null },
          { expiresAt: { $gt: now } }
        ]
      }
    },
    { $group: { _id: null, total: { $sum: '$pointsDelta' } } }
  ]).session(session);

  return Math.max(0, summary?.total || 0);
};

const upsertBalance = async (userId, pointsAvailable, session) => {
  return LoyaltyBalance.findOneAndUpdate(
    { userId },
    {
      $set: {
        pointsAvailable,
        updatedAt: new Date()
      }
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
      session
    }
  );
};

const getPoints = ({ points, amount = 0 }) => {
  const numericPoints = Number(points);
  if (Number.isFinite(numericPoints)) {
    return Math.max(0, Math.round(numericPoints));
  }

  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    return 0;
  }

  return Math.max(0, Math.round(numericAmount * POINTS_PER_JD));
};

const awardPoints = async ({ userId, refType, refId, type, amount = 0, points, description }) => {
  if (!userId || !refType || !refId) {
    return { awarded: false, reason: 'missing_reference' };
  }

  const pointsToAward = getPoints({ points, amount });
  if (!pointsToAward) {
    return { awarded: false, reason: 'zero_points' };
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const [ledgerEntry] = await LoyaltyLedger.create([
      {
        userId,
        pointsDelta: pointsToAward,
        reason: description || `Earned ${pointsToAward} points from ${type || refType}`,
        refType: normalizeRefType(refType, type),
        refId,
        expiresAt: addMonths(new Date(), 12)
      }
    ], { session });

    const currentPoints = await getNonExpiredPoints(userId, session);
    await upsertBalance(userId, currentPoints, session);

    await session.commitTransaction();
    return { awarded: true, points: pointsToAward, ledgerEntry };
  } catch (error) {
    await session.abortTransaction();

    if (error?.code === DUPLICATE_KEY_CODE) {
      return { awarded: false, reason: 'already_awarded' };
    }

    throw error;
  } finally {
    await session.endSession();
  }
};

module.exports = {
  awardPoints,
  POINTS_PER_JD
};
