const crypto = require('crypto');
const { MessagingProvider } = require('./MessagingProvider');

/**
 * Mock WhatsApp provider for Phase 0/1 and offline development.
 * Logs the message and returns a fake message id instead of calling PayPerWA.
 */
class MockMessagingProvider extends MessagingProvider {
  async sendTemplate({ to, templateName, variables }) {
    // eslint-disable-next-line no-console
    console.log(`[mock-whatsapp] -> ${to} template=${templateName} vars=${JSON.stringify(variables)}`);
    return {
      messageId: `msg_mock_${crypto.randomBytes(6).toString('hex')}`,
      status: 'SENT',
    };
  }
}

module.exports = { MockMessagingProvider };
