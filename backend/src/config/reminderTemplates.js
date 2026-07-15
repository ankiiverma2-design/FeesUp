// WhatsApp reminder templates. On live PayPerWA/Meta, each `name` must be an APPROVED template.
// The variable order here must match the approved template's placeholders ({{1}}, {{2}}, ...).
//
// Variable order (all three templates): [parentName, studentName, amount, month, paymentLink]
//
// `preview` builds the human-readable text — used by the mock provider log and as a reference
// for what to submit to Meta for approval.

const TEMPLATES = {
  PRE_DUE: {
    name: 'fee_pre_due_reminder',
    preview: ({ parentName, studentName, amount, month, paymentLink }) =>
      `Hi ${parentName}, a friendly reminder that ${studentName}'s tuition fee of ${amount} for ` +
      `${month} is due soon. You can pay here: ${paymentLink}. Thank you!`,
  },
  DUE: {
    name: 'fee_due_reminder',
    preview: ({ parentName, studentName, amount, month, paymentLink }) =>
      `Hi ${parentName}, ${studentName}'s tuition fee of ${amount} for ${month} is due today. ` +
      `Pay here: ${paymentLink}. Thank you!`,
  },
  OVERDUE: {
    name: 'fee_overdue_reminder',
    preview: ({ parentName, studentName, amount, month, paymentLink }) =>
      `Hi ${parentName}, ${studentName}'s tuition fee of ${amount} for ${month} is overdue. ` +
      `Please pay at your earliest convenience: ${paymentLink}. Thank you!`,
  },
};

// Number of days before/after the due date that each reminder type applies.
const REMINDER_OFFSETS = { PRE_DUE: -3, DUE: 0, OVERDUE: 3 };

module.exports = { TEMPLATES, REMINDER_OFFSETS };
