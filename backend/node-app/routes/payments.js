const express = require('express');
const PaymentTransaction = require('../models/PaymentTransaction');
const Settings = require('../models/Settings');
const TimeSlot = require('../models/TimeSlot');
const Product = require('../models/Product');
const { authMiddleware } = require('../middleware/auth');
const loyaltyRouter = require('./loyalty');
const { awardPoints } = loyaltyRouter;
const { validateCoupon } = require('../utils/coupons');
const { buildCyberSourceAuthHeaders, verifyCapitalBankCallbackSignature } = require('../utils/cybersourceSign');

const router = express.Router();

const PAYMENT_PROVIDERS = {
  MANUAL: 'manual',
  CAPITAL_BANK: 'capital_bank',
  CAPITAL_BANK_REST: 'capital_bank_rest'
};


const paymentProvider = (process.env.PAYMENT_PROVIDER || PAYMENT_PROVIDERS.MANUAL).toLowerCase();

const DEV_ENVIRONMENTS = new Set(['development', 'dev', 'local', 'test']);

const isLoyaltyDuplicateError = (error) => {
  return error?.code === 'LOYALTY_DUPLICATE_REFERENCE' || error?.code === 11000;
};

const maybeAwardProductLoyaltyPoints = async (transaction) => {
  const points = Math.round(Number(transaction?.amount || 0) * 10);
  if (!transaction?.user_id || points <= 0) return;

  try {
    await awardPoints(
      transaction.user_id,
      points,
      'نقاط على شراء منتج',
      'product',
      transaction._id.toString()
    );
    if (DEV_ENVIRONMENTS.has(process.env.NODE_ENV)) {
      console.log('LOYALTY_POINTS_AWARDED', {
        userId: transaction.user_id.toString(),
        refType: 'product',
        refId: transaction._id.toString(),
        points
      });
    }
  } catch (error) {
    if (!isLoyaltyDuplicateError(error)) throw error;
  }
};

const capitalBankConfig = {
  merchantId: process.env.CAPITAL_BANK_MERCHANT_ID,
  accessKey: process.env.CAPITAL_BANK_ACCESS_KEY,
  secretKey: process.env.CAPITAL_BANK_SECRET_KEY,
  locale: process.env.CAPITAL_BANK_LOCALE || 'ar',
  currency: (process.env.CAPITAL_BANK_CURRENCY || 'JOD').toUpperCase(),
  paymentEndpoint: process.env.CAPITAL_BANK_PAYMENT_ENDPOINT || 'https://apitest.cybersource.com'
};

const capitalBankRestReady = Boolean(
  [PAYMENT_PROVIDERS.CAPITAL_BANK, PAYMENT_PROVIDERS.CAPITAL_BANK_REST].includes(paymentProvider)
  && capitalBankConfig.merchantId
  && capitalBankConfig.accessKey
  && capitalBankConfig.secretKey
  && capitalBankConfig.paymentEndpoint
);

if ([PAYMENT_PROVIDERS.CAPITAL_BANK, PAYMENT_PROVIDERS.CAPITAL_BANK_REST].includes(paymentProvider)) {
  if (capitalBankRestReady) {
    console.log('[Payments] Capital Bank REST TEST mode active');
  } else {
    console.warn('[Payments] Capital Bank selected but required REST env vars are missing. Falling back to manual mode.');
  }
}

const getEffectiveProvider = () => {
  if ([PAYMENT_PROVIDERS.CAPITAL_BANK, PAYMENT_PROVIDERS.CAPITAL_BANK_REST].includes(paymentProvider) && capitalBankRestReady) return PAYMENT_PROVIDERS.CAPITAL_BANK;
  return PAYMENT_PROVIDERS.MANUAL;
};

const ensureHttpsForCapitalBank = (req, res, next) => {
  const forwardedProto = (req.headers['x-forwarded-proto'] || '').split(',')[0].trim();
  const protocol = forwardedProto || req.protocol;
  const isLocal = DEV_ENVIRONMENTS.has(process.env.NODE_ENV);
  if (protocol !== 'https' && !isLocal) {
    return res.status(400).json({ error: 'HTTPS is required for payment endpoints' });
  }
  return next();
};

const normalizeOrigin = (value) => {
  if (!value || typeof value !== 'string') return null;
  try {
    const candidate = new URL(value);
    if (!['http:', 'https:'].includes(candidate.protocol)) return null;
    return candidate.origin;
  } catch (_) {
    return null;
  }
};

const getAllowedFrontendOrigins = () => {
  const configured = [process.env.FRONTEND_URL, process.env.CORS_ORIGINS]
    .filter(Boolean)
    .flatMap((entry) => entry.split(',').map((item) => item.trim()))
    .map(normalizeOrigin)
    .filter(Boolean);

  return new Set(configured);
};

