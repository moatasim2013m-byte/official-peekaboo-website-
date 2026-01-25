const express = require('express');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const UserSubscription = require('../models/UserSubscription');
const Child = require('../models/Child');
const User = require('../models/User');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { sendEmail, emailTemplates } = require('../utils/email');
const { addDays } = require('date-fns');

const router = express.Router();
const SUBSCRIPTION_DAYS = 30;

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
// NOTE: Expiry is set to null - it starts counting from FIRST CHECK-IN
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

    // expires_at is null until first check-in
    const subscription = new UserSubscription({
      user_id: req.userId,
      child_id,
      plan_id,
      remaining_visits: plan.visits,
      expires_at: null, // Will be set on first check-in
      payment_id,
      status: 'pending' // Pending until first check-in activates it
    });

    await subscription.save();

    // NO loyalty points for subscriptions (only hourly gets points)

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

    // Update expired subscriptions (only those that have been activated)
    const now = new Date();
    for (const sub of subscriptions) {
      if (sub.status === 'active' && sub.expires_at && sub.expires_at < now) {
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

    // Find subscription that is either pending (not yet activated) or active with visits remaining
    const subscription = await UserSubscription.findOne({
      child_id: req.params.childId,
      status: { $in: ['pending', 'active'] },
      remaining_visits: { $gt: 0 },
      $or: [
        { expires_at: null }, // Pending, not yet activated
        { expires_at: { $gt: new Date() } } // Active and not expired
      ]
    }).populate('plan_id');

    res.json({ subscription: subscription ? subscription.toJSON() : null });
  } catch (error) {
    console.error('Get child subscription error:', error);
    res.status(500).json({ error: 'Failed to get subscription' });
  }
});

// Consume subscription visit (reception scan)
// This also activates the subscription if it's the first use
router.post('/consume', authMiddleware, async (req, res) => {
  try {
    const { child_id } = req.body;
    
    // Find subscription that is pending or active
    const subscription = await UserSubscription.findOne({
      child_id,
      status: { $in: ['pending', 'active'] },
      remaining_visits: { $gt: 0 },
      $or: [
        { expires_at: null }, // Pending, not yet activated
        { expires_at: { $gt: new Date() } } // Active and not expired
      ]
    }).populate('plan_id').populate('child_id');

    if (!subscription) {
      return res.status(400).json({ error: 'No active subscription found for this child' });
    }

    // If this is the first check-in (pending status), activate and set expiry
    if (subscription.status === 'pending') {
      subscription.status = 'active';
      subscription.expires_at = addDays(new Date(), SUBSCRIPTION_DAYS);
      subscription.first_checkin_at = new Date();
    }

    subscription.remaining_visits -= 1;
    if (subscription.remaining_visits === 0) {
      subscription.status = 'consumed';
    }
    await subscription.save();

    res.json({
      message: 'Visit consumed successfully',
      subscription: subscription.toJSON(),
      first_activation: subscription.first_checkin_at ? true : false
    });
  } catch (error) {
    console.error('Consume subscription error:', error);
    res.status(500).json({ error: 'Failed to consume visit' });
  }
});

module.exports = router;
