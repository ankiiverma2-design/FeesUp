const crypto = require('crypto');
const { PaymentProvider } = require('./PaymentProvider');

/**
 * Mock payment provider used for Phase 0/1 and local/offline development.
 * Produces deterministic-looking fake links without any network call.
 */
class MockPaymentProvider extends PaymentProvider {
  async createPaymentLink(params = {}) {
    const id = `plink_mock_${crypto.randomBytes(8).toString('hex')}`;
    return {
      id,
      shortUrl: `https://rzp.io/mock/${id}`,
      // Echo notes so offline tests can assert what was requested.
      _notes: {
        purpose: params.purpose || 'fee',
        feeRecordId: params.feeRecordId || '',
        studentId: params.studentId || '',
        tutorId: params.tutorId || '',
        month: params.month != null ? String(params.month) : '',
        year: params.year != null ? String(params.year) : '',
        ...(params.notes || {}),
      },
    };
  }

  verifyWebhookSignature() {
    // In mock mode we accept everything; real verification arrives with the live provider.
    return true;
  }

  /**
   * Accepts a simplified simulated event so the paid-flow can be exercised offline:
   *   { event: 'payment_link.paid', notes: { feeRecordId, studentId, month, year }, paymentId? }
   *   { event: 'payment_link.paid', notes: { purpose: 'subscription', tutorId, plan: 'PRO' } }
   */
  parseWebhookEvent(event) {
    if (!event || event.event !== 'payment_link.paid') return null;
    const notes = event.notes || event.payload?.payment_link?.entity?.notes || {};
    const purpose = notes.purpose || 'fee';
    const base = {
      paymentId: event.paymentId || `pay_mock_${Date.now()}`,
      amount: notes.amount ? Number(notes.amount) : null,
      status: 'captured',
    };
    if (purpose === 'subscription') {
      return {
        ...base,
        type: 'SUBSCRIPTION_PAID',
        tutorId: notes.tutorId || null,
        plan: notes.plan || 'PRO',
      };
    }
    return {
      ...base,
      type: 'PAID',
      feeRecordId: notes.feeRecordId || null,
      studentId: notes.studentId || null,
      month: notes.month ? Number(notes.month) : null,
      year: notes.year ? Number(notes.year) : null,
    };
  }
}

module.exports = { MockPaymentProvider };
