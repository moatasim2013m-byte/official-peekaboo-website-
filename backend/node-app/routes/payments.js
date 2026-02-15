const express = require('express');
const Stripe = require('stripe');
const crypto = require('crypto');
const PaymentTransaction = require('../models/PaymentTransaction');
const Settings = require('../models/Settings');
const TimeSlot = require('../models/TimeSlot');
const Product = require('../models/Product');
const { authMiddleware } = require('../middleware/auth');
const { awardPoints } = require('../utils/awardPoints');
const { validateCoupon } = require('../utils/coupons');

const router = express.Router();

const PAYMENT_PROVIDERS = {
  MANUAL: 'manual',
  STRIPE: 'stripe',
  CAPITAL_BANK: 'capital_bank'
};

const paymentProvider = (process.env.PAYMENT_PROVIDER || PAYMENT_PROVIDERS.MANUAL).toLowerCase();

// Initialize Stripe when explicitly selected.
let stripe = null;
if (paymentProvider === PAYMENT_PROVIDERS.STRIPE && process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  console.log('[Payments] Stripe provider enabled');
} else if (paymentProvider === PAYMENT_PROVIDERS.STRIPE) {
  console.warn('[Payments] Stripe selected but STRIPE_SECRET_KEY is missing. Falling back to manual mode.');
}

const capitalBankConfig = {
  merchantId: process.env.CAPITAL_BANK_MERCHANT_ID,
  terminalId: process.env.CAPITAL_BANK_TERMINAL_ID,
  apiKey: process.env.CAPITAL_BANK_API_KEY,
  hostedCheckoutUrl: process.env.CAPITAL_BANK_HOSTED_CHECKOUT_URL,
  callbackSecret: process.env.CAPITAL_BANK_CALLBACK_SECRET
};

const capitalBankReady = Boolean(
  paymentProvider === PAYMENT_PROVIDERS.CAPITAL_BANK
  && capitalBankConfig.merchantId
  && capitalBankConfig.terminalId
  && capitalBankConfig.apiKey
  && capitalBankConfig.hostedCheckoutUrl
);

if (paymentProvider === PAYMENT_PROVIDERS.CAPITAL_BANK) {
  if (capitalBankReady) {
    console.log('[Payments] Capital Bank provider enabled (hosted checkout)');
  } else {
    console.warn('[Payments] Capital Bank selected but required env vars are missing. Falling back to manual mode.');
  }
}

const getEffectiveProvider = () => {
  if (paymentProvider === PAYMENT_PROVIDERS.CAPITAL_BANK && capitalBankReady) return PAYMENT_PROVIDERS.CAPITAL_BANK;
  if (paymentProvider === PAYMENT_PROVIDERS.STRIPE && stripe) return PAYMENT_PROVIDERS.STRIPE;
  return PAYMENT_PROVIDERS.MANUAL;
};


// Morning (Happy Hour) price: 3.5 JD per hour
const MORNING_PRICE_PER_HOUR = 3.5;

