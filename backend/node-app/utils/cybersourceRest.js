const crypto = require('crypto');

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

  const date = new Date().toUTCString();
  const host = 'apitest.cybersource.com';
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

  return {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'v-c-merchant-id': merchantId,
    Date: date,
    Host: host,
    Digest: digest,
    Signature: `keyId="${merchantId}", algorithm="HmacSHA256", headers="host date request-target v-c-merchant-id digest", signature="${signatureValue}"`
  };
};

module.exports = {
  buildRestHeaders
};
