const cybersourceRestClient = require('cybersource-rest-client');

const getRunEnvironment = () => {
  if (process.env.CYBERSOURCE_RUN_ENV) {
    return process.env.CYBERSOURCE_RUN_ENV;
  }

  const env = (process.env.CYBERSOURCE_ENV || 'test').toLowerCase();
  return env === 'production'
    ? 'cybersource.environment.production'
    : 'cybersource.environment.sandbox';
};

const getConfigObject = () => {
  const merchantID = process.env.CAPITAL_BANK_MERCHANT_ID;
  const merchantKeyId = process.env.CAPITAL_BANK_ACCESS_KEY;
  const merchantsecretKey = process.env.CAPITAL_BANK_SECRET_KEY;

  if (!merchantID || !merchantKeyId || !merchantsecretKey) {
    throw new Error('Missing Capital Bank REST credentials');
  }

  return {
    authenticationType: 'http_signature',
    merchantID,
    merchantKeyId,
    merchantsecretKey,
    runEnvironment: getRunEnvironment()
  };
};

const createPayment = ({
  amount,
  currency = 'JOD',
  referenceNumber,
  card,
  billTo,
  orderInformation
}) => {
  const configObject = new cybersourceRestClient.Configuration(getConfigObject());
  const apiClient = new cybersourceRestClient.ApiClient();
  const paymentsApi = new cybersourceRestClient.PaymentsApi(configObject, apiClient);

  const requestObj = {
    clientReferenceInformation: {
      code: referenceNumber
    },
    processingInformation: {
      capture: true
    },
    orderInformation: orderInformation || {
      amountDetails: {
        totalAmount: Number(amount).toFixed(2),
        currency: String(currency).toUpperCase()
      },
      billTo: billTo || {
        firstName: 'Test',
        lastName: 'User',
        address1: 'Amman',
        locality: 'Amman',
        administrativeArea: 'AM',
        postalCode: '11118',
        country: 'JO',
        email: 'test@example.com'
      }
    },
    paymentInformation: {
      card: card || {
        number: '4111111111111111',
        expirationMonth: '12',
        expirationYear: '2031',
        securityCode: '123'
      }
    }
  };

  return new Promise((resolve, reject) => {
    paymentsApi.createPayment(requestObj, (error, data, response) => {
      if (error) {
        return reject(error);
      }

      return resolve({
        data,
        status: response?.status,
        headers: response?.headers
      });
    });
  });
};

module.exports = {
  createPayment
};
