const express = require('express');
const Stripe = require('stripe');
const PaymentTransaction = require('../models/PaymentTransaction');
const Settings = require('../models/Settings');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Initialize Stripe with the API key
const stripeApiKey = process.env.STRIPE_API_KEY;
let stripe;
try {
  stripe = new Stripe(stripeApiKey);
} catch (error) {
  console.error('Stripe initialization error:', error.message);
}

// Get hourly price from Settings or use defaults
const getHourlyPrice = async (duration_hours = 2) => {
  const hours = parseInt(duration_hours) || 2;
  
  try {
    // Fetch pricing from Settings
    const pricing = await Settings.find({ 
      key: { $in: ['hourly_1hr', 'hourly_2hr', 'hourly_3hr', 'hourly_extra_hr'] } 
    });
    
    const prices = {
      hourly_1hr: 7,
      hourly_2hr: 10,
      hourly_3hr: 13,
      hourly_extra_hr: 3
    };
    
    pricing.forEach(p => { prices[p.key] = parseFloat(p.value); });
    
    if (hours === 1) return prices.hourly_1hr;
    if (hours === 2) return prices.hourly_2hr;
    if (hours === 3) return prices.hourly_3hr;
    // For 4+ hours: 2h base price + extra hour price per additional hour
    return prices.hourly_2hr + (hours - 2) * prices.hourly_extra_hr;
  } catch (error) {
    console.error('Error fetching hourly pricing:', error);
    // Fallback to defaults
    if (hours === 1) return 7;
    if (hours === 2) return 10;
    if (hours === 3) return 13;
    return 10 + (hours - 2) * 3;
  }
};

const getBirthdayThemePrice = async (themeId) => {
  const Theme = require('../models/Theme');
  const theme = await Theme.findById(themeId);
  return parseFloat(theme?.price) || 100.00;
};

const getSubscriptionPrice = async (planId) => {
  const SubscriptionPlan = require('../models/SubscriptionPlan');
  const plan = await SubscriptionPlan.findById(planId);
  return parseFloat(plan?.price) || 50.00;
};

// Get hourly pricing info (public endpoint for frontend)
router.get('/hourly-pricing', async (req, res) => {
  try {
    const pricing = await Settings.find({ 
      key: { $in: ['hourly_1hr', 'hourly_2hr', 'hourly_3hr', 'hourly_extra_hr'] } 
    });
    
    const prices = {
      hourly_1hr: 7,
      hourly_2hr: 10,
      hourly_3hr: 13,
      hourly_extra_hr: 3
    };
    
    pricing.forEach(p => { prices[p.key] = parseFloat(p.value); });
    
    res.json({
      pricing: [
        { hours: 1, price: prices.hourly_1hr, label: '1 Hour', label_ar: 'ساعة واحدة' },
        { hours: 2, price: prices.hourly_2hr, label: '2 Hours', label_ar: 'ساعتان', best_value: true },
        { hours: 3, price: prices.hourly_3hr, label: '3 Hours', label_ar: '3 ساعات' }
      ],
      extra_hour_price: prices.hourly_extra_hr,
      extra_hour_text: 'كل ساعة إضافية بعد الساعتين = 3 دنانير فقط',
      currency: 'JD'
    });
  } catch (error) {
    console.error('Get hourly pricing error:', error);
    res.status(500).json({ error: 'Failed to get pricing' });
  }
});

// Create checkout session
router.post('/create-checkout', authMiddleware, async (req, res) => {
  try {
    if (!stripe) {
      console.error('Stripe not initialized. API Key:', stripeApiKey ? 'Present' : 'Missing');
      return res.status(500).json({ error: 'Payment service not configured' });
    }

    const { type, reference_id, origin_url, duration_hours } = req.body;
    
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

    // Ensure amount is a valid float
    amount = parseFloat(amount);
    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: 'Invalid price configuration' });
    }

    // Build success/cancel URLs from frontend origin
    const successUrl = `${origin_url}/payment/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${origin_url}/payment/cancel`;

    console.log('Creating checkout session:', { type, amount, metadata });

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

    console.log('Checkout session created:', session.id);
    res.json({ url: session.url, session_id: session.id });
  } catch (error) {
    console.error('Create checkout error:', error);
    res.status(500).json({ 
      error: 'Failed to create checkout session',
      details: error.message 
    });
  }
});

// Get checkout status
router.get('/status/:sessionId', authMiddleware, async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ error: 'Payment service not configured' });
    }

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

// Store transaction (called by Python gateway after Stripe checkout creation)
router.post('/store-transaction', authMiddleware, async (req, res) => {
  try {
    const { session_id, user_id, amount, currency, type, reference_id, metadata } = req.body;
    
    const transaction = new PaymentTransaction({
      session_id,
      user_id: user_id || req.userId,
      amount,
      currency: currency || 'usd',
      status: 'pending',
      type,
      reference_id,
      metadata
    });
    await transaction.save();
    
    res.status(201).json({ transaction: transaction.toJSON() });
  } catch (error) {
    console.error('Store transaction error:', error);
    res.status(500).json({ error: 'Failed to store transaction' });
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
