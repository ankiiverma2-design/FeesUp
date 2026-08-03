/**
 * Allow an origin if it matches a configured entry in FRONTEND_ORIGIN. Supports:
 *   - exact match:      https://app.example.com
 *   - wildcard suffix:  *.lovableproject.com  (matches any Lovable preview subdomain)
 *   - "*"               allow all (dev only)
 * Requests without an Origin header (server-to-server, curl) are always allowed.
 */
function isAllowedOrigin(origin, allowedOrigins) {
  if (!origin) return true;
  const allowed = allowedOrigins || [];
  return allowed.some((entry) => {
    if (entry === '*') return true;
    if (entry.startsWith('*.')) return origin.endsWith(entry.slice(1));
    return origin === entry;
  });
}

module.exports = { isAllowedOrigin };
