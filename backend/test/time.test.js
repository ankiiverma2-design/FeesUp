const { test } = require('node:test');
const assert = require('node:assert/strict');
const { clampDayToMonth, isOverdue, daysUntilDue, nowInIST } = require('../src/lib/time');

test('clampDayToMonth clamps to the last valid day of the month', () => {
  assert.equal(clampDayToMonth(31, 2, 2025), 28); // Feb non-leap
  assert.equal(clampDayToMonth(31, 2, 2024), 29); // Feb leap year
  assert.equal(clampDayToMonth(31, 4, 2025), 30); // April has 30 days
  assert.equal(clampDayToMonth(15, 6, 2025), 15); // valid day unchanged
  assert.equal(clampDayToMonth(0, 6, 2025), 1); // floor at 1
});

test('isOverdue: clearly past periods are overdue, future periods are not', () => {
  assert.equal(isOverdue({ month: 1, year: 2000, feeDueDay: 5 }), true);
  assert.equal(isOverdue({ month: 1, year: 2100, feeDueDay: 5 }), false);
});

test('daysUntilDue is positive for future due dates and negative for past', () => {
  assert.ok(daysUntilDue({ month: 1, year: 2100, feeDueDay: 5 }) > 0);
  assert.ok(daysUntilDue({ month: 1, year: 2000, feeDueDay: 5 }) < 0);
});

test('daysUntilDue returns the exact day offset relative to today (IST)', () => {
  const { year, month, day } = nowInIST();
  // A due date exactly 3 days from today (Date.UTC handles month rollover).
  const future = new Date(Date.UTC(year, month - 1, day + 3));
  const diff = daysUntilDue({
    month: future.getUTCMonth() + 1,
    year: future.getUTCFullYear(),
    feeDueDay: future.getUTCDate(),
  });
  assert.equal(diff, 3);
});
