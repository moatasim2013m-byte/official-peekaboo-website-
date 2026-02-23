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

const SIGNED_HEADER_ORDER = ['host', 'date', '(request-target)', 'v-c-merchant-id', 'digest'];

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

const getSecretKeyEncoding = () => String(process.env.CAPITAL_BANK_SECRET_KEY_ENCODING || 'auto').trim().toLowerCase();

const decodeBase64Key = (value) => Buffer.from(value, 'base64');

const decodeHexKey = (value) => Buffer.from(value, 'hex');

const decodeUtf8Key = (value) => Buffer.from(value, 'utf8');

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

  const isHexKey = /^[0-9a-fA-F]+$/.test(normalizedSecretKey) && normalizedSecretKey.length % 2 === 0;
  if (isHexKey) return decodeHexKey(normalizedSecretKey);

  if (isBase64WithStrongSignal(normalizedSecretKey)) return decodeBase64Key(normalizedSecretKey);

  return decodeUtf8Key(normalizedSecretKey);
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
    '(request-target)': requestTarget,
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
