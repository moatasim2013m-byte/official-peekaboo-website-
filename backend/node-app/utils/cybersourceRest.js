const crypto = require('crypto');

const CYBERSOURCE_SECURE_ACCEPTANCE_TEST_URL = 'https://testsecureacceptance.cybersource.com';
const CYBERSOURCE_SECURE_ACCEPTANCE_LIVE_URL = 'https://secureacceptance.cybersource.com';
const SECURE_ACCEPTANCE_PAY_PATH = '/pay';
const SECURE_ACCEPTANCE_RESPONSE_SIGNED_FIELDS = 'signed_field_names,signature';

const normalizeUrl = (value) => {
  if (!value || typeof value !== 'string') return null;
  try {
    const parsed = new URL(value.trim());
    if (!['http:', 'https:'].includes(parsed.protocol)) return null;
    return parsed.origin;
  } catch (_error) {
    return null;
  }
};

const getCyberSourceBaseUrl = () => {
  const configured = normalizeUrl(
    process.env.CAPITAL_BANK_PAYMENT_ENDPOINT
    || process.env.CAPITAL_BANK_ENDPOINT
  );
  if (configured) return configured;

  const environment = String(process.env.NODE_ENV || '').toLowerCase();
  if (environment === 'production') return CYBERSOURCE_SECURE_ACCEPTANCE_LIVE_URL;

  return CYBERSOURCE_SECURE_ACCEPTANCE_TEST_URL;
};

const getCyberSourcePaymentUrl = () => `${getCyberSourceBaseUrl()}${SECURE_ACCEPTANCE_PAY_PATH}`;

const toCyberSourceIsoDate = (date = new Date()) => (
  new Date(date).toISOString().replace(/\.\d{3}Z$/, 'Z')
);

const generateTransactionUuid = () => {
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
};

const isLikelyBase64 = (value) => {
  const normalized = String(value || '').trim();
  if (!normalized || normalized.length % 4 !== 0) return false;
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(normalized)) return false;
  if (/^[0-9a-fA-F]+$/.test(normalized)) return false;
  return true;
};

const getSecretKeyEncoding = () => String(
  process.env.CAPITAL_BANK_SECRET_KEY_ENCODING
  || process.env.CAPITAL_BANK_SECRET_KEY_ENCODE
  || 'auto'
).trim().toLowerCase();

const decodeBase64Key = (value) => Buffer.from(value, 'base64');
const decodeHexKey = (value) => Buffer.from(value, 'hex');
const decodeUtf8Key = (value) => Buffer.from(value, 'utf8');

const isBase64WithStrongSignal = (value) => {
  const normalized = String(value || '').trim();
  if (!isLikelyBase64(normalized)) return false;
  return /[+/=]/.test(normalized);
};

const decodeSecretKey = (secretKey) => {
  const normalizedSecretKey = String(secretKey || '').trim();
  if (!normalizedSecretKey) {
    throw new Error('CAPITAL_BANK_SECRET_KEY is required');
  }

  const requestedEncoding = getSecretKeyEncoding();

  if (requestedEncoding === 'hex') return decodeHexKey(normalizedSecretKey);
  if (requestedEncoding === 'base64') return decodeBase64Key(normalizedSecretKey);
  if (requestedEncoding === 'utf8' || requestedEncoding === 'plain' || requestedEncoding === 'text') return decodeUtf8Key(normalizedSecretKey);

  if (requestedEncoding !== 'auto') {
    throw new Error('CAPITAL_BANK_SECRET_KEY_ENCODING must be one of: auto, base64, hex, utf8');
  }

  // Auto-detect: hex is most common for Secure Acceptance
  const isHexKey = /^[0-9a-fA-F]+$/.test(normalizedSecretKey) && normalizedSecretKey.length % 2 === 0;
  if (isHexKey) return decodeHexKey(normalizedSecretKey);
  if (isBase64WithStrongSignal(normalizedSecretKey)) return decodeBase64Key(normalizedSecretKey);
  return decodeUtf8Key(normalizedSecretKey);
};

const signFields = (fieldValues, secretKey) => {
  const signedFieldNames = String(fieldValues?.signed_field_names || '')
    .split(',')
    .map((fieldName) => fieldName.trim())
    .filter(Boolean);

  if (!signedFieldNames.length) {
    throw new Error('signed_field_names is required for Secure Acceptance signatures');
  }

  const dataToSign = signedFieldNames
    .map((fieldName) => `${fieldName}=${fieldValues[fieldName] ?? ''}`)
    .join(',');

  const decodedSecretKey = decodeSecretKey(secretKey);
  const signature = crypto
    .createHmac('sha256', decodedSecretKey)
    .update(dataToSign, 'utf8')
    .digest('base64');

  return {
    signature,
    dataToSign,
    signedFieldNames
  };
};

