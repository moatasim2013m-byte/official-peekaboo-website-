const mongoose = require('mongoose');
const LoyaltyLedger = require('../models/LoyaltyLedger');
const LoyaltyBalance = require('../models/LoyaltyBalance');

const DUPLICATE_KEY_CODE = 11000;

const addMonths = (date, months) => {
  const copy = new Date(date);
  copy.setMonth(copy.getMonth() + months);
  return copy;
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

async function awardPoints(userId, points, reason, refType, refId) {
  const numericPoints = Number(points);
  if (!Number.isFinite(numericPoints) || numericPoints <= 0) {
    return { awarded: false, reason: 'invalid_points' };
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const expiresAt = addMonths(new Date(), 12);
    const [ledgerEntry] = await LoyaltyLedger.create([
      {
        userId,
        pointsDelta: numericPoints,
        reason,
        refType,
        refId,
        expiresAt
      }
    ], { session });

    const currentPoints = await getNonExpiredPoints(userId, session);
    const balance = await upsertBalance(userId, currentPoints, session);

    await session.commitTransaction();
    return { awarded: true, ledgerEntry, balance };
  } catch (error) {
    await session.abortTransaction();

    if (error?.code === DUPLICATE_KEY_CODE) {
      return { awarded: false, reason: 'already_awarded' };
    }

    throw error;
  } finally {
    await session.endSession();
  }
}

module.exports = {
  awardPoints
};
