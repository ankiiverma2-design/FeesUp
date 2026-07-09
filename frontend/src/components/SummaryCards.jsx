import { formatPaise } from '../lib/format';

function Card({ label, value, accent }) {
  return (
    <div className="card">
      <p className="text-xs font-medium uppercase tracking-wide text-white/50">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${accent || 'text-white'}`}>{value}</p>
    </div>
  );
}

export default function SummaryCards({ summary }) {
  if (!summary) return null;
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <Card label="Expected this month" value={formatPaise(summary.totalExpected)} />
      <Card label="Collected" value={formatPaise(summary.totalCollected)} accent="text-status-paid" />
      <Card label="Pending" value={formatPaise(summary.totalPending)} accent="text-status-pending" />
      <Card label="Defaulters" value={String(summary.defaulters)} accent="text-status-overdue" />
    </div>
  );
}
