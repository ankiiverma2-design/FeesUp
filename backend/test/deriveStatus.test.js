const { test } = require('node:test');
const assert = require('node:assert/strict');

process.env.DATABASE_URL =
  process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/feesup_test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'unit-test-jwt-secret-32chars!!';

const { deriveStatus } = require('../src/services/feeRecordService');

test('deriveStatus returns PAID when stored status is PAID', () => {
  assert.equal(deriveStatus({ status: 'PAID', month: 1, year: 2020 }, { feeDueDay: 5 }), 'PAID');
});

test('deriveStatus returns OVERDUE for an unpaid past period', () => {
  assert.equal(
    deriveStatus({ status: 'PENDING', month: 1, year: 2020 }, { feeDueDay: 5 }),
    'OVERDUE'
  );
});

test('deriveStatus returns PENDING for an unpaid far-future period', () => {
  assert.equal(
    deriveStatus({ status: 'PENDING', month: 12, year: 2099 }, { feeDueDay: 5 }),
    'PENDING'
  );
});
