const { test } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const { MockPaymentProvider } = require('../src/providers/payment/MockPaymentProvider');
const { RazorpayPaymentProvider } = require('../src/providers/payment/RazorpayPaymentProvider');

test('MockPaymentProvider creates a fake payment link', async () => {
  const provider = new MockPaymentProvider();
  const link = await provider.createPaymentLink({
    feeRecordId: 'fee-1',
    purpose: 'fee',
    amount: 200000,
  });
  assert.match(link.id, /^plink_mock_/);
  assert.match(link.shortUrl, /^https:\/\/rzp\.io\/mock\//);
});

test('MockPaymentProvider parses fee paid events', () => {
  const provider = new MockPaymentProvider();
  const parsed = provider.parseWebhookEvent({
    event: 'payment_link.paid',
    notes: { feeRecordId: 'fee-1', studentId: 'stu-1', month: '7', year: '2026' },
    paymentId: 'pay_1',
  });
  assert.equal(parsed.type, 'PAID');
  assert.equal(parsed.feeRecordId, 'fee-1');
  assert.equal(parsed.month, 7);
  assert.equal(parsed.year, 2026);
});

test('MockPaymentProvider parses subscription paid events', () => {
  const provider = new MockPaymentProvider();
  const parsed = provider.parseWebhookEvent({
    event: 'payment_link.paid',
    notes: { purpose: 'subscription', tutorId: 'tutor-1', plan: 'PRO' },
  });
  assert.equal(parsed.type, 'SUBSCRIPTION_PAID');
  assert.equal(parsed.tutorId, 'tutor-1');
  assert.equal(parsed.plan, 'PRO');
});

test('MockPaymentProvider ignores unrelated events', () => {
  const provider = new MockPaymentProvider();
  assert.equal(provider.parseWebhookEvent({ event: 'payment.captured' }), null);
});

test('RazorpayPaymentProvider verifies HMAC signatures (timing-safe)', () => {
  const secret = 'whsec_test_secret';
  const provider = new RazorpayPaymentProvider({
    keyId: 'rzp_test_x',
    keySecret: 'secret',
    webhookSecret: secret,
  });
  const raw = Buffer.from('{"event":"payment_link.paid"}');
  const good = crypto.createHmac('sha256', secret).update(raw).digest('hex');
  assert.equal(provider.verifyWebhookSignature(raw, good), true);
  assert.equal(provider.verifyWebhookSignature(raw, 'deadbeef'), false);
  assert.equal(provider.verifyWebhookSignature(raw, null), false);
});

test('RazorpayPaymentProvider parses fee and subscription payment_link.paid', () => {
  const provider = new RazorpayPaymentProvider({
    keyId: 'rzp_test_x',
    keySecret: 'secret',
    webhookSecret: 'whsec',
  });

  const feeEvent = {
    event: 'payment_link.paid',
    payload: {
      payment_link: {
        entity: {
          amount: 200000,
          notes: { feeRecordId: 'fee-9', studentId: 's1', month: '8', year: '2026' },
        },
      },
      payment: { entity: { id: 'pay_fee', amount: 200000, status: 'captured' } },
    },
  };
  const fee = provider.parseWebhookEvent(feeEvent);
  assert.equal(fee.type, 'PAID');
  assert.equal(fee.feeRecordId, 'fee-9');
  assert.equal(fee.paymentId, 'pay_fee');

  const subEvent = {
    event: 'payment_link.paid',
    payload: {
      payment_link: {
        entity: {
          amount: 19900,
          notes: { purpose: 'subscription', tutorId: 'tutor-9', plan: 'PRO' },
        },
      },
      payment: { entity: { id: 'pay_sub', amount: 19900, status: 'captured' } },
    },
  };
  const sub = provider.parseWebhookEvent(subEvent);
  assert.equal(sub.type, 'SUBSCRIPTION_PAID');
  assert.equal(sub.tutorId, 'tutor-9');
  assert.equal(sub.paymentId, 'pay_sub');
});
