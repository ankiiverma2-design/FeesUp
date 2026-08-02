import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, apiErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { formatPaise } from '../lib/format';
import Logo from '../components/Logo';

export default function Settings() {
  const { tutor, refreshTutor } = useAuth();
  const [profile, setProfile] = useState({
    name: '', phone: '', panNumber: '', bankAccount: '', ifsc: '',
  });
  const [sub, setSub] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);

  const flash = (msg) => {
    setNotice(msg);
    setTimeout(() => setNotice(''), 2500);
  };

  useEffect(() => {
    if (tutor) {
      setProfile({
        name: tutor.name || '',
        phone: tutor.phone || '',
        panNumber: tutor.panNumber || '',
        bankAccount: tutor.bankAccount || '',
        ifsc: tutor.ifsc || '',
      });
    }
  }, [tutor]);

  const loadSub = async () => {
    try {
      const { data } = await api.get('/api/subscription');
      setSub(data);
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  };

  useEffect(() => {
    loadSub();
  }, []);

  const onChange = (e) => setProfile({ ...profile, [e.target.name]: e.target.value });

  // Only send non-empty fields (all are optional on the backend).
  const saveProfile = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    const payload = Object.fromEntries(
      Object.entries(profile).filter(([, v]) => v !== '' && v != null)
    );
    try {
      await api.patch('/api/tutor/profile', payload);
      await refreshTutor();
      flash('Profile saved');
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const changePlan = async (action) => {
    setBusy(true);
    setError('');
    try {
      const { data } = await api.post(`/api/subscription/${action}`);
      setSub(data);
      if (action === 'upgrade') {
        if (data.paymentLink) {
          flash('Payment link ready — complete payment to activate Pro');
          window.open(data.paymentLink, '_blank', 'noopener,noreferrer');
        } else if (data.activated) {
          flash('Upgraded to Pro');
        } else {
          flash('Upgrade started');
        }
      } else {
        flash('Switched to Free');
      }
      await refreshTutor();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen">
      <header className="border-b border-brand-border">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <Logo />
          <Link to="/" className="btn-ghost px-3 py-1.5 text-xs">← Dashboard</Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold">Settings</h1>

        {error && (
          <div className="mb-4 rounded-lg border border-status-overdue/40 bg-status-overdue/10 px-3 py-2 text-sm text-status-overdue">
            {error}
          </div>
        )}
        {notice && (
          <div className="mb-4 rounded-lg border border-brand-accent/40 bg-brand-accent/10 px-3 py-2 text-sm text-brand-accent">
            {notice}
          </div>
        )}

        {/* Billing / plan */}
        <section className="card mb-6">
          <h2 className="mb-1 text-lg font-bold">Plan &amp; billing</h2>
          <p className="mb-4 text-sm text-white/50">
            Free covers up to 10 students. Upgrade to Pro for unlimited students.
          </p>

          {sub && (
            <>
              <div className="mb-4 flex flex-wrap items-center gap-4">
                <div className="rounded-lg border border-brand-border px-4 py-2">
                  <div className="text-xs uppercase tracking-wide text-white/40">Current plan</div>
                  <div className="text-lg font-bold text-brand-accent">{sub.planName}</div>
                </div>
                <div className="rounded-lg border border-brand-border px-4 py-2">
                  <div className="text-xs uppercase tracking-wide text-white/40">Students</div>
                  <div className="text-lg font-bold">
                    {sub.studentCount}
                    {sub.studentLimit ? ` / ${sub.studentLimit}` : ' / ∞'}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {sub.plans.map((p) => {
                  const current = p.id === sub.plan;
                  return (
                    <div
                      key={p.id}
                      className={`rounded-xl border p-4 ${current ? 'border-brand-accent' : 'border-brand-border'}`}
                    >
                      <div className="flex items-baseline justify-between">
                        <span className="font-bold">{p.name}</span>
                        <span className="text-sm text-white/60">
                          {p.price ? `${formatPaise(p.price)}/mo` : 'Free'}
                        </span>
                      </div>
                      <ul className="mt-2 space-y-1 text-xs text-white/50">
                        {p.features.map((f) => (
                          <li key={f}>• {f}</li>
                        ))}
                      </ul>
                      <div className="mt-3">
                        {current ? (
                          <span className="text-xs font-semibold text-brand-accent">Current plan</span>
                        ) : p.id === 'PRO' ? (
                          <button className="btn-primary w-full text-xs" disabled={busy}
                            onClick={() => changePlan('upgrade')}>
                            {busy ? '…' : 'Upgrade to Pro'}
                          </button>
                        ) : (
                          <button className="btn-ghost w-full text-xs" disabled={busy}
                            onClick={() => changePlan('cancel')}>
                            {busy ? '…' : 'Switch to Free'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              {sub.paymentLink && sub.plan === 'FREE' && (
                <p className="mt-3 text-xs text-brand-accent">
                  Payment pending.{' '}
                  <a href={sub.paymentLink} target="_blank" rel="noreferrer" className="underline">
                    Open payment link
                  </a>{' '}
                  to activate Pro.
                </p>
              )}
              <p className="mt-3 text-xs text-white/30">
                Mock mode activates Pro immediately. With Razorpay, upgrade creates a ₹199
                Payment Link and Pro unlocks after the paid webhook.
              </p>
            </>
          )}
        </section>

        {/* Onboarding / profile */}
        <section className="card">
          <h2 className="mb-1 text-lg font-bold">Profile &amp; payout details</h2>
          <p className="mb-4 text-sm text-white/50">
            PAN and bank details are collected for compliance and future payouts. Stored securely
            and never shown to parents.
          </p>

          <form onSubmit={saveProfile} className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="name">Name</label>
              <input id="name" name="name" className="input" value={profile.name} onChange={onChange} />
            </div>
            <div>
              <label className="label" htmlFor="phone">Phone</label>
              <input id="phone" name="phone" className="input" value={profile.phone} onChange={onChange}
                placeholder="+919812345678" />
            </div>
            <div>
              <label className="label" htmlFor="panNumber">PAN</label>
              <input id="panNumber" name="panNumber" className="input uppercase" value={profile.panNumber}
                onChange={onChange} placeholder="ABCDE1234F" />
            </div>
            <div>
              <label className="label" htmlFor="ifsc">IFSC</label>
              <input id="ifsc" name="ifsc" className="input uppercase" value={profile.ifsc}
                onChange={onChange} placeholder="HDFC0001234" />
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="bankAccount">Bank account number</label>
              <input id="bankAccount" name="bankAccount" className="input" value={profile.bankAccount}
                onChange={onChange} placeholder="1234567890" />
            </div>
            <div className="sm:col-span-2 flex justify-end">
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Saving…' : 'Save profile'}
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}
