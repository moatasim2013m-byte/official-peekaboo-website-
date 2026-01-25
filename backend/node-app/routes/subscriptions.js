const express = require('express');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const UserSubscription = require('../models/UserSubscription');
const Child = require('../models/Child');
const User = require('../models/User');
const LoyaltyHistory = require('../models/LoyaltyHistory');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { sendEmail, emailTemplates } = require('../utils/email');
const { addDays } = require('date-fns');

const router = express.Router();
const LOYALTY_POINTS_PER_ORDER = 10;
const SUBSCRIPTION_DAYS = 30;

// Award loyalty points (idempotent by payment_id)
const awardLoyaltyPoints = async (userId, paymentId, source) => {
  const existing = await LoyaltyHistory.findOne({ reference: paymentId, type: 'earned' });
  if (existing) return false;

  const loyaltyEntry = new LoyaltyHistory({
    user_id: userId,
    points: LOYALTY_POINTS_PER_ORDER,
    type: 'earned',
    reference: paymentId,
    source,
    description: `Earned ${LOYALTY_POINTS_PER_ORDER} points from ${source} purchase`
  });
  await loyaltyEntry.save();
  await User.findByIdAndUpdate(userId, { $inc: { loyalty_points: LOYALTY_POINTS_PER_ORDER } });
  return true;
};

// Get all subscription plans
router.get('/plans', async (req, res) => {
  try {
    const plans = await SubscriptionPlan.find({ is_active: true }).sort({ price: 1 });
    res.json({ plans: plans.map(p => p.toJSON()) });
  } catch (error) {
    console.error('Get plans error:', error);
    res.status(500).json({ error: 'Failed to get plans' });
  }
});

// Get single plan
router.get('/plans/:id', async (req, res) => {
  try {
    const plan = await SubscriptionPlan.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }
    res.json({ plan: plan.toJSON() });
  } catch (error) {
    console.error('Get plan error:', error);
    res.status(500).json({ error: 'Failed to get plan' });
  }
});

// Purchase subscription (after payment confirmed)
router.post('/purchase', authMiddleware, async (req, res) => {
  try {
    const { plan_id, child_id, payment_id } = req.body;
    
    const plan = await SubscriptionPlan.findById(plan_id);
    if (!plan || !plan.is_active) {
      return res.status(400).json({ error: 'Invalid plan' });
    }

    const child = await Child.findOne({ _id: child_id, parent_id: req.userId });
    if (!child) {
      return res.status(400).json({ error: 'Invalid child' });
    }

    const expires_at = addDays(new Date(), SUBSCRIPTION_DAYS);

    const subscription = new UserSubscription({
      user_id: req.userId,
      child_id,
      plan_id,
      remaining_visits: plan.visits,
      expires_at,
      payment_id,
      status: 'active'
    });

    await subscription.save();

    // Award loyalty points
    if (payment_id) {
      await awardLoyaltyPoints(req.userId, payment_id, 'subscription');
    }

    // Send confirmation email
    const user = await User.findById(req.userId);
    const template = emailTemplates.subscriptionConfirmation(subscription, plan, child);
    await sendEmail(user.email, template.subject, template.html);

    res.status(201).json({ subscription: subscription.toJSON() });
  } catch (error) {
    console.error('Purchase subscription error:', error);
    res.status(500).json({ error: 'Failed to purchase subscription' });
  }
});

// Get user's subscriptions
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const subscriptions = await UserSubscription.find({ user_id: req.userId })
      .populate('plan_id')
      .populate('child_id')
      .sort({ created_at: -1 });

    // Update expired subscriptions
    const now = new Date();
    for (const sub of subscriptions) {
      if (sub.status === 'active' && sub.expires_at < now) {
        sub.status = 'expired';
        await sub.save();
      }
    }

    res.json({ subscriptions: subscriptions.map(s => s.toJSON()) });
  } catch (error) {
    console.error('Get subscriptions error:', error);
    res.status(500).json({ error: 'Failed to get subscriptions' });
  }
});

// Get active subscriptions for a child
router.get('/child/:childId', authMiddleware, async (req, res) => {
  try {
    const child = await Child.findOne({ _id: req.params.childId, parent_id: req.userId });
    if (!child) {
      return res.status(404).json({ error: 'Child not found' });
    }

    const subscription = await UserSubscription.findOne({
      child_id: req.params.childId,
      status: 'active',
      remaining_visits: { $gt: 0 },
      expires_at: { $gt: new Date() }
    }).populate('plan_id');

    res.json({ subscription: subscription ? subscription.toJSON() : null });
  } catch (error) {
    console.error('Get child subscription error:', error);
    res.status(500).json({ error: 'Failed to get subscription' });
  }
});

// Consume subscription visit (reception scan)
router.post('/consume', authMiddleware, async (req, res) => {
  try {
    const { child_id } = req.body;
    
    const subscription = await UserSubscription.findOne({
      child_id,
      status: 'active',
      remaining_visits: { $gt: 0 },
      expires_at: { $gt: new Date() }
    }).populate('plan_id').populate('child_id');

    if (!subscription) {
      return res.status(400).json({ error: 'No active subscription found for this child' });
    }

    subscription.remaining_visits -= 1;
    if (subscription.remaining_visits === 0) {
      subscription.status = 'consumed';
    }
    await subscription.save();

    res.json({
      message: 'Visit consumed successfully',
      subscription: subscription.toJSON()
    });
  } catch (error) {
    console.error('Consume subscription error:', error);
    res.status(500).json({ error: 'Failed to consume visit' });
  }
});

module.exports = router;
