const crypto = require('crypto');

// Secure Acceptance endpoints
const CYBERSOURCE_SECURE_ACCEPTANCE_TEST_URL = 'https://testsecureacceptance.cybersource.com';
const CYBERSOURCE_SECURE_ACCEPTANCE_LIVE_URL = 'https://secureacceptance.cybersource.com';

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

const getCyberSourceBaseUrl = () => (
  normalizeUrl(process.env.CAPITAL_BANK_PAYMENT_ENDPOINT)
  || CYBERSOURCE_SECURE_ACCEPTANCE_TEST_URL
);

const getCyberSourcePaymentUrl = () => `${getCyberSourceBaseUrl()}/pay`;

/**
 * Build Secure Acceptance signature for form fields
 * @param {Object} params - Form parameters to sign
 * @param {string} secretKey - Secret key (hex or utf8)
 * @returns {string} Base64 encoded signature
 */
const buildSecureAcceptanceSignature = (params, secretKey) => {
  if (!secretKey) {
    throw new Error('CAPITAL_BANK_SECRET_KEY is required');
  }

  // Get signed field names from params
  const signedFieldNames = params.signed_field_names;
  if (!signedFieldNames) {
    throw new Error('signed_field_names is required');
  }

  // Build data to sign: field1=value1,field2=value2,...
  const fieldNames = signedFieldNames.split(',');
  const dataToSign = fieldNames
    .map(fieldName => {
      const value = params[fieldName] !== undefined ? params[fieldName] : '';
      return `${fieldName}=${value}`;
    })
    .join(',');

  console.log('[Secure Acceptance] Signing string:', dataToSign);

  // Decode secret key based on encoding
  const decodedSecretKey = decodeSecretKey(secretKey);

  // Sign with HMAC-SHA256
  const signature = crypto
    .createHmac('sha256', decodedSecretKey)
    .update(dataToSign, 'utf8')
    .digest('base64');

  console.log('[Secure Acceptance] Signature generated (first 20 chars):', signature.substring(0, 20) + '...');

  return signature;
};

/**
 * Verify Secure Acceptance signature from callback
 */
const verifySecureAcceptanceSignature = (params, secretKey) => {
  if (!params.signature || !params.signed_field_names) {
    return false;
  }

  const receivedSignature = params.signature;
  const expectedSignature = buildSecureAcceptanceSignature(params, secretKey);

  return receivedSignature === expectedSignature;
};

/**
 * Decode secret key based on encoding setting or auto-detect
 */
const getSecretKeyEncoding = () => String(process.env.CAPITAL_BANK_SECRET_KEY_ENCODING || 'auto').trim().toLowerCase();

const decodeBase64Key = (value) => Buffer.from(value, 'base64');

const decodeHexKey = (value) => Buffer.from(value, 'hex');

const decodeUtf8Key = (value) => Buffer.from(value, 'utf8');

const isLikelyBase64 = (value) => {
  const normalized = String(value || '').trim();
  if (!normalized || normalized.length % 4 !== 0) return false;
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(normalized)) return false;

  // Hex-like secrets (common in provider dashboards) are ambiguous and should not
  // be auto-decoded as base64 unless explicitly requested.
  if (/^[0-9a-fA-F]+$/.test(normalized)) return false;

  return true;
};

const isBase64WithStrongSignal = (value) => {
  const normalized = String(value || '').trim();
  if (!isLikelyBase64(normalized)) return false;

  // Avoid false positives for plain alphanumeric secrets (common in env files).
  // Base64 keys from CyberSource commonly contain "+", "/", or "=" padding.
  return /[+/=]/.test(normalized);
};

