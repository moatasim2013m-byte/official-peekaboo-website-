const express = require('express');
const Stripe = require('stripe');
const PaymentTransaction = require('../models/PaymentTransaction');
const HourlyBooking = require('../models/HourlyBooking');
const BirthdayBooking = require('../models/BirthdayBooking');
const UserSubscription = require('../models/UserSubscription');
const Settings = require('../models/Settings');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_API_KEY);

// Fixed pricing packages (never accept from frontend)
const getHourlyPrice = async () => {
  const setting = await Settings.findOne({ key: 'hourly_price' });
  return setting?.value || 10.00; // Default $10
};

const getBirthdayThemePrice = async (themeId) => {
  const Theme = require('../models/Theme');
  const theme = await Theme.findById(themeId);
  return theme?.price || 100.00;
};

const getSubscriptionPrice = async (planId) => {
  const SubscriptionPlan = require('../models/SubscriptionPlan');
  const plan = await SubscriptionPlan.findById(planId);
  return plan?.price || 50.00;
};

// Create checkout session
router.post('/create-checkout', authMiddleware, async (req, res) => {
  try {
    const { type, reference_id, origin_url } = req.body;
    
    if (!type || !origin_url) {
      return res.status(400).json({ error: 'type and origin_url are required' });
    }

    let amount;
    let metadata = { type, user_id: req.userId.toString() };

    // Get amount from server-side pricing
    switch (type) {
      case 'hourly':
        amount = await getHourlyPrice();
        metadata.slot_id = reference_id;
        break;
      case 'birthday':
        if (!req.body.theme_id) {
          return res.status(400).json({ error: 'theme_id required for birthday booking' });
        }
        amount = await getBirthdayThemePrice(req.body.theme_id);
        metadata.slot_id = reference_id;
        metadata.theme_id = req.body.theme_id;
        break;
      case 'subscription':
        if (!reference_id) {
          return res.status(400).json({ error: 'plan_id required for subscription' });
        }
        amount = await getSubscriptionPrice(reference_id);
        metadata.plan_id = reference_id;
        break;
      default:
        return res.status(400).json({ error: 'Invalid payment type' });
    }

    if (req.body.child_id) {
      metadata.child_id = req.body.child_id;
    }

    // Build success/cancel URLs from frontend origin
    const successUrl = `${origin_url}/payment/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${origin_url}/payment/cancel`;

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Peekaboo ${type.charAt(0).toUpperCase() + type.slice(1)} Booking`,
          },
          unit_amount: Math.round(amount * 100), // Stripe uses cents
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata,
    });

    // Create pending payment transaction
    const transaction = new PaymentTransaction({
      session_id: session.id,
      user_id: req.userId,
      amount,
      currency: 'usd',
      status: 'pending',
      type,
      reference_id,
      metadata
    });
    await transaction.save();

    res.json({ url: session.url, session_id: session.id });
  } catch (error) {
    console.error('Create checkout error:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Get checkout status
router.get('/status/:sessionId', authMiddleware, async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // Get session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    // Update our transaction record
    const transaction = await PaymentTransaction.findOne({ session_id: sessionId });
    if (transaction && transaction.status !== 'paid') {
      transaction.payment_status = session.payment_status;
      
      if (session.payment_status === 'paid') {
        transaction.status = 'paid';
        transaction.payment_id = session.payment_intent;
      } else if (session.status === 'expired') {
        transaction.status = 'expired';
      }
      
      transaction.updated_at = new Date();
      await transaction.save();
    }

    res.json({
      status: session.status,
      payment_status: session.payment_status,
      payment_id: session.payment_intent,
      metadata: session.metadata
    });
  } catch (error) {
    console.error('Get checkout status error:', error);
    res.status(500).json({ error: 'Failed to get checkout status' });
  }
});

// Webhook for Stripe events
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const event = req.body;
    
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      
      // Update transaction
      const transaction = await PaymentTransaction.findOne({ session_id: session.id });
      if (transaction && transaction.status !== 'paid') {
        transaction.status = 'paid';
        transaction.payment_status = 'paid';
        transaction.payment_id = session.payment_intent;
        transaction.updated_at = new Date();
        await transaction.save();
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Get payment history
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const transactions = await PaymentTransaction.find({ 
      user_id: req.userId,
      status: 'paid'
    }).sort({ created_at: -1 });

    res.json({ transactions: transactions.map(t => t.toJSON()) });
  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({ error: 'Failed to get payment history' });
  }
});

module.exports = router;
