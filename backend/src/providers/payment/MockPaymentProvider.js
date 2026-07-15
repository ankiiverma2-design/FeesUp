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

  /**
   * Accepts a simplified simulated event so the paid-flow can be exercised offline:
   *   { event: 'payment_link.paid', notes: { feeRecordId, studentId, month, year }, paymentId? }
   */
  parseWebhookEvent(event) {
    if (!event || event.event !== 'payment_link.paid') return null;
    const notes = event.notes || event.payload?.payment_link?.entity?.notes || {};
    return {
      type: 'PAID',
      feeRecordId: notes.feeRecordId || null,
      studentId: notes.studentId || null,
      month: notes.month ? Number(notes.month) : null,
      year: notes.year ? Number(notes.year) : null,
      paymentId: event.paymentId || `pay_mock_${Date.now()}`,
      amount: notes.amount || null,
      status: 'captured',
    };
  }
}

module.exports = { MockPaymentProvider };