const decodeSecretKey = (secretKey) => {
  const normalizedSecretKey = String(secretKey || '').trim();
  if (!normalizedSecretKey) {
    throw new Error('CAPITAL_BANK_SECRET_KEY is required');
  }

  const requestedEncoding = getSecretKeyEncoding();

  if (requestedEncoding === 'hex') {
    return decodeHexKey(normalizedSecretKey);
  }

  if (requestedEncoding === 'base64') {
    return decodeBase64Key(normalizedSecretKey);
  }

  if (requestedEncoding === 'utf8' || requestedEncoding === 'plain' || requestedEncoding === 'text') {
    return decodeUtf8Key(normalizedSecretKey);
  }

  if (requestedEncoding !== 'auto') {
    throw new Error('CAPITAL_BANK_SECRET_KEY_ENCODING must be one of: auto, base64, hex, utf8');
  }

  // Auto-detect: hex is most common for Secure Acceptance
  const isHexKey = /^[0-9a-fA-F]+$/.test(normalizedSecretKey) && normalizedSecretKey.length % 2 === 0;
  if (isHexKey) return decodeHexKey(normalizedSecretKey);

  if (isBase64WithStrongSignal(normalizedSecretKey)) return decodeBase64Key(normalizedSecretKey);

  return decodeUtf8Key(normalizedSecretKey);
};

/**
 * Build signed form fields for Secure Acceptance
 */
const buildSecureAcceptanceFormFields = ({
  profileId,
  accessKey,
  secretKey,
  transactionUuid,
  referenceNumber,
  amount,
  currency,
  locale = 'en',
  billTo,
  returnUrl,
  cancelUrl
}) => {
  if (!profileId) throw new Error('CAPITAL_BANK_PROFILE_ID is required');
  if (!accessKey) throw new Error('CAPITAL_BANK_ACCESS_KEY is required');
  if (!secretKey) throw new Error('CAPITAL_BANK_SECRET_KEY is required');
  if (!transactionUuid) throw new Error('transaction_uuid is required');
  if (!referenceNumber) throw new Error('reference_number is required');
  if (!amount) throw new Error('amount is required');
  if (!currency) throw new Error('currency is required');
  if (!returnUrl) throw new Error('return_url is required');

  // Generate signed date time (ISO 8601 format)
  const signedDateTime = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');

  // Build form fields with return URLs
  const formFields = {
    access_key: accessKey,
    profile_id: profileId,
    transaction_uuid: transactionUuid,
    signed_field_names: 'access_key,profile_id,transaction_uuid,signed_field_names,unsigned_field_names,signed_date_time,locale,transaction_type,reference_number,amount,currency,payment_method,bill_to_forename,bill_to_surname,bill_to_email,bill_to_address_line1,bill_to_address_city,bill_to_address_country,override_custom_receipt_page,override_custom_cancel_page',
    unsigned_field_names: '',
    signed_date_time: signedDateTime,
    locale: locale,
    transaction_type: 'sale',
    reference_number: referenceNumber,
    amount: Number(amount).toFixed(2),
    currency: currency.toUpperCase(),
    payment_method: 'card',
    bill_to_forename: billTo.firstName || 'Guest',
    bill_to_surname: billTo.lastName || 'User',
    bill_to_email: billTo.email || 'guest@example.com',
    bill_to_address_line1: billTo.address1 || '1 Main Street',
    bill_to_address_city: billTo.locality || 'Amman',
    bill_to_address_country: 'JO'
  };

  // Generate signature
  const signature = buildSecureAcceptanceSignature(formFields, secretKey);
  formFields.signature = signature;

  console.log('[Secure Acceptance] Form fields generated:', {
    profile_id: formFields.profile_id,
    transaction_uuid: formFields.transaction_uuid,
    reference_number: formFields.reference_number,
    amount: formFields.amount,
    currency: formFields.currency,
    signed_date_time: formFields.signed_date_time
  });

  return formFields;
};

module.exports = {
  buildSecureAcceptanceSignature,
  verifySecureAcceptanceSignature,
  buildSecureAcceptanceFormFields,
  getCyberSourceBaseUrl,
  getCyberSourcePaymentUrl,
  CYBERSOURCE_SECURE_ACCEPTANCE_TEST_URL,
  CYBERSOURCE_SECURE_ACCEPTANCE_LIVE_URL,
  decodeSecretKey
};