const resolveFrontendOrigin = (originUrl, req) => {
  const allowedOrigins = getAllowedFrontendOrigins();
  const requestOrigin = normalizeOrigin(req.get('origin'));
  const payloadOrigin = normalizeOrigin(originUrl);

  if (payloadOrigin && allowedOrigins.has(payloadOrigin)) return payloadOrigin;
  if (requestOrigin && allowedOrigins.has(requestOrigin)) return requestOrigin;

  const configuredFrontend = normalizeOrigin(process.env.FRONTEND_URL);
  if (configuredFrontend) return configuredFrontend;

  return null;
};

const buildFrontendRedirectUrl = (frontendOrigin, pathName, sessionId) => {
  const safeOrigin = normalizeOrigin(frontendOrigin);
  if (!safeOrigin) return null;
  const redirectUrl = new URL(pathName, safeOrigin);
  redirectUrl.searchParams.set('session_id', sessionId);
  return redirectUrl.toString();
};

const requireCsrfToken = (req, res, next) => {
  const csrfToken = req.get('x-csrf-token');
  const frontendOrigin = resolveFrontendOrigin(null, req);
  const requestOrigin = normalizeOrigin(req.get('origin') || req.get('referer'));
  if (!csrfToken || csrfToken.length < 16) {
    return res.status(403).json({ error: 'Missing CSRF token' });
  }
  if (frontendOrigin && requestOrigin && frontendOrigin !== requestOrigin) {
    return res.status(403).json({ error: 'Untrusted request origin' });
  }
  return next();
};

const resolveOrderTransaction = async (orderId, userId) => {
  const search = [
    { _id: orderId },
    { session_id: orderId },
    { reference_id: orderId }
  ];

  for (const criteria of search) {
    try {
      const record = await PaymentTransaction.findOne({ ...criteria, user_id: userId });
      if (record) return record;
    } catch (_err) {
      // ignore invalid ObjectId for _id lookup
    }
  }
  return null;
};

const toAmountString = (amount) => Number(amount || 0).toFixed(2);

const mapCyberSourceDecision = (responsePayload = {}) => {
  const status = String(responsePayload.status || '').toUpperCase();
  const acceptedStatuses = new Set(['AUTHORIZED', 'PENDING', 'TRANSMITTED', 'SUCCEEDED']);
  const decision = acceptedStatuses.has(status) ? 'ACCEPT' : (status || 'REJECT');
  const reasonCode = String(
    responsePayload?.processorInformation?.responseCode
      || responsePayload?.errorInformation?.reason
      || (decision === 'ACCEPT' ? '100' : '102')
  );
  return { decision, reasonCode, status };
};

