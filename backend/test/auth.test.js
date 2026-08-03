const { test } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');

// Auth middleware loads env (which requires DATABASE_URL). Point at a dummy URL for unit tests.
process.env.DATABASE_URL =
  process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/feesup_test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'unit-test-jwt-secret-32chars!!';

const { requireAuth } = require('../src/middleware/auth');
const { env } = require('../src/config/env');

function runAuth(headers) {
  return new Promise((resolve) => {
    const req = { headers };
    requireAuth(req, {}, (err) => resolve({ err, tutor: req.tutor }));
  });
}

test('requireAuth rejects missing Authorization header', async () => {
  const { err } = await runAuth({});
  assert.ok(err);
  assert.equal(err.statusCode, 401);
});

test('requireAuth rejects malformed header', async () => {
  const { err } = await runAuth({ authorization: 'Token abc' });
  assert.ok(err);
  assert.equal(err.statusCode, 401);
});

test('requireAuth accepts a valid HS256 JWT and sets req.tutor from token subject', async () => {
  const token = jwt.sign({ email: 't@example.com' }, env.jwtSecret, {
    subject: 'tutor-uuid-1',
    algorithm: 'HS256',
    expiresIn: '1h',
  });
  const { err, tutor } = await runAuth({ authorization: `Bearer ${token}` });
  assert.equal(err, undefined);
  assert.deepEqual(tutor, { id: 'tutor-uuid-1', email: 't@example.com' });
});

test('requireAuth rejects tokens signed with a different algorithm (alg confusion)', async () => {
  // Forge an unsigned "none" token — verify must reject because algorithms is pinned to HS256.
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ sub: 'evil', email: 'x@y.z' })).toString('base64url');
  const noneToken = `${header}.${payload}.`;
  const { err } = await runAuth({ authorization: `Bearer ${noneToken}` });
  assert.ok(err);
  assert.equal(err.statusCode, 401);
});

test('requireAuth rejects expired tokens', async () => {
  const token = jwt.sign({ email: 't@example.com' }, env.jwtSecret, {
    subject: 'tutor-uuid-1',
    algorithm: 'HS256',
    expiresIn: -10,
  });
  const { err } = await runAuth({ authorization: `Bearer ${token}` });
  assert.ok(err);
  assert.equal(err.statusCode, 401);
});
