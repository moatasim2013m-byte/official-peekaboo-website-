const express = require('express');
const crypto = require('crypto');
const PaymentTransaction = require('../models/PaymentTransaction');
const Settings = require('../models/Settings');
const TimeSlot = require('../models/TimeSlot');
const Product = require('../models/Product');
const { authMiddleware } = require('../middleware/auth');
const loyaltyRouter = require('./loyalty');
const { awardPoints } = loyaltyRouter;
const { validateCoupon } = require('../utils/coupons');

const router = express.Router();

const PAYMENT_PROVIDERS = {
  MANUAL: 'manual',
  CAPITAL_BANK: 'capital_bank'
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
  accessKey: process.env.CAPITAL_BANK_ACCESS_KEY || process.env.CYBERSOURCE_ACCESS_KEY,
  profileId: process.env.CAPITAL_BANK_PROFILE_ID || process.env.CYBERSOURCE_PROFILE_ID,
  secretKey: process.env.CAPITAL_BANK_SECRET_KEY || process.env.CYBERSOURCE_SECRET_KEY,
  transactionType: process.env.CAPITAL_BANK_TRANSACTION_TYPE || 'sale',
  locale: process.env.CAPITAL_BANK_LOCALE || 'ar',
  paymentEndpoint:
    process.env.CAPITAL_BANK_PAYMENT_ENDPOINT
    || 'https://testsecureacceptance.cybersource.com/pay'
};

const capitalBankHostedReady = Boolean(
  paymentProvider === PAYMENT_PROVIDERS.CAPITAL_BANK
  && capitalBankConfig.accessKey
  && capitalBankConfig.profileId
  && capitalBankConfig.secretKey
);

if (paymentProvider === PAYMENT_PROVIDERS.CAPITAL_BANK) {
  if (capitalBankHostedReady) {
    console.log('[Payments] Capital Bank Secure Acceptance TEST mode active');
  } else {
    console.warn('[Payments] Capital Bank selected but required hosted checkout env vars are missing. Falling back to manual mode.');
  }
}

const getEffectiveProvider = () => {
  if (paymentProvider === PAYMENT_PROVIDERS.CAPITAL_BANK && capitalBankHostedReady) return PAYMENT_PROVIDERS.CAPITAL_BANK;
  return PAYMENT_PROVIDERS.MANUAL;
};

const cybersourceUrlencodedParser = express.urlencoded({ extended: false });

const getRequestBaseUrl = (req) => {
  const forwardedProto = (req.headers['x-forwarded-proto'] || '').split(',')[0].trim();
  const forwardedHost = (req.headers['x-forwarded-host'] || '').split(',')[0].trim();
  const protocol = forwardedProto || req.protocol;
  const host = forwardedHost || req.get('host');
  return `${protocol}://${host}`;
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

const signCybersourceFields = (fields, signedFieldNames, secretKey) => {
  const dataToSign = signedFieldNames
    .map((fieldName) => `${fieldName}=${fields[fieldName] ?? ''}`)
    .join(',');

  return crypto
    .createHmac('sha256', secretKey)
    .update(dataToSign, 'utf8')
    .digest('base64');
};

const buildSignedCybersourceRequest = ({ sessionId, amount, currency, backendBaseUrl, customerReference }) => {
  const signedDateTime = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
  const signedFieldNames = [
    'access_key',
    'profile_id',
    'transaction_uuid',
    'signed_date_time',
    'signed_field_names',
    'reference_number',
    'transaction_type',
    'amount',
    'currency',
    'locale'
  ];

  const fields = {
    access_key: capitalBankConfig.accessKey,
    profile_id: capitalBankConfig.profileId,
    transaction_uuid: crypto.randomUUID(),
    signed_date_time: signedDateTime,
    signed_field_names: signedFieldNames.join(','),
    unsigned_field_names: 'customer_ip_address,customer_reference,override_custom_receipt_page,override_custom_cancel_page',
    reference_number: sessionId,
    transaction_type: capitalBankConfig.transactionType,
    amount: Number(amount).toFixed(2),
    currency: currency.toUpperCase(),
    locale: capitalBankConfig.locale,
    customer_ip_address: '',
    customer_reference: customerReference,
    override_custom_receipt_page: `${backendBaseUrl}/api/payments/capital-bank/secure-acceptance/response`,
    override_custom_cancel_page: `${backendBaseUrl}/api/payments/capital-bank/secure-acceptance/cancel`
  };

  fields.signature = signCybersourceFields(fields, signedFieldNames, capitalBankConfig.secretKey);
  return fields;
};

const normalizeSignedPayload = (payload = {}) => {
  const signedFieldNames = (payload.signed_field_names || '')
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean);

  const signedFieldsOnly = signedFieldNames.reduce((acc, fieldName) => {
    acc[fieldName] = payload[fieldName] ?? '';
    return acc;
  }, {});

  return { signedFieldNames, signedFieldsOnly };
};

