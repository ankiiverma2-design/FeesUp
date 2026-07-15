const { env } = require('../config/env');
const { MockPaymentProvider } = require('./payment/MockPaymentProvider');
const { RazorpayPaymentProvider } = require('./payment/RazorpayPaymentProvider');
const { MockMessagingProvider } = require('./messaging/MockMessagingProvider');
const { PayPerWAMessagingProvider } = require('./messaging/PayPerWAMessagingProvider');

// Factory: selects provider implementations based on env configuration.
// mock = offline/dev; live vendors slot in without changing any caller.

function buildPaymentProvider() {
  switch (env.paymentProvider) {
    case 'mock':
      return new MockPaymentProvider();
    case 'razorpay':
      return new RazorpayPaymentProvider(env.razorpay);
    default:
      // eslint-disable-next-line no-console
      console.warn(`Unknown PAYMENT_PROVIDER "${env.paymentProvider}", falling back to mock`);
      return new MockPaymentProvider();
  }
}

function buildMessagingProvider() {
  switch (env.messagingProvider) {
    case 'mock':
      return new MockMessagingProvider();
    case 'payperwa':
      return new PayPerWAMessagingProvider(env.payperwa);
    default:
      // eslint-disable-next-line no-console
      console.warn(`Unknown MESSAGING_PROVIDER "${env.messagingProvider}", falling back to mock`);
      return new MockMessagingProvider();
  }
}

const paymentProvider = buildPaymentProvider();
const messagingProvider = buildMessagingProvider();

module.exports = { paymentProvider, messagingProvider };
