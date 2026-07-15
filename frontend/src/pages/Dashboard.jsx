import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, apiErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';
import SummaryCards from '../components/SummaryCards';
import MonthSwitcher from '../components/MonthSwitcher';
import StudentTable from '../components/StudentTable';
import StudentModal from '../components/StudentModal';

function currentPeriod() {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
}

export default function Dashboard() {
  const { tutor, logout } = useAuth();
  const [period, setPeriod] = useState(currentPeriod());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [modal, setModal] = useState({ open: false, student: null });

  const flash = (msg) => {
    setNotice(msg);
    setTimeout(() => setNotice(''), 2500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data: res } = await api.get('/api/dashboard', {
        params: { month: period.month, year: period.year },
      });
      setData(res);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleStatus = async (row) => {
    const next = row.status === 'PAID' ? 'PENDING' : 'PAID';
    try {
      await api.patch(`/api/fee-records/${row.feeRecordId}/status`, { status: next });
      load();
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  };

  const getLink = async (row) => {
    setBusyId(row.feeRecordId);
    setError('');
    try {
      await api.post(`/api/fee-records/${row.feeRecordId}/payment-link`);
      flash(`Payment link ready for ${row.studentName}`);
      load();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const remind = async (row) => {
    setBusyId(row.feeRecordId);
    setError('');
    try {
      const { data: res } = await api.post(`/api/fee-records/${row.feeRecordId}/remind`);
      flash(`Reminder sent to ${row.parentName} (${res?.reminderType || 'reminder'})`);
      load();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (row) => {
    if (!window.confirm(`Remove ${row.studentName}? Their fee history is preserved.`)) return;
    try {
      await api.delete(`/api/students/${row.studentId}`);
      load();
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-brand-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Logo />
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-white/50 sm:inline">{tutor?.name}</span>
            <Link to="/settings" className="btn-ghost px-3 py-1.5 text-xs">
              Settings
            </Link>
            <button className="btn-ghost px-3 py-1.5 text-xs" onClick={logout}>
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-sm text-white/50">Track who has paid and who hasn&apos;t.</p>
          </div>
          <div className="flex items-center gap-3">
            <MonthSwitcher month={period.month} year={period.year} onChange={setPeriod} />
            <button className="btn-primary" onClick={() => setModal({ open: true, student: null })}>
              + Add student
            </button>
          </div>
        </div>

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

        <div className="mb-8">
          <SummaryCards summary={data?.summary} />
        </div>

        {loading ? (
          <div className="card text-center text-white/50">Loading…</div>
        ) : (
          <StudentTable
            rows={data?.rows || []}
            period={period}
            busyId={busyId}
            onToggleStatus={toggleStatus}
            onGetLink={getLink}
            onRemind={remind}
            onEdit={(row) => setModal({ open: true, student: row })}
            onDelete={remove}
          />
        )}
      </main>

      {modal.open && (
        <StudentModal
          student={modal.student}
          onClose={() => setModal({ open: false, student: null })}
          onSaved={() => {
            setModal({ open: false, student: null });
            load();
          }}
        />
      )}
    </div>
  );
}
