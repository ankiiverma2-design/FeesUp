/**
 * MessagingProvider interface.
 *
 * WhatsApp integrations (PayPerWA in Phase 3) implement this contract. Business-initiated
 * WhatsApp messages require pre-approved templates; the app passes a template name + variables.
 */
class MessagingProvider {
  /**
   * Send a templated WhatsApp message.
   * @param {object} params
   * @param {string} params.to           recipient in E.164 (e.g. +9198...)
   * @param {string} params.templateName approved template identifier
   * @param {string[]} params.variables  ordered template variables
   * @returns {Promise<{ messageId: string, status: string }>}
   */
  // eslint-disable-next-line no-unused-vars
  async sendTemplate(params) {
    throw new Error('sendTemplate not implemented');
  }
}

module.exports = { MessagingProvider };
