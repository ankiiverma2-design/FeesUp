import { useState } from 'react';
import { api, apiErrorMessage } from '../api/client';
import { paiseToRupees } from '../lib/format';

const EMPTY = { studentName: '', parentName: '', parentWhatsapp: '', monthlyFee: '', feeDueDay: 5 };

/**
 * Modal for creating or editing a student.
 * `student` prop present => edit mode; otherwise create mode.
 */
export default function StudentModal({ student, onClose, onSaved }) {
  const isEdit = !!student;
  const [form, setForm] = useState(
    isEdit
      ? {
          studentName: student.studentName,
          parentName: student.parentName,
          parentWhatsapp: student.parentWhatsapp,
          monthlyFee: paiseToRupees(student.amount ?? student.monthlyFee),
          feeDueDay: student.feeDueDay,
        }
      : EMPTY
  );
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    const payload = {
      studentName: form.studentName,
      parentName: form.parentName,
      parentWhatsapp: form.parentWhatsapp,
      monthlyFee: Number(form.monthlyFee),
      feeDueDay: Number(form.feeDueDay),
    };
    try {
      if (isEdit) {
        await api.patch(`/api/students/${student.studentId || student.id}`, payload);
      } else {
        await api.post('/api/students', payload);
      }
      onSaved();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" onClick={onClose}>
      <div className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold">{isEdit ? 'Edit student' : 'Add student'}</h2>
            <button className="text-white/40 hover:text-white" onClick={onClose} aria-label="Close">
              ✕
            </button>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-status-overdue/40 bg-status-overdue/10 px-3 py-2 text-sm text-status-overdue">
              {error}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="label" htmlFor="studentName">Student name</label>
              <input id="studentName" name="studentName" required className="input"
                value={form.studentName} onChange={onChange} placeholder="Aarav Sharma" />
            </div>
            <div>
              <label className="label" htmlFor="parentName">Parent name</label>
              <input id="parentName" name="parentName" required className="input"
                value={form.parentName} onChange={onChange} placeholder="Rohit Sharma" />
            </div>
            <div>
              <label className="label" htmlFor="parentWhatsapp">Parent WhatsApp</label>
              <input id="parentWhatsapp" name="parentWhatsapp" required className="input"
                value={form.parentWhatsapp} onChange={onChange} placeholder="+919812345678" />
              <p className="mt-1 text-xs text-white/30">International format, e.g. +919812345678</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label" htmlFor="monthlyFee">Monthly fee (₹)</label>
                <input id="monthlyFee" name="monthlyFee" type="number" min="1" step="1" required
                  className="input" value={form.monthlyFee} onChange={onChange} placeholder="2000" />
              </div>
              <div>
                <label className="label" htmlFor="feeDueDay">Due day</label>
                <input id="feeDueDay" name="feeDueDay" type="number" min="1" max="28" required
                  className="input" value={form.feeDueDay} onChange={onChange} />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add student'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
