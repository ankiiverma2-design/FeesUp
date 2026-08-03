/** Demo tutor created by `cd backend && npm run seed` — shown on the login page in dev. */
export const DEMO_LOGIN = {
  email: 'demo@feesup.app',
  password: 'password123',
};

export function showDemoLoginHint() {
  return import.meta.env.DEV || import.meta.env.VITE_SHOW_DEMO_LOGIN === 'true';
}
