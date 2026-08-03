const { test } = require('node:test');
const assert = require('node:assert/strict');
const { isAllowedOrigin } = require('../src/lib/cors');

test('allows requests with no Origin header', () => {
  assert.equal(isAllowedOrigin(undefined, ['https://app.example.com']), true);
  assert.equal(isAllowedOrigin(null, ['https://app.example.com']), true);
});

test('exact origin match', () => {
  assert.equal(isAllowedOrigin('https://app.example.com', ['https://app.example.com']), true);
  assert.equal(isAllowedOrigin('https://evil.example.com', ['https://app.example.com']), false);
});

test('wildcard subdomain match', () => {
  const allowed = ['*.lovableproject.com'];
  assert.equal(isAllowedOrigin('https://preview.lovableproject.com', allowed), true);
  assert.equal(isAllowedOrigin('https://foo.bar.lovableproject.com', allowed), true);
  assert.equal(isAllowedOrigin('https://lovableproject.com.evil.com', allowed), false);
});

test('star allows everything', () => {
  assert.equal(isAllowedOrigin('https://anything.test', ['*']), true);
});
