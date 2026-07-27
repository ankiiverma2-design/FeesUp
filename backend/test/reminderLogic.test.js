const { test } = require('node:test');
const assert = require('node:assert/strict');
const { determineReminderType } = require('../src/lib/reminderLogic');
const { nowInIST } = require('../src/lib/time');

// Build a { record, student } whose due date is `offsetDays` from today (IST).
function caseForOffset(offsetDays) {
  const { year, month, day } = nowInIST();
  const d = new Date(Date.UTC(year, month - 1, day + offsetDays));
  return {
    record: { month: d.getUTCMonth() + 1, year: d.getUTCFullYear() },
    student: { feeDueDay: d.getUTCDate() },
  };
}

test('PRE_DUE fires exactly 3 days before the due date', () => {
  const { record, student } = caseForOffset(3);
  assert.equal(determineReminderType(record, student), 'PRE_DUE');
});

test('DUE fires on the due date', () => {
  const { record, student } = caseForOffset(0);
  assert.equal(determineReminderType(record, student), 'DUE');
});

test('OVERDUE fires 3 or more days after the due date', () => {
  assert.equal(determineReminderType(...Object.values(caseForOffset(-3))), 'OVERDUE');
  assert.equal(determineReminderType(...Object.values(caseForOffset(-10))), 'OVERDUE');
});

test('no reminder on non-trigger days (e.g. 1 or 2 days before, 1 day after)', () => {
  assert.equal(determineReminderType(...Object.values(caseForOffset(2))), null);
  assert.equal(determineReminderType(...Object.values(caseForOffset(1))), null);
  assert.equal(determineReminderType(...Object.values(caseForOffset(-1))), null);
});
