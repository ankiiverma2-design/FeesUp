import { monthLabel } from '../lib/format';

export default function MonthSwitcher({ month, year, onChange }) {
  const go = (delta) => {
    let m = month + delta;
    let y = year;
    if (m < 1) {
      m = 12;
      y -= 1;
    } else if (m > 12) {
      m = 1;
      y += 1;
    }
    onChange({ month: m, year: y });
  };

  return (
    <div className="flex items-center gap-2">
      <button className="btn-ghost px-3 py-1.5" onClick={() => go(-1)} aria-label="Previous month">
        ‹
      </button>
      <span className="min-w-[9rem] text-center text-sm font-semibold">
        {monthLabel(month, year)}
      </span>
      <button className="btn-ghost px-3 py-1.5" onClick={() => go(1)} aria-label="Next month">
        ›
      </button>
    </div>
  );
}
