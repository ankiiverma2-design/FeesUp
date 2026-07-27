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

// Reminder timing rules, expressed in terms of `daysUntilDue` (positive = due in the future):
//   PRE_DUE  fires when daysUntilDue === PRE_DUE_DAYS_BEFORE  (e.g. 3 days remain)
//   DUE      fires when daysUntilDue === 0                    (due today)
//   OVERDUE  fires when daysUntilDue <= -OVERDUE_DAYS_AFTER   (e.g. 3+ days past due)
const REMINDER_RULES = { PRE_DUE_DAYS_BEFORE: 3, OVERDUE_DAYS_AFTER: 3 };

module.exports = { TEMPLATES, REMINDER_RULES };
