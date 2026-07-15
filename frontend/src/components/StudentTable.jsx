import { useState } from 'react';
import StatusBadge from './StatusBadge';
import { formatPaise, monthLabel } from '../lib/format';

/** Build a WhatsApp deep link with a prefilled reminder message (manual fallback). */
function waLink(row, period) {
  const number = row.parentWhatsapp.replace(/[^\d]/g, '');
  const amount = formatPaise(row.amount);
  const msg =
    `Hi ${row.parentName}, this is a gentle reminder that ${row.studentName}'s tuition fee ` +
    `of ${amount} for ${monthLabel(period.month, period.year)} is ${row.status === 'OVERDUE' ? 'overdue' : 'due'}.` +
    (row.paymentLink ? ` You can pay here: ${row.paymentLink}` : '') +
    ` Thank you!`;
  return `https://wa.me/${number}?text=${encodeURIComponent(msg)}`;
}

export default function StudentTable({
  rows,
  period,
  busyId,
  onToggleStatus,
  onGetLink,
  onRemind,
  onEdit,
  onDelete,
}) {
  const [copiedId, setCopiedId] = useState(null);

  const copyLink = async (row) => {
    try {
      await navigator.clipboard.writeText(row.paymentLink);
      setCopiedId(row.studentId);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      // Clipboard may be unavailable (e.g. non-HTTPS); ignore silently.
    }
  };

  if (!rows.length) {
    return (
      <div className="card text-center text-white/50">
        No students yet. Click <span className="font-semibold text-brand-accent">Add student</span> to get started.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-brand-border">
      <table className="w-full text-left text-sm">
        <thead className="bg-brand-surface text-xs uppercase tracking-wide text-white/40">
          <tr>
            <th className="px-4 py-3 font-medium">Student</th>
            <th className="px-4 py-3 font-medium">Parent</th>
            <th className="px-4 py-3 font-medium">Fee</th>
            <th className="px-4 py-3 font-medium">Due</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-brand-border">
          {rows.map((row) => {
            const busy = busyId === row.feeRecordId;
            const isPaid = row.status === 'PAID';
            return (
              <tr key={row.studentId} className="hover:bg-brand-surface/50">
                <td className="px-4 py-3">
                  <div className="font-semibold text-white">{row.studentName}</div>
                  <div className="text-xs text-white/40">{row.parentWhatsapp}</div>
                </td>
                <td className="px-4 py-3 text-white/70">{row.parentName}</td>
                <td className="px-4 py-3 font-medium">{formatPaise(row.amount)}</td>
                <td className="px-4 py-3 text-white/70">{row.feeDueDay}th</td>
                <td className="px-4 py-3">
                  <StatusBadge status={row.status} />
                  {isPaid && row.transactionId && (
                    <div className="mt-1 text-[10px] text-white/30">txn: {row.transactionId}</div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center justify-end gap-1.5">
                    <button
                      className="btn-ghost px-2.5 py-1 text-xs"
                      onClick={() => onToggleStatus(row)}
                      title={isPaid ? 'Mark as pending' : 'Mark as paid'}
                    >
                      {isPaid ? 'Unmark' : 'Mark paid'}
                    </button>

                    {!isPaid &&
                      (row.paymentLink ? (
                        <button
                          className="btn-ghost px-2.5 py-1 text-xs"
                          onClick={() => copyLink(row)}
                          title="Copy payment link"
                        >
                          {copiedId === row.studentId ? 'Copied!' : 'Copy link'}
                        </button>
                      ) : (
                        <button
                          className="btn-ghost px-2.5 py-1 text-xs"
                          onClick={() => onGetLink(row)}
                          disabled={busy}
                          title="Generate a Razorpay payment link"
                        >
                          {busy ? '…' : 'Get link'}
                        </button>
                      ))}

                    {!isPaid && (
                      <button
                        className="btn-ghost px-2.5 py-1 text-xs"
                        onClick={() => onRemind(row)}
                        disabled={busy}
                        title="Send WhatsApp reminder now"
                      >
                        Remind
                      </button>
                    )}

                    <a
                      className="btn-ghost px-2.5 py-1 text-xs"
                      href={waLink(row, period)}
                      target="_blank"
                      rel="noreferrer"
                      title="Open WhatsApp with a prefilled message"
                    >
                      WhatsApp
                    </a>
                    <button className="btn-ghost px-2.5 py-1 text-xs" onClick={() => onEdit(row)}>
                      Edit
                    </button>
                    <button className="btn-danger px-2.5 py-1 text-xs" onClick={() => onDelete(row)}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
