const crypto = require('crypto');

const CYBERSOURCE_REST_TEST_URL = 'https://apitest.cybersource.com';
const CYBERSOURCE_REST_LIVE_URL = 'https://api.cybersource.com';

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
  || CYBERSOURCE_REST_TEST_URL
);

const getCyberSourceHost = () => new URL(getCyberSourceBaseUrl()).host;

const getCyberSourcePaymentUrl = () => `${getCyberSourceBaseUrl()}/pts/v2/payments`;

const buildDigest = (requestBody = '') => {
  const digest = crypto
    .createHash('sha256')
    .update(requestBody, 'utf8')
    .digest('base64');

  return `SHA-256=${digest}`;
};

const SIGNED_HEADER_ORDER = ['host', 'date', 'request-target', 'v-c-merchant-id', 'digest'];

const buildSigningString = (headerValues) => SIGNED_HEADER_ORDER
  .map((headerName) => {
    const headerValue = headerValues?.[headerName];
    if (!headerValue) {
      throw new Error(`Missing required HTTP signature header value: ${headerName}`);
    }
    return `${headerName}: ${headerValue}`;
  })
  .join('\n');

const isLikelyBase64 = (value) => {
  const normalized = String(value || '').trim();
  if (!normalized || normalized.length % 4 !== 0) return false;
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(normalized)) return false;

  // Hex-like secrets (common in provider dashboards) are ambiguous and should not
  // be auto-decoded as base64 unless explicitly requested.
  if (/^[0-9a-fA-F]+$/.test(normalized)) return false;

  return true;
};

const decodeSecretKey = (secretKey) => {
  const normalizedSecretKey = String(secretKey || '').trim();
  if (!normalizedSecretKey) {
    throw new Error('CAPITAL_BANK_SECRET_KEY is required');
  }

  const encodingOverride = String(process.env.CAPITAL_BANK_SECRET_KEY_ENCODING || '').trim().toLowerCase();

  if (encodingOverride === 'base64') {
    return Buffer.from(normalizedSecretKey, 'base64');
  }

  if (encodingOverride === 'hex') {
    return Buffer.from(normalizedSecretKey, 'hex');
  }

  if (encodingOverride === 'utf8' || encodingOverride === 'text') {
    return Buffer.from(normalizedSecretKey, 'utf8');
  }

  const prefixedEncodingMatch = normalizedSecretKey.match(/^(base64|hex|utf8|text):(.*)$/i);
  if (prefixedEncodingMatch) {
    const encoding = prefixedEncodingMatch[1].toLowerCase();
    const rawValue = prefixedEncodingMatch[2];
    if (encoding === 'base64') return Buffer.from(rawValue, 'base64');
    if (encoding === 'hex') return Buffer.from(rawValue, 'hex');
    return Buffer.from(rawValue, 'utf8');
  }

  const isHexKey = /^[0-9a-fA-F]+$/.test(normalizedSecretKey) && normalizedSecretKey.length % 2 === 0;

  if (isLikelyBase64(normalizedSecretKey)) {
    return Buffer.from(normalizedSecretKey, 'base64');
  }

  // Prefer UTF-8 for ambiguous values because bank-issued shared secrets are
  // often displayed as plain text and may look hexadecimal.
  if (isHexKey) {
    return Buffer.from(normalizedSecretKey, 'utf8');
  }

  return Buffer.from(normalizedSecretKey, 'utf8');
};

const buildRestHeaders = (merchantId, accessKey, secretKey, endpointPath, requestBody = '') => {
  if (!merchantId) throw new Error('CAPITAL_BANK_MERCHANT_ID is required');
  if (!accessKey) throw new Error('CAPITAL_BANK_ACCESS_KEY is required');
  if (!secretKey) throw new Error('CAPITAL_BANK_SECRET_KEY is required');
  if (!endpointPath) throw new Error('CyberSource endpoint path is required');

  const sanitizedAccessKey = accessKey.trim();

  if (sanitizedAccessKey !== accessKey) {
    throw new Error('CAPITAL_BANK_ACCESS_KEY contains leading/trailing whitespace');
  }

  const date = new Date().toUTCString();
  const host = getCyberSourceHost();
  const digest = buildDigest(requestBody);
  const requestTarget = `post ${endpointPath}`;
  const signingString = buildSigningString({
    host,
    date,
    'request-target': requestTarget,
    'v-c-merchant-id': merchantId,
    digest
  });

  const decodedSecretKey = decodeSecretKey(secretKey);

  const signatureValue = crypto
    .createHmac('sha256', decodedSecretKey)
    .update(signingString, 'utf8')
    .digest('base64');

  const signatureHeader = `keyId="${sanitizedAccessKey}", algorithm="HmacSHA256", headers="${SIGNED_HEADER_ORDER.join(' ')}", signature="${signatureValue}"`;

  console.info('[CyberSource REST] Signature header:', signatureHeader);

  return {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'v-c-merchant-id': merchantId,
    Date: date,
    Host: host,
    Digest: digest,
    Signature: signatureHeader
  };
};

module.exports = {
  buildRestHeaders,
  buildSigningString,
  CYBERSOURCE_REST_TEST_URL,
  CYBERSOURCE_REST_LIVE_URL,
  getCyberSourceBaseUrl,
  getCyberSourcePaymentUrl,
  SIGNED_HEADER_ORDER
};
