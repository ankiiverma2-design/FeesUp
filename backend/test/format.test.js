const { test } = require('node:test');
const assert = require('node:assert/strict');
const { formatPaise, monthLabel } = require('../src/lib/format');

test('formatPaise renders whole rupees without decimals', () => {
  const out = formatPaise(200000); // ₹2,000
  assert.match(out, /2,000/);
  assert.doesNotMatch(out, /\.00/);
});

test('formatPaise renders paise as two decimals', () => {
  const out = formatPaise(150050); // ₹1,500.50
  assert.match(out, /1,500\.50/);
});

test('formatPaise handles zero / nullish', () => {
  assert.match(formatPaise(0), /0/);
  assert.match(formatPaise(undefined), /0/);
});

test('monthLabel returns the full month name and year', () => {
  assert.equal(monthLabel(1, 2025), 'January 2025');
  assert.equal(monthLabel(12, 2026), 'December 2026');
});
