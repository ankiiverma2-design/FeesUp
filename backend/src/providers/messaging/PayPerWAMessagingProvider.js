const { MessagingProvider } = require('./MessagingProvider');

/**
 * Live PayPerWA adapter (WhatsApp via Meta's Cloud API).
 *
 * IMPORTANT: business-initiated WhatsApp messages require a pre-approved template. This adapter
 * sends by approved template name + ordered variables.
 *
 * NOTE: PayPerWA's exact request shape should be confirmed against their current API docs and
 * adjusted here if needed — everything else in the app is isolated from this by the interface.
 * Configure PAYPERWA_BASE_URL and PAYPERWA_API_KEY, then set MESSAGING_PROVIDER=payperwa.
 */
class PayPerWAMessagingProvider extends MessagingProvider {
  constructor({ apiKey, baseUrl }) {
    super();
    if (!apiKey || !baseUrl) {
      throw new Error('PayPerWAMessagingProvider requires PAYPERWA_API_KEY and PAYPERWA_BASE_URL');
    }
    this.apiKey = apiKey;
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  async sendTemplate({ to, templateName, variables }) {
    const res = await fetch(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to,
        type: 'template',
        template: { name: templateName, language: 'en', variables },
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = data?.error?.message || data?.message || `PayPerWA error (${res.status})`;
      throw new Error(msg);
    }
    return {
      messageId: data.messageId || data.id || null,
      status: data.status || 'SENT',
    };
  }
}

module.exports = { PayPerWAMessagingProvider };
