const DEFAULT_HOSTED_ENDPOINT = 'https://testsecureacceptance.cybersource.com/pay';

const getHostedSecureAcceptanceConfig = () => {
  const profileId = process.env.CAPITAL_BANK_PROFILE_ID;
  const accessKey = process.env.CAPITAL_BANK_ACCESS_KEY;
  const secretKey = process.env.CAPITAL_BANK_SECRET_KEY;
  const endpoint = process.env.CAPITAL_BANK_PAYMENT_ENDPOINT || DEFAULT_HOSTED_ENDPOINT;

  if (!profileId || !accessKey || !secretKey) {
    throw new Error('Missing Capital Bank Hosted Secure Acceptance credentials');
  }

  return {
    profileId,
    accessKey,
    secretKey,
    endpoint,
    currency: 'JOD',
    locale: 'ar'
  };
};

module.exports = {
  getHostedSecureAcceptanceConfig,
  DEFAULT_HOSTED_ENDPOINT
};
