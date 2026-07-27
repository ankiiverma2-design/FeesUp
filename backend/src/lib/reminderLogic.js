// Pure reminder-selection logic (no DB / no providers) so it is easily unit-testable.

const { daysUntilDue } = require('./time');
const { REMINDER_RULES } = require('../config/reminderTemplates');

/**
 * Which reminder applies today for a fee record, based on daysUntilDue (IST):
 *   daysUntilDue === 3  => PRE_DUE  (3 days before the due date)
 *   daysUntilDue === 0  => DUE      (on the due date)
 *   daysUntilDue <= -3  => OVERDUE  (3 or more days past due)
 * Returns null when no reminder applies today.
 *
 * @param {{month:number, year:number}} record
 * @param {{feeDueDay:number}} student
 */
function determineReminderType(record, student) {
  const diff = daysUntilDue({
    month: record.month,
    year: record.year,
    feeDueDay: student.feeDueDay,
  });
  if (diff === REMINDER_RULES.PRE_DUE_DAYS_BEFORE) return 'PRE_DUE';
  if (diff === 0) return 'DUE';
  if (diff <= -REMINDER_RULES.OVERDUE_DAYS_AFTER) return 'OVERDUE';
  return null;
}

module.exports = { determineReminderType };
