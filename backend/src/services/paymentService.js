const crypto = require('crypto');
const { prisma } = require('../lib/prisma');
const { paymentProvider } = require('../providers');
const { ApiError } = require('../utils/errors');

/**
 * Create (or return the existing) payment link for a fee record.
 * Links are stored and reused for the period so we don't regenerate on every reminder.
 */
async function createOrGetLink(tutorId, feeRecordId) {
  const record = await prisma.feeRecord.findFirst({
    where: { id: feeRecordId, tutorId },
    include: { student: true },
  });
  if (!record) throw ApiError.notFound('Fee record not found');
  if (record.status === 'PAID') {
    throw ApiError.badRequest('This fee is already paid', 'ALREADY_PAID');
  }
  if (record.paymentLink) {
    return { paymentLink: record.paymentLink, razorpayPaymentLinkId: record.razorpayPaymentLinkId, reused: true };
  }

  const { id, shortUrl } = await paymentProvider.createPaymentLink({
    feeRecordId: record.id,
    studentId: record.studentId,
    tutorId,
    amount: record.amount,
    month: record.month,
    year: record.year,
    description: `Tuition fee for ${record.student.studentName} (${record.month}/${record.year})`,
    customer: {
      name: record.student.parentName,
      contact: record.student.parentWhatsapp,
    },
  });

  const updated = await prisma.feeRecord.update({
    where: { id: record.id },
    data: { paymentLink: shortUrl, razorpayPaymentLinkId: id },
  });

  return { paymentLink: updated.paymentLink, razorpayPaymentLinkId: updated.razorpayPaymentLinkId, reused: false };
}

/**
 * Handle an incoming payment webhook. Verifies the signature, dedupes on the event id,
 * matches the fee record via notes, and marks it paid. Idempotent and safe to retry.
 *
 * @param {Buffer} rawBody  raw request body (needed for signature verification)
 * @param {string} signature  provider signature header
 * @param {string} [eventId]  provider event id header (falls back to a body hash)
 */
async function handleWebhook(rawBody, signature, eventId) {
  const valid = paymentProvider.verifyWebhookSignature(rawBody, signature);
  if (!valid) throw ApiError.badRequest('Invalid webhook signature', 'BAD_SIGNATURE');

  let event;
  try {
    event = JSON.parse(rawBody.toString('utf8'));
  } catch {
    throw ApiError.badRequest('Invalid webhook payload');
  }

  const id = eventId || crypto.createHash('sha256').update(rawBody).digest('hex');

  // Idempotency: record the event first; if it already exists and was processed, stop.
  const existing = await prisma.webhookEvent.findUnique({ where: { eventId: id } });
  if (existing && existing.processedAt) {
    return { duplicate: true };
  }
  if (!existing) {
    await prisma.webhookEvent.create({ data: { provider: 'razorpay', eventId: id, payload: event } });
  }

  const parsed = paymentProvider.parseWebhookEvent(event);
  if (!parsed || parsed.type !== 'PAID' || !parsed.feeRecordId) {
    await prisma.webhookEvent.update({ where: { eventId: id }, data: { processedAt: new Date() } });
    return { ignored: true };
  }

  const record = await prisma.feeRecord.findUnique({ where: { id: parsed.feeRecordId } });
  if (record && record.status !== 'PAID') {
    await prisma.feeRecord.update({
      where: { id: record.id },
      data: { status: 'PAID', paidAt: new Date(), transactionId: parsed.paymentId },
    });
    if (parsed.paymentId) {
      await prisma.payment.upsert({
        where: { razorpayPaymentId: parsed.paymentId },
        update: {},
        create: {
          tutorId: record.tutorId,
          feeRecordId: record.id,
          razorpayPaymentId: parsed.paymentId,
          amount: parsed.amount || record.amount,
          status: parsed.status || 'captured',
          raw: event,
        },
      });
    }
  }

  await prisma.webhookEvent.update({ where: { eventId: id }, data: { processedAt: new Date() } });
  return { ok: true, feeRecordId: parsed.feeRecordId };
}

module.exports = { createOrGetLink, handleWebhook };
