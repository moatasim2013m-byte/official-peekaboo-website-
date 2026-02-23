const express = require('express');
const PaymentTransaction = require('../models/PaymentTransaction');
const Settings = require('../models/Settings');
const TimeSlot = require('../models/TimeSlot');
const Product = require('../models/Product');
const { authMiddleware } = require('../middleware/auth');
const loyaltyRouter = require('./loyalty');
const { awardPoints } = loyaltyRouter;
const { validateCoupon } = require('../utils/coupons');
const { buildRestHeaders, buildSigningString, getCyberSourcePaymentUrl } = require('../utils/cybersourceRest');
const router = express.Router();
const PAYMENT_PROVIDERS = {
  MANUAL: 'manual',
  CAPITAL_BANK: 'capital_bank_rest'
};
const requestedPaymentProvider = (process.env.PAYMENT_PROVIDER || PAYMENT_PROVIDERS.MANUAL).toLowerCase();
const supportedPaymentProviders = new Set(Object.values(PAYMENT_PROVIDERS));
const paymentProvider = supportedPaymentProviders.has(requestedPaymentProvider)
  ? requestedPaymentProvider
  : PAYMENT_PROVIDERS.MANUAL;
const DEV_ENVIRONMENTS = new Set(['development', 'dev', 'local', 'test']);
const DB_PROVIDER_CAPITAL_BANK = 'capital_bank';
const CYBERSOURCE_PAYMENTS_PATH = '/pts/v2/payments';
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
  secretKey: process.env.CAPITAL_BANK_SECRET_KEY
};
const requestedCapitalBankProvider = paymentProvider === PAYMENT_PROVIDERS.CAPITAL_BANK;
const missingCapitalBankEnvVars = [
  ['CAPITAL_BANK_MERCHANT_ID', capitalBankConfig.merchantId],
  ['CAPITAL_BANK_ACCESS_KEY', capitalBankConfig.accessKey],
  ['CAPITAL_BANK_SECRET_KEY', capitalBankConfig.secretKey]
].filter(([, value]) => !value).map(([name]) => name);
const capitalBankRestReady = requestedCapitalBankProvider && missingCapitalBankEnvVars.length === 0;
if (!supportedPaymentProviders.has(requestedPaymentProvider)) {
  console.warn(`[Payments] Unsupported PAYMENT_PROVIDER "${requestedPaymentProvider}". Falling back to ${PAYMENT_PROVIDERS.MANUAL}. Supported values: ${Object.values(PAYMENT_PROVIDERS).join(', ')}`);
}
if (requestedCapitalBankProvider) {
  if (capitalBankRestReady) {
    console.log(`[Payments] Active provider: ${paymentProvider} (CyberSource REST API)`);
    console.log(`[Payments] Capital Bank endpoint: ${getCyberSourcePaymentUrl()}`);
  } else {
    console.warn(`[Payments] Active provider fallback: manual. Missing env vars for ${paymentProvider}: ${missingCapitalBankEnvVars.join(', ')}`);
  }
} else {
  console.log(`[Payments] Active provider: ${PAYMENT_PROVIDERS.MANUAL}`);
}
const getEffectiveProvider = () => {
  if (capitalBankRestReady) return paymentProvider;
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
      provider: effectiveProvider === PAYMENT_PROVIDERS.CAPITAL_BANK ? DB_PROVIDER_CAPITAL_BANK : effectiveProvider,
      metadata
    });
    await transaction.save();
    console.log('Checkout session created:', sessionId, 'provider:', effectiveProvider);
    res.json({
      url: checkoutUrl,
      session_id: sessionId,
      payment_provider: effectiveProvider === PAYMENT_PROVIDERS.CAPITAL_BANK ? DB_PROVIDER_CAPITAL_BANK : effectiveProvider
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
        payment_provider: effectiveProvider === PAYMENT_PROVIDERS.CAPITAL_BANK ? DB_PROVIDER_CAPITAL_BANK : effectiveProvider
      });
    }
    return res.json({
      status: transaction.status,
      payment_status: transaction.payment_status || 'pending',
      payment_id: transaction.payment_id,
      metadata: transaction.metadata,
      payment_provider: effectiveProvider === PAYMENT_PROVIDERS.CAPITAL_BANK ? DB_PROVIDER_CAPITAL_BANK : effectiveProvider
    });
  } catch (error) {
    console.error('Get checkout status error:', error);
    res.status(500).json({ error: 'Failed to get checkout status' });
  }
});
const sanitizeReason = (reason = 'payment_failed') => String(reason).replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, 80) || 'payment_failed';
const TEST_BILLING_DEFAULTS = {
  firstName: 'Test',
  lastName: 'User',
  address1: '1 Test Street',
  locality: 'Amman',
  administrativeArea: 'AM',
  postalCode: '11111',
  country: 'JO',
  email: 'test@test.com',
  phoneNumber: '0791234567'
};
const REQUIRED_BILL_TO_FIELDS = [
  'firstName',
  'lastName',
  'address1',
  'locality',
  'administrativeArea',
  'postalCode',
  'country',
  'email',
  'phoneNumber'
];
const mapDecisionToStatus = (decision = '') => {
  const normalized = String(decision || '').toUpperCase();
  if (normalized === 'ACCEPT') {
    return { status: 'paid', paymentStatus: 'paid' };
  }
  if (normalized === 'REVIEW' || normalized === 'PENDING') {
    return { status: 'pending', paymentStatus: 'pending' };
  }
  return { status: 'failed', paymentStatus: normalized ? normalized.toLowerCase() : 'failed' };
};
const getBillingDataFromUser = (transaction) => {
  const isTestEnvironment = process.env.NODE_ENV === 'test';
  const user = transaction?.metadata?.billing_user || {};
  const fullName = String(user.name || user.full_name || 'Guest User').trim();
  const nameParts = fullName.split(/\s+/).filter(Boolean);
  const firstName = nameParts[0] || 'Guest';
  const lastName = nameParts.slice(1).join(' ') || 'User';

  const billingData = isTestEnvironment ? { ...TEST_BILLING_DEFAULTS } : {
    firstName,
    lastName,
    address1: String(user.address1 || 'Amman').slice(0, 60),
    locality: String(user.locality || 'Amman').slice(0, 50),
    administrativeArea: String(user.administrativeArea || 'Amman').slice(0, 50),
    postalCode: String(user.postalCode || '11118').slice(0, 10),
    country: 'JO',
    email: String(user.email || 'payments@peekaboo.local').slice(0, 100),
    phoneNumber: String(user.phoneNumber || user.phone || '962790000000').slice(0, 20)
  };

  return REQUIRED_BILL_TO_FIELDS.reduce((acc, field) => {
    const value = String(billingData[field] || '').trim();
    acc[field] = value || TEST_BILLING_DEFAULTS[field];
    return acc;
  }, {});
};
const normalizeExpirationYear = (value) => {
  const digits = String(value || '').replace(/\D/g, '');
  if (digits.length === 4) return digits;
  if (digits.length === 2) return `20${digits}`;
  if (digits.length > 4) return digits.slice(-4);
  return digits.padStart(4, '0');
};
const normalizeCardType = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === '001' || normalized === 'visa' || normalized === 'v') return '001';
  if (normalized === '002' || normalized === 'mastercard' || normalized === 'master card' || normalized === 'mc' || normalized === 'm') return '002';
  return String(value || '').trim();
};
const buildCyberSourcePaymentPayload = ({ orderId, amount, billTo, card }) => ({
  clientReferenceInformation: { code: orderId },
  processingInformation: { capture: true },
  orderInformation: {
    amountDetails: {
      totalAmount: Number(amount).toFixed(2),
      currency: 'JOD'
    },
    billTo
  },
  paymentInformation: {
    card: {
      number: card.number,
      expirationMonth: card.expirationMonth,
      expirationYear: card.expirationYear,
      securityCode: card.securityCode,
      type: card.type
    }
  }
});
const isCyberSourceNotifyRequest = (req) => {
  const merchantHeader = String(req.get('v-c-merchant-id') || '').trim();
  const signature = String(req.get('signature') || '').trim();
  const digest = String(req.get('digest') || '').trim();
  return merchantHeader === String(capitalBankConfig.merchantId || '') && Boolean(signature) && Boolean(digest);
};
router.post('/capital-bank/initiate', authMiddleware, ensureHttpsForCapitalBank, async (req, res) => {
  let cardData = null;
  try {
    const activeProvider = getEffectiveProvider();
    if (activeProvider !== PAYMENT_PROVIDERS.CAPITAL_BANK) {
      return res.status(503).json({ error: 'Capital Bank REST payment gateway is not enabled', missing_env_vars: missingCapitalBankEnvVars });
    }

    const { orderId, cardNumber, expiryMonth, expiryYear, cvn, cardType } = req.body || {};
    if (!orderId || !cardNumber || !expiryMonth || !expiryYear || !cvn || !cardType) {
      return res.status(400).json({ error: 'orderId and card details are required' });
    }

    const transaction = await resolveOrderTransaction(orderId, req.userId);
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const amount = Number(transaction.amount || 0);
    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ error: 'Invalid transaction amount' });
    }

    cardData = {
      number: String(cardNumber).replace(/\s+/g, ''),
      expirationMonth: String(String(expiryMonth).padStart(2, '0').slice(-2)),
      expirationYear: String(normalizeExpirationYear(expiryYear)),
      securityCode: String(cvn),
      type: normalizeCardType(cardType)
    };

    if (!['001', '002'].includes(cardData.type)) {
      return res.status(400).json({ error: 'Unsupported card type. Use 001 for Visa or 002 for Mastercard.' });
    }

    if (!/^\d{2}$/.test(cardData.expirationMonth)) {
      return res.status(400).json({ error: 'expiryMonth must be a 2-digit string (MM).' });
    }
    if (!/^\d{4}$/.test(cardData.expirationYear)) {
      return res.status(400).json({ error: 'expiryYear must be a 4-digit string (YYYY).' });
    }

    const payload = buildCyberSourcePaymentPayload({
      orderId: transaction.session_id,
      amount,
      billTo: { ...TEST_BILLING_DEFAULTS },
      card: cardData
    });

    const endpointPath = CYBERSOURCE_PAYMENTS_PATH;
    const requestBody = JSON.stringify(payload);
    const merchantIdRaw = process.env.CAPITAL_BANK_MERCHANT_ID;
    const merchantIdTrimmed = String(merchantIdRaw || '').trim();
    if (merchantIdTrimmed !== '903897720102') {
      console.error('[CAPITAL BANK DEBUG] CAPITAL_BANK_MERCHANT_ID mismatch:', JSON.stringify({
        configured: merchantIdRaw,
        trimmed: merchantIdTrimmed,
        expected: '903897720102'
      }, null, 2));
    }
    const headers = buildRestHeaders(
      capitalBankConfig.merchantId,
      capitalBankConfig.accessKey,
      capitalBankConfig.secretKey,
      endpointPath,
      requestBody
    );

    const signingString = buildSigningString({
      host: headers.Host,
      date: headers.Date,
      'request-target': `post ${endpointPath}`,
      'v-c-merchant-id': capitalBankConfig.merchantId,
      digest: headers.Digest
    });

    console.log('[CAPITAL BANK DEBUG] HTTP signature signing string:', signingString);
    console.log('[CAPITAL BANK DEBUG] Sending to CyberSource:', JSON.stringify({
      merchantId: process.env.CAPITAL_BANK_MERCHANT_ID,
      endpoint: getCyberSourcePaymentUrl(),
      amount: payload.orderInformation?.amountDetails?.totalAmount,
      currency: payload.orderInformation?.amountDetails?.currency,
      cardType: payload.paymentInformation?.card?.type,
      expirationMonth: payload.paymentInformation?.card?.expirationMonth,
      expirationYear: payload.paymentInformation?.card?.expirationYear
    }, null, 2));

    const paymentUrl = getCyberSourcePaymentUrl();
    console.log('[CAPITAL BANK DEBUG] CyberSource resolved payment URL:', paymentUrl);

    const response = await fetch(paymentUrl, {
      method: 'POST',
      headers,
      body: requestBody
    });

    const rawResponseBody = await response.text();
    let responseBody = {};
    try {
      responseBody = rawResponseBody ? JSON.parse(rawResponseBody) : {};
    } catch (_error) {
      responseBody = { rawResponseBody };
    }

    console.error('[CAPITAL BANK DEBUG] CyberSource full response:', JSON.stringify({
      status: response.status,
      body: responseBody
    }, null, 2));

    if (response.status !== 201) {
      console.error('Capital Bank initiate non-201 response body:', {
        status: response.status,
        statusText: response.statusText,
        body: responseBody,
        rawResponseBody
      });
    }
    const decision = String(responseBody?.status || responseBody?.processorInformation?.responseCode || '').toUpperCase();
    const transactionId = String(responseBody?.id || responseBody?.reconciliationId || '');

    if (response.status === 201 && decision !== 'DECLINE') {
      await PaymentTransaction.findByIdAndUpdate(transaction._id, {
        $set: {
          status: 'paid',
          payment_status: 'paid',
          payment_id: transactionId || null,
          updated_at: new Date(),
          provider: DB_PROVIDER_CAPITAL_BANK
        }
      });

      return res.status(200).json({ success: true, orderId: transaction.session_id });
    }

    const reason = sanitizeReason(responseBody?.errorInformation?.message || responseBody?.message || 'payment_declined');
    console.log('Capital Bank/CyberSource payment failure response body:', {
      status: response.status,
      statusText: response.statusText,
      body: responseBody,
      rawResponseBody
    });
    await PaymentTransaction.findByIdAndUpdate(transaction._id, {
      $set: {
        status: 'failed',
        payment_status: 'failed',
        updated_at: new Date(),
        error_message: reason,
        provider: DB_PROVIDER_CAPITAL_BANK
      }
    });

    if (response.status === 400 || decision === 'DECLINE') {
      return res.status(402).json({ success: false, reason });
    }

    return res.status(500).json({ error: 'Payment processing failed' });
  } catch (error) {
    console.error('Capital Bank initiate error:', error?.message);
    return res.status(500).json({ error: 'Failed to process payment' });
  } finally {
    cardData = null;
  }
});
const capitalBankCallbackParser = express.urlencoded({ extended: false });
const processCapitalBankCallback = async (req, res, source = 'notify') => {
  const callbackPayload = { ...(req.query || {}), ...(req.body || {}) };
  const sessionId = String(callbackPayload?.clientReferenceInformation?.code || callbackPayload?.orderInformation?.invoiceNumber || callbackPayload?.reference_number || callbackPayload?.orderId || '').trim();
  const decision = String(callbackPayload?.decision || callbackPayload?.status || '').toUpperCase();
  const transactionId = String(callbackPayload?.id || callbackPayload?.transaction_id || callbackPayload?.reconciliationId || '').trim();
  const mapped = mapDecisionToStatus(decision);

  if (!sessionId) {
    if (source === 'notify') return res.status(200).json({ received: true, ignored: true });
    return res.redirect(303, '/payment/failed?reason=missing_session_id');
  }

  const updatePayload = {
    $set: {
      status: mapped.status,
      payment_status: mapped.paymentStatus,
      updated_at: new Date(),
      provider: DB_PROVIDER_CAPITAL_BANK,
      ...(transactionId ? { payment_id: transactionId } : {})
    }
  };

  if (transactionId) {
    updatePayload.$addToSet = { 'metadata.processed_transaction_ids': transactionId };
  }

  const query = transactionId
    ? { session_id: sessionId, 'metadata.processed_transaction_ids': { $ne: transactionId } }
    : { session_id: sessionId };

  const updated = await PaymentTransaction.findOneAndUpdate(query, updatePayload, { new: true });
  const transaction = updated || await PaymentTransaction.findOne({ session_id: sessionId });

  if (!transaction) {
    if (source === 'notify') return res.status(200).json({ received: true, ignored: true });
    return res.redirect(303, '/payment/failed?reason=transaction_not_found');
  }

  if (mapped.status === 'paid' && transaction.type === 'product') {
    await maybeAwardProductLoyaltyPoints(transaction);
  }

  if (source === 'notify') {
    return res.status(200).json({
      received: true,
      duplicate: Boolean(transactionId) && !updated,
      sessionId,
      decision,
      status: transaction.status
    });
  }

  if (transaction.status === 'paid') {
    return res.redirect(303, `/payment/success?orderId=${encodeURIComponent(sessionId)}`);
  }
  if (transaction.status === 'pending') {
    return res.redirect(303, `/payment/pending?orderId=${encodeURIComponent(sessionId)}`);
  }

  const reason = sanitizeReason(decision || 'payment_failed');
  return res.redirect(303, `/payment/failed?orderId=${encodeURIComponent(sessionId)}&reason=${encodeURIComponent(reason)}`);
};

router.post('/capital-bank/notify', ensureHttpsForCapitalBank, async (req, res) => {
  if (!isCyberSourceNotifyRequest(req)) {
    console.error('[SECURITY] Rejected Capital Bank notify request: invalid signature headers');
    return res.status(200).json({ received: true, ignored: true });
  }

  try {
    return await processCapitalBankCallback(req, res, 'notify');
  } catch (error) {
    console.error('Capital Bank notify processing error:', error?.message);
    return res.status(200).json({ received: true, error: true });
  }
});

router.post('/capital-bank/return', capitalBankCallbackParser, ensureHttpsForCapitalBank, async (req, res) => {
  try {
    return await processCapitalBankCallback(req, res, 'return');
  } catch (error) {
    console.error('Capital Bank return processing error:', error?.message);
    return res.redirect(303, '/payment/failed?reason=callback_processing_error');
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
