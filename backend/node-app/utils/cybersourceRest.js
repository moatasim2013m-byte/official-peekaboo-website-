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
  const signingString = [
    `host: ${host}`,
    `date: ${date}`,
    `request-target: ${requestTarget}`,
    `v-c-merchant-id: ${merchantId}`,
    `digest: ${digest}`
  ].join('\n');

  const signatureValue = crypto
    .createHmac('sha256', secretKey)
    .update(signingString, 'utf8')
    .digest('base64');

  const signatureHeader = `keyId="${sanitizedAccessKey}", algorithm="HmacSHA256", headers="host date request-target v-c-merchant-id digest", signature="${signatureValue}"`;

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
  CYBERSOURCE_REST_TEST_URL,
  CYBERSOURCE_REST_LIVE_URL,
  getCyberSourceBaseUrl,
  getCyberSourcePaymentUrl
};
