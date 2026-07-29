const { test } = require('node:test');
const assert = require('node:assert/strict');

// Integration tests need a real database. They run only when explicitly enabled, so the
// default `npm test` (unit tests) stays fast and DB-free. In CI, the integration job sets
// RUN_INTEGRATION=1 and DATABASE_URL (see .github/workflows/ci.yml).
const ENABLED = process.env.RUN_INTEGRATION === '1' && !!process.env.DATABASE_URL;
const skip = ENABLED ? false : 'set RUN_INTEGRATION=1 and DATABASE_URL to run integration tests';

const json = { 'content-type': 'application/json' };

test('API smoke: auth, tenant isolation, students, dashboard (paise), mark paid', { skip }, async () => {
  // Require lazily so the module (which validates env like DATABASE_URL) is only loaded
  // when the test actually runs.
  const { app } = require('../../src/app');
  const { prisma } = require('../../src/lib/prisma');

  const server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  const base = `http://127.0.0.1:${server.address().port}`;

  try {
    const email = `it_${Date.now()}@example.com`;

    // Signup returns a token + tutor.
    let res = await fetch(`${base}/api/auth/signup`, {
      method: 'POST',
      headers: json,
      body: JSON.stringify({ name: 'Integration Tutor', email, password: 'password123' }),
    });
    assert.equal(res.status, 201);
    const { token } = await res.json();
    assert.ok(token, 'signup should return a token');
    const auth = { ...json, authorization: `Bearer ${token}` };

    // Tenant isolation: no token -> 401.
    res = await fetch(`${base}/api/students`);
    assert.equal(res.status, 401);

    // Create a student; monthlyFee is sent in RUPEES.
    res = await fetch(`${base}/api/students`, {
      method: 'POST',
      headers: auth,
      body: JSON.stringify({
        studentName: 'Aarav',
        parentName: 'Rohit',
        parentWhatsapp: '+919812345678',
        monthlyFee: 2000,
        feeDueDay: 5,
      }),
    });
    assert.equal(res.status, 201);

    // Dashboard should generate this month's fee record; amount is in PAISE.
    res = await fetch(`${base}/api/dashboard`, { headers: auth });
    assert.equal(res.status, 200);
    const dash = await res.json();
    assert.equal(dash.rows.length, 1);
    assert.equal(dash.rows[0].amount, 200000, 'rupees 2000 should be stored as 200000 paise');
    assert.equal(dash.summary.totalExpected, 200000);

    // Mark the fee record paid.
    const feeRecordId = dash.rows[0].feeRecordId;
    res = await fetch(`${base}/api/fee-records/${feeRecordId}/status`, {
      method: 'PATCH',
      headers: auth,
      body: JSON.stringify({ status: 'PAID' }),
    });
    assert.equal(res.status, 200);

    // Dashboard now reflects collected.
    res = await fetch(`${base}/api/dashboard`, { headers: auth });
    const dash2 = await res.json();
    assert.equal(dash2.rows[0].status, 'PAID');
    assert.equal(dash2.summary.totalCollected, 200000);

    // Clean up this test tutor (cascades to students + fee records).
    await prisma.tutor.deleteMany({ where: { email } });
  } finally {
    await new Promise((r) => server.close(r));
    await prisma.$disconnect();
  }
});
