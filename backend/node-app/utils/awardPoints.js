const LoyaltyHistory = require('../models/LoyaltyHistory');
const User = require('../models/User');

const POINTS = {
  hourly: 10,
  birthday: 20,
  subscription: 15,
  productPerJd: 1
};

const getPointsForType = ({ type, amount = 0 }) => {
  if (type === 'hourly') return POINTS.hourly;
  if (type === 'birthday') return POINTS.birthday;
  if (type === 'subscription') return POINTS.subscription;
  if (type === 'products') return Math.max(0, Math.round(Number(amount) * POINTS.productPerJd));
  return 0;
};

const awardPoints = async ({ userId, refType, refId, type, amount = 0, description }) => {
  if (!userId || !refType || !refId) {
    return { awarded: false, reason: 'missing_reference' };
  }

  const points = getPointsForType({ type, amount });
  if (!points) {
    return { awarded: false, reason: 'zero_points' };
  }

  const reference = `${refType}:${refId}`;
  const existing = await LoyaltyHistory.findOne({ reference, type: 'earned' });
  if (existing) {
    return { awarded: false, reason: 'already_awarded' };
  }

  const loyaltyEntry = new LoyaltyHistory({
    user_id: userId,
    points,
    type: 'earned',
    reference,
    source: type === 'products' ? 'admin' : type,
    description: description || `Earned ${points} points from ${type}`
  });

  await loyaltyEntry.save();
  await User.findByIdAndUpdate(userId, { $inc: { loyalty_points: points } });

  return { awarded: true, points };
};

module.exports = {
  awardPoints,
  POINTS
};
