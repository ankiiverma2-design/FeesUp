const STYLES = {
  PAID: 'bg-status-paid/15 text-status-paid border-status-paid/30',
  OVERDUE: 'bg-status-overdue/15 text-status-overdue border-status-overdue/30',
  PENDING: 'bg-status-pending/15 text-status-pending border-status-pending/30',
};

const LABELS = { PAID: 'Paid', OVERDUE: 'Overdue', PENDING: 'Pending' };

export default function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STYLES[status]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {LABELS[status]}
    </span>
  );
}