const isValidCybersourceSignature = (payload = {}) => {
  if (!payload.signature || !payload.signed_field_names || !capitalBankConfig.secretKey) {
    return false;
  }

  const { signedFieldNames, signedFieldsOnly } = normalizeSignedPayload(payload);
  const expectedSignature = signCybersourceFields(signedFieldsOnly, signedFieldNames, capitalBankConfig.secretKey);
  const expectedBuffer = Buffer.from(expectedSignature);
  const receivedBuffer = Buffer.from(payload.signature);
  if (expectedBuffer.length !== receivedBuffer.length) return false;
  return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
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
      metadata.cybersource = buildSignedCybersourceRequest({
        sessionId,
        amount,
        currency,
        backendBaseUrl: getRequestBaseUrl(req),
        customerReference: req.userId.toString()
      });

      checkoutUrl = `/api/payments/capital-bank/secure-acceptance/form/${sessionId}`;
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

// Server-side checkout form builder for CyberSource Secure Acceptance Hosted Checkout
router.get('/capital-bank/secure-acceptance/form/:sessionId', async (req, res) => {
  try {
    if (getEffectiveProvider() !== PAYMENT_PROVIDERS.CAPITAL_BANK) {
      return res.status(404).send('Capital Bank payment gateway is not enabled');
    }

    const transaction = await PaymentTransaction.findOne({ session_id: req.params.sessionId });
    if (!transaction || transaction.provider !== PAYMENT_PROVIDERS.CAPITAL_BANK) {
      return res.status(404).send('Transaction not found');
    }

    const fields = transaction.metadata?.cybersource;
    if (!fields?.signature) {
      return res.status(400).send('Signed checkout payload is missing');
    }

    const hiddenInputs = Object.entries(fields)
      .map(([name, value]) => `<input type="hidden" name="${name}" value="${String(value).replace(/"/g, '&quot;')}" />`)
      .join('\n');

    res.set('X-Frame-Options', 'DENY');
    res.set('Content-Security-Policy', "frame-ancestors 'none'");

    return res.status(200).send(`<!doctype html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>جاري تحويلك للدفع</title>
</head>
<body>
  <p>جاري تحويلك إلى بوابة الدفع الآمنة...</p>
  <form id="cybersource-hosted-checkout" method="post" action="${capitalBankConfig.paymentEndpoint}">
    ${hiddenInputs}
    <noscript><button type="submit">متابعة الدفع</button></noscript>
  </form>
  <script>document.getElementById('cybersource-hosted-checkout').submit();</script>
</body>
</html>`);
  } catch (error) {
    console.error('Capital Bank checkout form error:', error);
    return res.status(500).send('Failed to build checkout form');
  }
});

const processCybersourceResponse = async (req, res, source = 'browser_return') => {
  const payload = req.body || {};

  if (!payload.signed_field_names || !payload.signature) {
    return res.status(400).json({ error: 'Missing signed CyberSource response fields' });
  }

  if (!isValidCybersourceSignature(payload)) {
    return res.status(401).json({ error: 'Invalid CyberSource response signature' });
  }

  const { signedFieldsOnly } = normalizeSignedPayload(payload);
  const referenceNumber = signedFieldsOnly.req_reference_number || signedFieldsOnly.reference_number;
  if (!referenceNumber) {
    return res.status(400).json({ error: 'reference_number is required' });
  }

  const transaction = await PaymentTransaction.findOne({ session_id: referenceNumber });
  if (!transaction) {
    return res.status(404).json({ error: 'Transaction not found' });
  }

  const decision = (signedFieldsOnly.decision || '').toLowerCase();
  const paymentStatus = (signedFieldsOnly.payment_status || '').toLowerCase();
  const paidDecisions = new Set(['accept', 'authorized', 'authorized_pending_review']);
  const failedDecisions = new Set(['reject', 'decline', 'error', 'cancel']);

  if (source === 'browser_cancel') {
    transaction.status = 'failed';
    transaction.payment_status = 'cancel';
  } else if (paidDecisions.has(decision) || paymentStatus === 'paid') {
    transaction.status = 'paid';
    transaction.payment_status = 'paid';
    transaction.payment_id = signedFieldsOnly.transaction_id || transaction.payment_id;
  } else if (failedDecisions.has(decision)) {
    transaction.status = 'failed';
    transaction.payment_status = paymentStatus || decision;
  } else {
    transaction.payment_status = paymentStatus || decision || transaction.payment_status || 'pending';
  }

  transaction.metadata = {
    ...transaction.metadata,
    cybersource_response_source: source,
    cybersource_response: signedFieldsOnly
  };
  transaction.updated_at = new Date();
  await transaction.save();

  if (transaction.status === 'paid' && transaction.type === 'product') {
    await maybeAwardProductLoyaltyPoints(transaction);
  }

  if (source === 'browser_return' || source === 'browser_cancel') {
    const pathName = transaction.status === 'paid' ? '/payment/success' : '/payment/cancel';
    const redirectUrl = buildFrontendRedirectUrl(transaction.metadata?.frontend_origin, pathName, referenceNumber);
    if (redirectUrl) {
      return res.redirect(303, redirectUrl);
    }
  }

  return res.json({
    received: true,
    session_id: referenceNumber,
    status: transaction.status,
    payment_status: transaction.payment_status
  });
};

// Merchant POST URL (browser return endpoint)
router.post('/capital-bank/secure-acceptance/response', cybersourceUrlencodedParser, async (req, res) => {
  try {
    return await processCybersourceResponse(req, res, 'browser_return');
  } catch (error) {
    console.error('Capital Bank response endpoint error:', error);
    return res.status(500).json({ error: 'Failed to process payment response' });
  }
});


router.post('/capital-bank/secure-acceptance/cancel', cybersourceUrlencodedParser, async (req, res) => {
  try {
    return await processCybersourceResponse(req, res, 'browser_cancel');
  } catch (error) {
    console.error('Capital Bank cancel endpoint error:', error);
    return res.status(500).json({ error: 'Failed to process cancel response' });
  }
});

// Merchant POST URL backup notification receiver
router.post('/capital-bank/secure-acceptance/notify', cybersourceUrlencodedParser, async (req, res) => {
  try {
    return await processCybersourceResponse(req, res, 'backend_notification');
  } catch (error) {
    console.error('Capital Bank notification endpoint error:', error);
    return res.status(500).json({ error: 'Failed to process notification' });
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