const buildBillToFromMetadata = (transaction) => {
  const billing = transaction?.metadata?.billing || {};
  return {
    firstName: billing.firstName || 'Guest',
    lastName: billing.lastName || 'User',
    address1: billing.address1 || 'Amman',
    locality: billing.city || 'Amman',
    administrativeArea: billing.state || 'Amman',
    postalCode: billing.postalCode || '11118',
    country: billing.country || 'JO',
    email: billing.email || 'guest@example.com',
    phoneNumber: billing.phone || '0000000000'
  };
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

    if (!type) {
      return res.status(400).json({ error: 'type is required' });
    }

    const frontendOrigin = resolveFrontendOrigin(origin_url, req);
    if (!frontendOrigin) {
      return res.status(400).json({ error: 'Invalid or unauthorized frontend origin' });
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

    console.log('Creating checkout session:', { type, amount, metadata });

    let sessionId;
    let checkoutUrl;
    const currency = 'jod';

    if (effectiveProvider === PAYMENT_PROVIDERS.CAPITAL_BANK) {
      sessionId = `cb_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      metadata.frontend_origin = frontendOrigin;
      checkoutUrl = `/payment/capital-bank/${sessionId}`;
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



router.post('/capital-bank/initiate', authMiddleware, requireCsrfToken, ensureHttpsForCapitalBank, async (req, res) => {
  try {
    if (getEffectiveProvider() !== PAYMENT_PROVIDERS.CAPITAL_BANK) {
      return res.status(503).json({ error: 'Capital Bank payment gateway is not enabled' });
    }

    const { orderId, card = {}, transientToken } = req.body || {};
    if (!orderId) {
      return res.status(400).json({ error: 'orderId is required' });
    }

    const order = await resolveOrderTransaction(orderId, req.userId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const amount = toAmountString(order.amount);
    const payload = {
      clientReferenceInformation: { code: order.session_id },
      processingInformation: { capture: true },
      orderInformation: {
        amountDetails: {
          totalAmount: amount,
          currency: capitalBankConfig.currency
        },
        billTo: buildBillToFromMetadata(order)
      }
    };

    if (transientToken) {
      payload.tokenInformation = { transientToken };
    } else {
      const { number, expirationMonth, expirationYear, securityCode } = card;
      if (!number || !expirationMonth || !expirationYear || !securityCode) {
        return res.status(400).json({ error: 'Card data or transientToken is required' });
      }
      payload.paymentInformation = {
        card: {
          number: String(number).replace(/\s+/g, ''),
          expirationMonth: String(expirationMonth),
          expirationYear: String(expirationYear),
          securityCode: String(securityCode)
        }
      };
    }

    const paymentsUrl = new URL('/pts/v2/payments', capitalBankConfig.paymentEndpoint);
    const headers = buildCyberSourceAuthHeaders({
      method: 'POST',
      url: paymentsUrl.toString(),
      body: payload,
      merchantId: capitalBankConfig.merchantId,
      accessKey: capitalBankConfig.accessKey,
      secretKey: capitalBankConfig.secretKey
    });

    const response = await fetch(paymentsUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    const responseData = await response.json().catch(() => ({}));
    const { decision, reasonCode } = mapCyberSourceDecision(responseData);
    const transactionId = responseData.id || `${order.session_id}:${decision}`;
    const isAccepted = response.ok && decision === 'ACCEPT';

    const updated = await PaymentTransaction.findOneAndUpdate(
      {
        _id: order._id,
        $or: [
          { 'metadata.processed_transaction_ids': { $exists: false } },
          { 'metadata.processed_transaction_ids': { $ne: transactionId } }
        ]
      },
      {
        $set: {
          provider: PAYMENT_PROVIDERS.CAPITAL_BANK,
          currency: capitalBankConfig.currency.toLowerCase(),
          payment_id: responseData.id || null,
          status: isAccepted ? 'paid' : 'failed',
          payment_status: isAccepted ? 'paid' : 'failed',
          updated_at: new Date(),
          'metadata.cybersource_rest_last_response': responseData,
          'metadata.cybersource_rest_last_decision': decision,
          'metadata.cybersource_rest_last_reason_code': reasonCode
        },
        $addToSet: { 'metadata.processed_transaction_ids': transactionId }
      },
      { new: true }
    );

    if (!updated) {
      return res.status(200).json({ received: true, duplicate: true, sessionId: order.session_id });
    }

    return res.status(isAccepted ? 200 : 402).json({
      received: true,
      sessionId: order.session_id,
      transaction_id: responseData.id,
      decision,
      reason_code: reasonCode,
      status: updated.status,
      provider_response: responseData
    });
  } catch (error) {
    console.error('Capital Bank initiate error:', error?.message);
    return res.status(500).json({ error: 'Failed to initiate Capital Bank payment' });
  }
});

const processCapitalBankCallback = async (req, source) => {
  const payload = req.body || {};
  const callbackSignature = req.get('x-callback-signature') || req.get('x-capital-bank-signature');
  if (!verifyCapitalBankCallbackSignature(payload, callbackSignature)) {
    return { code: 400, body: { error: 'Invalid signature' } };
  }

  const sessionId = payload.req_reference_number || payload.reference_number || payload.session_id;
  if (!sessionId) {
    return { code: 400, body: { error: 'reference_number is required' } };
  }

  const decision = String(payload.decision || '').toUpperCase();
  const reasonCode = String(payload.reason_code || payload.reasonCode || '102');
  const transactionId = String(payload.transaction_id || payload.id || `${sessionId}:${decision || 'UNKNOWN'}`);
  const isAccepted = decision === 'ACCEPT' && reasonCode === '100';

  const updated = await PaymentTransaction.findOneAndUpdate(
    {
      session_id: sessionId,
      $or: [
        { 'metadata.processed_transaction_ids': { $exists: false } },
        { 'metadata.processed_transaction_ids': { $ne: transactionId } }
      ]
    },
    {
      $set: {
        status: isAccepted ? 'paid' : 'failed',
        payment_status: isAccepted ? 'paid' : 'failed',
        payment_id: payload.transaction_id || payload.id || null,
        updated_at: new Date(),
        'metadata.cybersource_rest_last_source': source,
        'metadata.cybersource_rest_last_response': payload
      },
      $addToSet: { 'metadata.processed_transaction_ids': transactionId }
    },
    { new: true }
  );

  if (!updated) {
    return { code: 200, body: { received: true, duplicate: true } };
  }

  return {
    code: 200,
    body: {
      received: true,
      sessionId,
      decision: decision || (isAccepted ? 'ACCEPT' : 'REJECT'),
      reason_code: reasonCode,
      status: updated.status
    }
  };
};

router.post('/capital-bank/return', ensureHttpsForCapitalBank, async (req, res) => {
  try {
    const result = await processCapitalBankCallback(req, 'return');
    return res.status(result.code).json(result.body);
  } catch (error) {
    console.error('Capital Bank return processing error:', error?.message);
    return res.status(500).json({ error: 'Failed to process return callback' });
  }
});

router.post('/capital-bank/notify', ensureHttpsForCapitalBank, async (req, res) => {
  try {
    const result = await processCapitalBankCallback(req, 'notify');
    return res.status(200).json({ ...result.body, received: true });
  } catch (error) {
    console.error('Capital Bank notify processing error:', error?.message);
    return res.status(200).json({ received: true });
  }
});

// Store transaction
router.post('/store-transaction', authMiddleware, async (req, res) => {
  try {
    const { session_id, user_id, amount, currency, type, reference_id, metadata } = req.body;

    const transaction = new PaymentTransaction({
      session_id,
      user_id: user_id || req.userId,
      amount,
      currency: currency || 'jod',
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