// Get hourly price from Settings or use defaults
const getHourlyPrice = async (duration_hours = 2, slot_start_time = null) => {
  const hours = parseInt(duration_hours) || 2;

  // Happy Hour logic: 10:00-13:59 => 3.5 JD per hour
  if (slot_start_time) {
    try {
      const [startHour] = slot_start_time.split(':').map(Number);
      const isHappyHour = startHour >= 10 && startHour < 14;
      
      if (isHappyHour) {
        return 3.5 * hours; // Happy Hour: 3.5 JD per hour
      }
    } catch (err) {
      console.error('Error parsing slot_start_time:', err);
      // Fall through to normal pricing
    }
  }

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

const buildLineItems = async (lineItems = []) => {
  if (!Array.isArray(lineItems) || lineItems.length === 0) {
    return { normalizedLineItems: [], productsTotal: 0 };
  }

  const quantityByProduct = new Map();
  lineItems.forEach((item) => {
    const productId = (item?.productId || item?.product_id || '').toString().trim();
    const qty = parseInt(item?.quantity, 10) || 0;
    if (!productId || qty <= 0) return;
    quantityByProduct.set(productId, (quantityByProduct.get(productId) || 0) + qty);
  });

  const productIds = [...quantityByProduct.keys()];
  if (productIds.length === 0) return { normalizedLineItems: [], productsTotal: 0 };

  const products = await Product.find({ _id: { $in: productIds }, active: true });
  const productsMap = new Map(products.map((product) => [product._id.toString(), product]));

  const normalizedLineItems = [];
  let productsTotal = 0;

  quantityByProduct.forEach((quantity, productId) => {
    const product = productsMap.get(productId);
    if (!product) return;

    const unitPriceJD = Number(product.priceJD) || 0;
    const lineTotalJD = unitPriceJD * quantity;
    productsTotal += lineTotalJD;

    normalizedLineItems.push({
      productId: product._id.toString(),
      sku: product.sku,
      nameAr: product.nameAr,
      nameEn: product.nameEn,
      unitPriceJD,
      quantity,
      lineTotalJD
    });
  });

  return { normalizedLineItems, productsTotal };
};

// Get hourly pricing info (public endpoint for frontend)
router.get('/hourly-pricing', async (req, res) => {
  try {
    const { timeMode } = req.query;
    
    // Morning mode: flat 3.5 JD per hour
    if (timeMode === 'morning') {
      return res.json({
        pricing: [
          { hours: 1, price: 3.5, label: '1 Hour', label_ar: 'ساعة واحدة' },
          { hours: 2, price: 7, label: '2 Hours', label_ar: 'ساعتان' },
          { hours: 3, price: 10.5, label: '3 Hours', label_ar: '3 ساعات' }
        ],
        extra_hour_price: 3.5,
        extra_hour_text: 'كل ساعة = 3.5 دينار فقط (عرض الصباح)',
        currency: 'JD',
        timeMode: 'morning'
      });
    }
    
    // Afternoon mode: standard pricing
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
      currency: 'JD',
      timeMode: 'afternoon'
    });
  } catch (error) {
    console.error('Get hourly pricing error:', error);
    res.status(500).json({ error: 'Failed to get pricing' });
  }
});

