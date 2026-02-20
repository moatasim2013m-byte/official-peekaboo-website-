const crypto = require('crypto');

const getRequiredSecret = (secretKey) => {
  const key = secretKey || process.env.CAPITAL_BANK_SECRET_KEY;
  if (!key) throw new Error('CAPITAL_BANK_SECRET_KEY is required');
  return key;
};

const buildDigestHeader = (payload) => {
  const body = typeof payload === 'string' ? payload : JSON.stringify(payload || {});
  const digest = crypto.createHash('sha256').update(body, 'utf8').digest('base64');
  return `SHA-256=${digest}`;
};

const buildSignatureHeader = ({ method, url, body, merchantId, accessKey, secretKey, date }) => {
  const parsedUrl = new URL(url);
  const requestTarget = `${String(method || 'POST').toLowerCase()} ${parsedUrl.pathname}${parsedUrl.search || ''}`;
  const host = parsedUrl.host;
  const digest = buildDigestHeader(body);
  const messageDate = date || new Date().toUTCString();
  const signedHeaders = 'host date (request-target) digest v-c-merchant-id';

  const signaturePayload = [
    `host: ${host}`,
    `date: ${messageDate}`,
    `(request-target): ${requestTarget}`,
    `digest: ${digest}`,
    `v-c-merchant-id: ${merchantId}`
  ].join('\n');

  const signature = crypto
    .createHmac('sha256', getRequiredSecret(secretKey))
    .update(signaturePayload, 'utf8')
    .digest('base64');

  return {
    date: messageDate,
    host,
    digest,
    signature: `keyid="${accessKey}", algorithm="HmacSHA256", headers="${signedHeaders}", signature="${signature}"`
  };
};

const buildCyberSourceAuthHeaders = ({ method = 'POST', url, body = {}, merchantId, accessKey, secretKey }) => {
  if (!url) throw new Error('CyberSource URL is required');
  if (!merchantId) throw new Error('CAPITAL_BANK_MERCHANT_ID is required');
  if (!accessKey) throw new Error('CAPITAL_BANK_ACCESS_KEY is required');

  const signed = buildSignatureHeader({ method, url, body, merchantId, accessKey, secretKey });

  return {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'v-c-merchant-id': merchantId,
    Date: signed.date,
    Host: signed.host,
    Digest: signed.digest,
    Signature: signed.signature
  };
};

const buildCapitalBankCallbackSignature = (payload = {}, secretKey) => {
  const canonical = JSON.stringify(payload || {});
  return crypto.createHmac('sha256', getRequiredSecret(secretKey)).update(canonical, 'utf8').digest('base64');
};

const verifyCapitalBankCallbackSignature = (payload = {}, signature, secretKey) => {
  if (!signature) return false;
  const expected = buildCapitalBankCallbackSignature(payload, secretKey);
  const sigBuf = Buffer.from(String(signature), 'utf8');
  const expBuf = Buffer.from(String(expected), 'utf8');
  return sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf);
};

module.exports = {
  buildDigestHeader,
  buildSignatureHeader,
  buildCyberSourceAuthHeaders,
  buildCapitalBankCallbackSignature,
  verifyCapitalBankCallbackSignature
};
