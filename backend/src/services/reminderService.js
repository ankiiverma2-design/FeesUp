const { prisma } = require('../lib/prisma');
const { messagingProvider } = require('../providers');
const { ApiError } = require('../utils/errors');
const { currentPeriod } = require('../lib/time');
const { formatPaise, monthLabel } = require('../lib/format');
const { TEMPLATES } = require('../config/reminderTemplates');
const { determineReminderType } = require('../lib/reminderLogic');
const paymentService = require('./paymentService');

/**
 * Send a reminder for a fee record.
 * - Ensures a payment link exists (generates one if needed).
 * - Idempotent per (feeRecordId, reminderType) via upsert.
 * @param {object} opts
 * @param {string} [opts.tutorId]     when present, scopes the lookup (manual sends)
 * @param {string} opts.feeRecordId
 * @param {string} [opts.type]        override; otherwise computed (manual falls back to DUE)
 * @param {boolean} [opts.manual]
 */
async function sendReminder({ tutorId, feeRecordId, type, manual }) {
  const record = await prisma.feeRecord.findFirst({
    where: { id: feeRecordId, ...(tutorId ? { tutorId } : {}) },
    include: { student: true },
  });
  if (!record) throw ApiError.notFound('Fee record not found');
  if (record.status === 'PAID') throw ApiError.badRequest('This fee is already paid', 'ALREADY_PAID');

  const reminderType = type || determineReminderType(record, record.student) || (manual ? 'DUE' : null);
  if (!reminderType) return { skipped: true, reason: 'no reminder applicable today' };

  // Ensure there's a payment link to include in the message.
  let paymentLink = record.paymentLink;
  if (!paymentLink) {
    try {
      const link = await paymentService.createOrGetLink(record.tutorId, record.id);
      paymentLink = link.paymentLink;
    } catch {
      paymentLink = ''; // still send the reminder even if link generation fails
    }
  }

  const template = TEMPLATES[reminderType];
  const vars = {
    parentName: record.student.parentName,
    studentName: record.student.studentName,
    amount: formatPaise(record.amount),
    month: monthLabel(record.month, record.year),
    paymentLink: paymentLink || '(link unavailable)',
  };
  const variables = [vars.parentName, vars.studentName, vars.amount, vars.month, vars.paymentLink];

  let providerMessageId = null;
  let status = 'SENT';
  let error = null;
  try {
    const result = await messagingProvider.sendTemplate({
      to: record.student.parentWhatsapp,
      templateName: template.name,
      variables,
    });
    providerMessageId = result.messageId;
    status = result.status || 'SENT';
  } catch (err) {
    status = 'FAILED';
    error = err.message;
  }

  // Idempotent record of the send (one per fee record + type).
  await prisma.reminder.upsert({
    where: { feeRecordId_reminderType: { feeRecordId: record.id, reminderType } },
    update: { status, providerMessageId, templateName: template.name, error, sentAt: new Date() },
    create: {
      feeRecordId: record.id,
      studentId: record.studentId,
      tutorId: record.tutorId,
      reminderType,
      templateName: template.name,
      providerMessageId,
      status,
      error,
    },
  });

  if (status === 'FAILED') throw ApiError.badRequest(`Failed to send reminder: ${error}`, 'SEND_FAILED');
  return { reminderType, status, providerMessageId };
}

/**
 * Scheduled sweep: for the current period, send the applicable reminder to every active
 * student's unpaid fee record — but only if that reminder type hasn't been sent yet.
 */
async function sweepAll(month, year) {
  const period = month && year ? { month, year } : currentPeriod();
  const records = await prisma.feeRecord.findMany({
    where: { month: period.month, year: period.year, status: 'PENDING', student: { isActive: true } },
    include: { student: true, reminders: true },
  });

  let sent = 0;
  let skipped = 0;
  for (const record of records) {
    const type = determineReminderType(record, record.student);
    if (!type) {
      skipped += 1;
      continue;
    }
    const already = record.reminders.some((r) => r.reminderType === type && r.status !== 'FAILED');
    if (already) {
      skipped += 1;
      continue;
    }
    try {
      await sendReminder({ feeRecordId: record.id, type });
      sent += 1;
    } catch {
      // sendReminder already recorded the failure; keep going.
      skipped += 1;
    }
  }

  return { month: period.month, year: period.year, candidates: records.length, sent, skipped };
}

module.exports = { determineReminderType, sendReminder, sweepAll };