const buildSecureAcceptanceFields = ({
  profileId,
  accessKey,
  secretKey,
  transactionUuid,
  referenceNumber,
  amount,
  locale = 'en-us',
  transactionType = 'sale',
  currency = 'JOD',
  billToForename = 'Customer',
  billToSurname = 'Customer',
  billToEmail = 'customer@example.com',
  billToAddressLine1 = 'Amman',
  billToAddressCity = 'Amman',
  billToAddressCountry = 'JO',
  overrideCustomReceiptPage,
  overrideCustomCancelPage,
  unsignedFieldNames = ''
}) => {
  if (!profileId) throw new Error('CAPITAL_BANK_PROFILE_ID is required');
  if (!accessKey) throw new Error('CAPITAL_BANK_ACCESS_KEY is required');
  if (!secretKey) throw new Error('CAPITAL_BANK_SECRET_KEY is required');

  const normalizedAmount = Number(amount);
  if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
    throw new Error('Payment amount must be a positive number');
  }

  const signedFieldNames = [
    'access_key',
    'profile_id',
    'transaction_uuid',
    'signed_field_names',
    'unsigned_field_names',
    'signed_date_time',
    'locale',
    'transaction_type',
    'reference_number',
    'amount',
    'currency',
    'payment_method',
    'bill_to_forename',
    'bill_to_surname',
    'bill_to_email',
    'bill_to_address_line1',
    'bill_to_address_city',
    'bill_to_address_country'
  ].join(',');

  const unsignedFields = [
    ...String(unsignedFieldNames || '').split(',').map((fieldName) => fieldName.trim()).filter(Boolean),
    ...(overrideCustomReceiptPage ? ['override_custom_receipt_page'] : []),
    ...(overrideCustomCancelPage ? ['override_custom_cancel_page'] : [])
  ];

  const fields = {
    access_key: String(accessKey),
    profile_id: String(profileId),
    transaction_uuid: String(transactionUuid),
    signed_field_names: signedFieldNames,
    unsigned_field_names: unsignedFields.join(','),
    signed_date_time: toCyberSourceIsoDate(),
    locale: String(locale || 'en-us').toLowerCase(),
    transaction_type: String(transactionType || 'sale').toLowerCase(),
    reference_number: String(referenceNumber),
    amount: normalizedAmount.toFixed(2),
    currency: String(currency || 'JOD').toUpperCase(),
    payment_method: 'card',
    bill_to_forename: String(billToForename || 'Customer'),
    bill_to_surname: String(billToSurname || 'Customer'),
    bill_to_email: String(billToEmail || 'customer@example.com'),
    bill_to_address_line1: String(billToAddressLine1 || 'Amman'),
    bill_to_address_city: String(billToAddressCity || 'Amman'),
    bill_to_address_country: String(billToAddressCountry || 'JO').toUpperCase(),
    ...(overrideCustomReceiptPage ? { override_custom_receipt_page: String(overrideCustomReceiptPage) } : {}),
    ...(overrideCustomCancelPage ? { override_custom_cancel_page: String(overrideCustomCancelPage) } : {})
  };

  const { signature, dataToSign, signedFieldNames: parsedSignedFields } = signFields(fields, secretKey);
  fields.signature = signature;

  console.info('[CyberSource Secure Acceptance] Signed request fields generated', {
    reference_number: fields.reference_number,
    transaction_uuid: fields.transaction_uuid,
    signed_field_count: parsedSignedFields.length,
    signed_fields: parsedSignedFields,
    signed_date_time: fields.signed_date_time,
    data_to_sign_preview: dataToSign.slice(0, 200)
  });

  return fields;
};

const verifySecureAcceptanceSignature = (payload, secretKey) => {
  if (!payload || typeof payload !== 'object') {
    return { isValid: false, reason: 'invalid_payload' };
  }

  const providedSignature = String(payload.signature || '').trim();
  const signedFieldNames = String(payload.signed_field_names || '').trim();
  if (!providedSignature || !signedFieldNames) {
    return { isValid: false, reason: 'missing_signature_fields' };
  }

  const { signature: computedSignature, dataToSign, signedFieldNames: parsedSignedFields } = signFields(payload, secretKey);
  const providedBuffer = Buffer.from(providedSignature, 'utf8');
  const computedBuffer = Buffer.from(computedSignature, 'utf8');
  const isValid = providedBuffer.length === computedBuffer.length
    && crypto.timingSafeEqual(providedBuffer, computedBuffer);

  return {
    isValid,
    reason: isValid ? null : 'signature_mismatch',
    computedSignature,
    providedSignature,
    dataToSign,
    signedFieldNames: parsedSignedFields
  };
};

module.exports = {
  CYBERSOURCE_SECURE_ACCEPTANCE_TEST_URL,
  CYBERSOURCE_SECURE_ACCEPTANCE_LIVE_URL,
  SECURE_ACCEPTANCE_RESPONSE_SIGNED_FIELDS,
  buildSecureAcceptanceFields,
  getCyberSourceBaseUrl,
  getCyberSourcePaymentUrl,
  generateTransactionUuid,
  signFields,
  toCyberSourceIsoDate,
  verifySecureAcceptanceSignature
};
