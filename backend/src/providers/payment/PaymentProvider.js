/**
 * PaymentProvider interface.
 *
 * All payment integrations (Razorpay in Phase 2) implement this contract so the rest of the
 * app never talks to a vendor SDK directly. Swap implementations via PAYMENT_PROVIDER env.
 */
class PaymentProvider {
  /**
   * Create a payment link for a fee record.
   * @param {object} params
   * @param {string} params.feeRecordId
   * @param {string} params.studentId
   * @param {number} params.amount   amount in paise
   * @param {number} params.month
   * @param {number} params.year
   * @param {string} params.description
   * @param {object} [params.customer]  { name, contact, email }
   * @returns {Promise<{ id: string, shortUrl: string }>}
   */
  // eslint-disable-next-line no-unused-vars
  async createPaymentLink(params) {
    throw new Error('createPaymentLink not implemented');
  }

  /**
   * Verify a webhook signature against the raw request body.
   * @returns {boolean}
   */
  // eslint-disable-next-line no-unused-vars
  verifyWebhookSignature(rawBody, signature) {
    throw new Error('verifyWebhookSignature not implemented');
  }

  /**
   * Normalize a parsed webhook event into a vendor-agnostic shape:
   * { type: 'PAID', feeRecordId, studentId, month, year, paymentId, amount, status } | null
   */
  // eslint-disable-next-line no-unused-vars
  parseWebhookEvent(event) {
    throw new Error('parseWebhookEvent not implemented');
  }
}

module.exports = { PaymentProvider };
