const {
  buildSecureAcceptanceFields,
  getCyberSourcePaymentUrl,
  validateSecureAcceptanceConfig,
  validateSecureAcceptanceFields
} = require('../utils/cybersourceRest');

const runScenario = (name, input) => {
  const previousEncoding = process.env.CAPITAL_BANK_SECRET_KEY_ENCODING;
  try {
    if (input.secretKeyEncoding) {
      process.env.CAPITAL_BANK_SECRET_KEY_ENCODING = input.secretKeyEncoding;
    } else {
      delete process.env.CAPITAL_BANK_SECRET_KEY_ENCODING;
    }

    const configResult = validateSecureAcceptanceConfig(input);
    const result = {
      name,
      configOk: configResult.ok,
      configCode: configResult.code || null,
      details: configResult.details
    };

    if (configResult.ok) {
      const payload = buildSecureAcceptanceFields({
        merchantId: input.merchantId,
        profileId: input.profileId,
        accessKey: input.accessKey,
        secretKey: input.secretKey,
        transactionUuid: '123e4567-e89b-12d3-a456-426614174000',
        referenceNumber: 'order-12345',
        amount: 10.5,
        locale: 'ar',
        transactionType: 'sale',
        currency: 'JOD',
        billToForename: 'Test',
        billToSurname: 'User',
        billToEmail: 'test@example.com',
        billToAddressLine1: 'Amman',
        billToAddressCity: 'Amman',
        billToAddressCountry: 'JO'
      });

      const fieldsResult = validateSecureAcceptanceFields(payload);
      result.fieldsOk = fieldsResult.ok;
      result.fieldsCode = fieldsResult.code || null;
      result.url = input.endpoint || getCyberSourcePaymentUrl();
      result.pathOk = String(result.url).includes('/pay');
    }

    return result;
  } finally {
    if (typeof previousEncoding === 'string') {
      process.env.CAPITAL_BANK_SECRET_KEY_ENCODING = previousEncoding;
    } else {
      delete process.env.CAPITAL_BANK_SECRET_KEY_ENCODING;
    }
  }
};

const BASE64_TEST_SECRET = 'ZmFrZVNlY3JldEtleTEyMw==';
const HEX_TEST_SECRET = '00112233445566778899aabbccddeeff';

const sharedCreds = {
  merchantId: 'testmerchant1234',
  profileId: 'testprofile1234',
  accessKey: 'ABCD1234ACCESS',
  secretKey: BASE64_TEST_SECRET
};

const scenarios = [
  {
    name: 'env=test + live host => reject mismatch',
    input: {
      ...sharedCreds,
      env: 'test',
      endpoint: 'https://secureacceptance.cybersource.com/pay'
    },
    expect: { configOk: false, configCode: 'CAPITAL_BANK_ENV_HOST_MISMATCH' }
  },
  {
    name: 'env=prod + test host => reject mismatch',
    input: {
      ...sharedCreds,
      env: 'prod',
      endpoint: 'https://testsecureacceptance.cybersource.com/pay'
    },
    expect: { configOk: false, configCode: 'CAPITAL_BANK_ENV_HOST_MISMATCH' }
  },
  {
    name: 'missing profile/access/secret => config invalid',
    input: {
      merchantId: 'merchantOnly',
      profileId: '',
      accessKey: '',
      secretKey: '',
      env: 'test',
      endpoint: 'https://testsecureacceptance.cybersource.com/pay'
    },
    expect: { configOk: false, configCode: 'CAPITAL_BANK_CONFIG_INVALID' }
  },
  {
    name: 'ambiguous secret with auto encoding => reject with actionable code',
    input: {
      ...sharedCreds,
      secretKey: '0011223344556677',
      env: 'test',
      endpoint: 'https://testsecureacceptance.cybersource.com/pay'
    },
    expect: { configOk: false, configCode: 'CAPITAL_BANK_SECRET_ENCODING_AMBIGUOUS' }
  },
  {
    name: 'explicit hex encoding + hex secret => valid config',
    input: {
      ...sharedCreds,
      secretKey: HEX_TEST_SECRET,
      secretKeyEncoding: 'hex',
      env: 'test',
      endpoint: 'https://testsecureacceptance.cybersource.com/pay'
    },
    expect: { configOk: true, fieldsOk: true, pathOk: true }
  },
  {
    name: 'valid config => /pay URL + signed fields',
    input: {
      ...sharedCreds,
      env: 'test',
      endpoint: 'https://testsecureacceptance.cybersource.com/pay'
    },
    expect: { configOk: true, fieldsOk: true, pathOk: true }
  }
];

let failures = 0;
const report = scenarios.map((scenario) => {
  const outcome = runScenario(scenario.name, scenario.input);
  const expected = scenario.expect;

  Object.entries(expected).forEach(([key, expectedValue]) => {
    if (outcome[key] !== expectedValue) {
      failures += 1;
      outcome[`expected_${key}`] = expectedValue;
    }
  });

  return outcome;
});

console.log(JSON.stringify({ failures, report }, null, 2));
if (failures > 0) process.exit(1);
