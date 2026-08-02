const crypto = require('crypto');
const { PaymentProvider } = require('./PaymentProvider');

const RAZORPAY_API = 'https://api.razorpay.com/v1';

/**
 * Live Razorpay adapter (works in test mode with test keys — no KYC needed to build/demo).
 * Uses the REST API via built-in fetch (Node 18+), so no vendor SDK dependency is required.
 *
 * Model B note: for launch this uses the platform's Razorpay keys. Productionising "each tutor
 * gets paid into their own account" would use Razorpay Route linked accounts / OAuth — see
 * docs/Phases.md (optional later). The rest of the app is unaffected because it only talks to
 * this interface.
 */
class RazorpayPaymentProvider extends PaymentProvider {
  constructor({ keyId, keySecret, webhookSecret }) {
    super();
    if (!keyId || !keySecret) {
      throw new Error('RazorpayPaymentProvider requires RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET');
    }
    this.keyId = keyId;
    this.keySecret = keySecret;
    this.webhookSecret = webhookSecret;
    this.authHeader = 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64');
  }

  async createPaymentLink({
    feeRecordId,
    studentId,
    tutorId,
    referenceId,
    purpose,
    amount,
    month,
    year,
    description,
    customer,
    notes: extraNotes,
  }) {
    const body = {
      amount, // paise
      currency: 'INR',
      description: description || `Tuition fee ${month}/${year}`,
      // We deliver the link over WhatsApp ourselves, so disable Razorpay's own notifications.
      notify: { sms: false, email: false },
      reminder_enable: false,
      // Unique per fee record / subscription period; prevents accidental duplicates.
      reference_id: referenceId || feeRecordId,
      notes: {
        purpose: purpose || 'fee',
        feeRecordId: feeRecordId || '',
        studentId: studentId || '',
        tutorId: tutorId || '',
        month: month != null ? String(month) : '',
        year: year != null ? String(year) : '',
        ...(extraNotes || {}),
      },
    };
    if (customer && (customer.name || customer.contact || customer.email)) {
      body.customer = {};
      if (customer.name) body.customer.name = customer.name;
      if (customer.contact) body.customer.contact = customer.contact;
      if (customer.email) body.customer.email = customer.email;
    }

    const res = await fetch(`${RAZORPAY_API}/payment_links`, {
      method: 'POST',
      headers: { Authorization: this.authHeader, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = data?.error?.description || `Razorpay error (${res.status})`;
      throw new Error(msg);
    }
    return { id: data.id, shortUrl: data.short_url };
  }

  /** HMAC-SHA256 verification of the raw request body against the X-Razorpay-Signature header. */
  verifyWebhookSignature(rawBody, signature) {
    if (!this.webhookSecret || !signature) return false;
    const expected = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(rawBody)
      .digest('hex');
    try {
      return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
    } catch {
      return false;
    }
  }

  /**
   * Normalize a Razorpay webhook event into a vendor-agnostic shape the service can act on.
   * Handles the `payment_link.paid` event for tuition fees and Pro subscription upgrades.
   */
  parseWebhookEvent(event) {
    if (!event || event.event !== 'payment_link.paid') return null;
    const link = event.payload?.payment_link?.entity || {};
    const payment = event.payload?.payment?.entity || {};
    const notes = link.notes || {};
    const purpose = notes.purpose || 'fee';
    const base = {
      paymentId: payment.id || null,
      amount: payment.amount || link.amount || null,
      status: payment.status || 'captured',
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

module.exports = { RazorpayPaymentProvider };