// Create checkout session
router.post('/create-checkout', authMiddleware, async (req, res) => {
  try {
    const effectiveProvider = getEffectiveProvider();

    // Manual payment mode
    if (effectiveProvider === PAYMENT_PROVIDERS.MANUAL) {
      return res.status(200).json({
        message: 'Manual payment only (cash / cliq)',
        payment_method: 'manual'
      });
    }

    const { type, reference_id, origin_url, duration_hours, custom_notes, timeMode, lineItems, coupon_code } = req.body;

    if (!type || !origin_url) {
      return res.status(400).json({ error: 'type and origin_url are required' });
    }

    const { normalizedLineItems, productsTotal } = await buildLineItems(lineItems);

    let amount;
    let metadata = { type, user_id: req.userId.toString() };
    if (normalizedLineItems.length > 0) {
      metadata.line_items = JSON.stringify(normalizedLineItems);
    }

    // Get amount from server-side pricing
    switch (type) {
      case 'hourly': {
        const hours = parseInt(duration_hours) || 2;
        const childIds = req.body.child_ids || (req.body.child_id ? [req.body.child_id] : []);
        const childCount = childIds.length || 1;
        const slotStartTime = req.body.slot_start_time || null;

        // Check capacity before creating checkout
        const slot = await TimeSlot.findById(reference_id);
        if (!slot) {
          return res.status(400).json({ error: 'الوقت غير صالح' });
        }
        const availableSpots = slot.capacity - slot.booked_count;
        if (availableSpots < childCount) {
          return res.status(400).json({ error: `عذراً، المتاح ${availableSpots} مكان فقط. اخترت ${childCount} أطفال.` });
        }

        const basePrice = await getHourlyPrice(hours, slotStartTime);
        amount = (basePrice * childCount) + productsTotal;
        metadata.slot_id = reference_id;
        metadata.duration_hours = hours;
        metadata.child_ids = JSON.stringify(childIds);
        if (slotStartTime) metadata.slot_start_time = slotStartTime;
        if (custom_notes) metadata.custom_notes = custom_notes;
        break;
      }
      case 'birthday': {
        if (!req.body.theme_id) {
          return res.status(400).json({ error: 'theme_id required for birthday booking' });
        }
        amount = (await getBirthdayThemePrice(req.body.theme_id)) + productsTotal;
        metadata.slot_id = reference_id;
        metadata.theme_id = req.body.theme_id;
        break;
      }
      case 'subscription': {
        if (!reference_id) {
          return res.status(400).json({ error: 'plan_id required for subscription' });
        }
        amount = await getSubscriptionPrice(reference_id);
        metadata.plan_id = reference_id;
        break;
      }
      default:
        return res.status(400).json({ error: 'Invalid payment type' });
    }

    // Handle child_ids for multi-child booking (backward compat with child_id)
    if (req.body.child_ids && req.body.child_ids.length > 0) {
      metadata.child_ids = JSON.stringify(req.body.child_ids);
    } else if (req.body.child_id) {
      metadata.child_ids = JSON.stringify([req.body.child_id]);
    }

    // Apply coupon discount when provided
    if (coupon_code) {
      const couponValidation = await validateCoupon({
        code: coupon_code,
        amount,
        type
      });
      if (!couponValidation.valid) {
        return res.status(400).json({ error: couponValidation.message });
      }
      const { normalizedCode, discountAmount, finalAmount } = couponValidation;
      amount = finalAmount;
      metadata.coupon_code = normalizedCode;
      metadata.discount_amount = discountAmount;
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

    let sessionId;
    let checkoutUrl;
    let currency = 'jod';

    if (effectiveProvider === PAYMENT_PROVIDERS.STRIPE) {
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

      sessionId = session.id;
      checkoutUrl = session.url;
      currency = 'usd';
    }

    if (effectiveProvider === PAYMENT_PROVIDERS.CAPITAL_BANK) {
      sessionId = `cb_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

      const callbackUrl = `${origin_url}/payment/success`;
      const payload = {
        merchant_id: capitalBankConfig.merchantId,
        terminal_id: capitalBankConfig.terminalId,
        order_id: sessionId,
        amount: amount.toFixed(2),
        currency: 'JOD',
        description: `Peekaboo ${type} booking`,
        return_url: callbackUrl,
        cancel_url: cancelUrl,
        customer_reference: req.userId.toString(),
        timestamp: new Date().toISOString()
      };

      const signatureSeed = [
        payload.merchant_id,
        payload.terminal_id,
        payload.order_id,
        payload.amount,
        payload.currency,
        capitalBankConfig.apiKey
      ].join('|');

      const signature = crypto
        .createHmac('sha256', capitalBankConfig.apiKey)
        .update(signatureSeed)
        .digest('hex');

      const checkoutParams = new URLSearchParams({
        ...payload,
        signature
      });

      checkoutUrl = `${capitalBankConfig.hostedCheckoutUrl}?${checkoutParams.toString()}`;
      currency = 'jod';
      metadata.capital_bank_signature = signature;
    }

    // Create pending payment transaction
    const transaction = new PaymentTransaction({
      session_id: sessionId,
      user_id: req.userId,
      amount,
      currency,
      status: 'pending',
      type,
      reference_id,
      provider: effectiveProvider,
      metadata
    });
    await transaction.save();

    console.log('Checkout session created:', sessionId, 'provider:', effectiveProvider);
    res.json({
      url: checkoutUrl,
      session_id: sessionId,
      payment_provider: effectiveProvider
    });
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
    const effectiveProvider = getEffectiveProvider();

    const { sessionId } = req.params;

    if (effectiveProvider === PAYMENT_PROVIDERS.STRIPE) {
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

        if (transaction.status === 'paid' && transaction.type === 'product') {
          await awardPoints({
            userId: transaction.user_id,
            refType: 'product_purchase',
            refId: transaction._id.toString(),
            type: 'products',
            amount: transaction.amount,
            description: `Earned points from product purchase (${transaction.amount} JD)`
          });
        }
      }

      return res.json({
        status: session.status,
        payment_status: session.payment_status,
        payment_id: session.payment_intent,
        metadata: session.metadata,
        payment_provider: effectiveProvider
      });
    }

    const transaction = await PaymentTransaction.findOne({ session_id: sessionId, user_id: req.userId });
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    if (effectiveProvider === PAYMENT_PROVIDERS.CAPITAL_BANK) {
      return res.json({
        status: transaction.status,
        payment_status: transaction.payment_status || (transaction.status === 'paid' ? 'paid' : 'pending'),
        payment_id: transaction.payment_id,
        metadata: transaction.metadata,
        payment_provider: effectiveProvider
      });
    }

    return res.json({
      status: transaction.status,
      payment_status: transaction.payment_status || 'pending',
      payment_id: transaction.payment_id,
      metadata: transaction.metadata,
      payment_provider: effectiveProvider
    });
  } catch (error) {
    console.error('Get checkout status error:', error);
    res.status(500).json({ error: 'Failed to get checkout status' });
  }
});

// Capital Bank payment callback/webhook to finalize pending transactions
router.post('/capital-bank/callback', async (req, res) => {
  try {
    const { order_id, transaction_id, status, payment_status, amount, signature } = req.body || {};

    if (!order_id) {
      return res.status(400).json({ error: 'order_id is required' });
    }

    if (capitalBankConfig.callbackSecret && signature) {
      const expected = crypto
        .createHmac('sha256', capitalBankConfig.callbackSecret)
        .update(`${order_id}|${status || ''}|${amount || ''}`)
        .digest('hex');

      if (expected !== signature) {
        return res.status(401).json({ error: 'Invalid callback signature' });
      }
    }

    const transaction = await PaymentTransaction.findOne({ session_id: order_id });
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const normalizedStatus = (payment_status || status || '').toLowerCase();
    const isPaid = ['paid', 'success', 'successful', 'captured', 'approved'].includes(normalizedStatus);
    const isFailed = ['failed', 'declined', 'cancelled', 'canceled'].includes(normalizedStatus);

    if (isPaid) {
      transaction.status = 'paid';
      transaction.payment_status = 'paid';
      transaction.payment_id = transaction_id || transaction.payment_id;
    } else if (isFailed) {
      transaction.status = 'failed';
      transaction.payment_status = normalizedStatus || 'failed';
    } else {
      transaction.payment_status = normalizedStatus || transaction.payment_status || 'pending';
    }

    transaction.updated_at = new Date();
    await transaction.save();

    if (transaction.status === 'paid' && transaction.type === 'product') {
      await awardPoints({
        userId: transaction.user_id,
        refType: 'product_purchase',
        refId: transaction._id.toString(),
        type: 'products',
        amount: transaction.amount,
        description: `Earned points from product purchase (${transaction.amount} JD)`
      });
    }

    return res.json({ received: true, session_id: order_id, status: transaction.status });
  } catch (error) {
    console.error('Capital Bank callback error:', error);
    res.status(500).json({ error: 'Failed to process callback' });
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

        if (transaction.type === 'product') {
          await awardPoints({
            userId: transaction.user_id,
            refType: 'product_purchase',
            refId: transaction._id.toString(),
            type: 'products',
            amount: transaction.amount,
            description: `Earned points from product purchase (${transaction.amount} JD)`
          });
        }
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
