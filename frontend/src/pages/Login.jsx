import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiErrorMessage } from '../api/client';
import { DEMO_LOGIN, showDemoLoginHint } from '../config/auth';
import Logo from '../components/Logo';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const fillDemo = () => {
    setForm({ email: DEMO_LOGIN.email, password: DEMO_LOGIN.password });
    setError('');
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form);
      navigate('/');
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          <Logo />
          <p className="text-sm text-white/50">Collect. Track. Relax.</p>
        </div>

        {showDemoLoginHint() && (
          <div className="mb-4 rounded-xl border border-brand-accent/30 bg-brand-accent/5 p-4 text-sm">
            <p className="font-semibold text-brand-accent">Try the demo account</p>
            <p className="mt-1 text-white/60">
              Email: <span className="text-white">{DEMO_LOGIN.email}</span>
              <br />
              Password: <span className="text-white">{DEMO_LOGIN.password}</span>
            </p>
            <p className="mt-2 text-xs text-white/40">
              Run <code className="text-white/60">cd backend && npm run seed</code> once if this
              account does not exist yet.
            </p>
            <button type="button" className="btn-ghost mt-3 w-full text-xs" onClick={fillDemo}>
              Fill demo credentials
            </button>
          </div>
        )}

        <div className="card">
          <h1 className="mb-1 text-xl font-bold">Welcome back</h1>
          <p className="mb-6 text-sm text-white/50">
            Tutors sign in with email and password. No separate admin login — each tutor only sees
            their own students.
          </p>

          {error && (
            <div className="mb-4 rounded-lg border border-status-overdue/40 bg-status-overdue/10 px-3 py-2 text-sm text-status-overdue">
              {error}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="label" htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="input"
                value={form.email}
                onChange={onChange}
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="label" htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="input"
                value={form.password}
                onChange={onChange}
                placeholder="Your password"
              />
            </div>
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? 'Logging in…' : 'Log in'}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-white/50">
          New to FeesUp?{' '}
          <Link to="/signup" className="font-semibold text-brand-accent hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
