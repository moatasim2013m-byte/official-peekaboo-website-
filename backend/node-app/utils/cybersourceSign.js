const crypto = require('crypto');

const REQUIRED_SIGNED_FIELDS = [
  'access_key',
  'amount',
  'currency',
  'locale',
  'profile_id',
  'reference_number',
  'signed_date_time',
  'signed_field_names',
  'transaction_type',
  'transaction_uuid'
];

const SIGNATURE_EXCLUDED_FIELDS = new Set(['card_number', 'card_cvn', 'signature']);

const getSecretKey = () => {
  const secret = process.env.CAPITAL_BANK_SECRET_KEY || process.env.CYBERSOURCE_SECRET_KEY;
  if (!secret) {
    throw new Error('CAPITAL_BANK_SECRET_KEY is required for CyberSource signing');
  }
  return secret;
};

const getSignedFieldNames = (fields = {}) => {
  const provided = String(fields.signed_field_names || '')
    .split(',')
    .map((field) => field.trim())
    .filter(Boolean);

  if (provided.length) return provided;

  return Object.keys(fields)
    .filter((key) => !SIGNATURE_EXCLUDED_FIELDS.has(key))
    .sort();
};

const buildDataToSign = (fields = {}, signedFieldNames = []) => {
  return signedFieldNames
    .map((fieldName) => `${fieldName}=${fields[fieldName] ?? ''}`)
    .join(',');
};

const signData = (dataToSign, secretKey = getSecretKey()) => {
  return crypto.createHmac('sha256', secretKey).update(dataToSign, 'utf8').digest('base64');
};

const buildSignedFields = (fields = {}) => {
  const signedFieldNames = getSignedFieldNames(fields);
  if (!signedFieldNames.length) {
    throw new Error('signed_field_names cannot be empty');
  }

  const signedFields = { ...fields, signed_field_names: signedFieldNames.join(',') };
  const dataToSign = buildDataToSign(signedFields, signedFieldNames);
  signedFields.signature = signData(dataToSign);

  return signedFields;
};

const assertRequiredRequestFields = (fields = {}) => {
  const signedFieldNames = getSignedFieldNames(fields);
  const missing = REQUIRED_SIGNED_FIELDS.filter((field) => !signedFieldNames.includes(field));
  if (missing.length) {
    throw new Error(`Missing required signed fields: ${missing.join(', ')}`);
  }
};

const validateSignedDateTimeWindow = (signedDateTime, windowMinutes = 15) => {
  const signedDate = new Date(signedDateTime);
  if (Number.isNaN(signedDate.getTime())) {
    throw new Error('Invalid signed_date_time format');
  }

  const now = Date.now();
  const delta = Math.abs(now - signedDate.getTime());
  if (delta > windowMinutes * 60 * 1000) {
    throw new Error('signed_date_time outside the accepted window');
  }
};

const extractTrustedSignedFields = (responseBody = {}) => {
  const signedFieldNames = getSignedFieldNames(responseBody);
  return signedFieldNames.reduce((acc, fieldName) => {
    acc[fieldName] = responseBody[fieldName] ?? '';
    return acc;
  }, {});
};

const verifySignature = (responseBody = {}, options = {}) => {
  const { validateSignedDateTime = true } = options;
  const signature = responseBody.signature;
  if (!signature) {
    throw new Error('Missing signature');
  }

  const signedFieldNames = getSignedFieldNames(responseBody);
  if (!signedFieldNames.length) {
    throw new Error('Missing signed_field_names');
  }

  const trustedFields = extractTrustedSignedFields(responseBody);
  const dataToSign = buildDataToSign({ ...responseBody, ...trustedFields }, signedFieldNames);
  const expected = signData(dataToSign);

  const providedBuffer = Buffer.from(signature, 'utf8');
  const expectedBuffer = Buffer.from(expected, 'utf8');

  if (providedBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(providedBuffer, expectedBuffer)) {
    throw new Error('Invalid CyberSource signature');
  }

  if (validateSignedDateTime) {
    validateSignedDateTimeWindow(trustedFields.signed_date_time);
  }

  return { signedFieldNames, trustedFields };
};

module.exports = {
  REQUIRED_SIGNED_FIELDS,
  SIGNATURE_EXCLUDED_FIELDS,
  buildDataToSign,
  buildSignedFields,
  assertRequiredRequestFields,
  extractTrustedSignedFields,
  validateSignedDateTimeWindow,
  verifySignature
};
