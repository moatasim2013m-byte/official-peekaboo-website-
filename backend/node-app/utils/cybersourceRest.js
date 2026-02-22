const crypto = require('crypto');

const CYBERSOURCE_REST_TEST_URL = 'https://apitest.cybersource.com';
const CYBERSOURCE_REST_LIVE_URL = 'https://api.cybersource.com';
const EXPECTED_CAPITAL_BANK_ACCESS_KEY = '8dd4c4e88ef6322ab79126cb4a6e6f27';

const getCyberSourceBaseUrl = () => (
  process.env.CYBERSOURCE_ENV === 'production' || process.env.NODE_ENV === 'production'
    ? CYBERSOURCE_REST_LIVE_URL
    : CYBERSOURCE_REST_TEST_URL
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

  if (sanitizedAccessKey !== EXPECTED_CAPITAL_BANK_ACCESS_KEY) {
    throw new Error('CAPITAL_BANK_ACCESS_KEY does not match expected Google Secret Manager value');
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
