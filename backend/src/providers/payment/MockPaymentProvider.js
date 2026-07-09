const crypto = require('crypto');
const { PaymentProvider } = require('./PaymentProvider');

/**
 * Mock payment provider used for Phase 0/1 and local/offline development.
 * Produces deterministic-looking fake links without any network call.
 */
class MockPaymentProvider extends PaymentProvider {
  // eslint-disable-next-line no-unused-vars
  async createPaymentLink(params) {
    const id = `plink_mock_${crypto.randomBytes(8).toString('hex')}`;
    return {
      id,
      shortUrl: `https://rzp.io/mock/${id}`,
    };
  }

  verifyWebhookSignature() {
    // In mock mode we accept everything; real verification arrives with the live provider.
    return true;
  }
}

module.exports = { MockPaymentProvider };
