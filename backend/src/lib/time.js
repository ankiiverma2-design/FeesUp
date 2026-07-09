// Date helpers. Business logic (due dates, month boundaries) is computed in Asia/Kolkata (IST),
// while all timestamps are stored in UTC by the database.

const IST_OFFSET_MINUTES = 5 * 60 + 30; // UTC+5:30

/** Returns the current date/time components in IST. */
function nowInIST() {
  const now = new Date();
  const istMs = now.getTime() + IST_OFFSET_MINUTES * 60 * 1000;
  const ist = new Date(istMs);
  return {
    year: ist.getUTCFullYear(),
    month: ist.getUTCMonth() + 1, // 1-12
    day: ist.getUTCDate(),
    date: ist,
  };
}

/** Current { month, year } in IST. */
function currentPeriod() {
  const { month, year } = nowInIST();
  return { month, year };
}

/**
 * Clamp a desired day-of-month to a valid day for the given month/year.
 * e.g. day 31 in February becomes 28/29.
 */
function clampDayToMonth(day, month, year) {
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return Math.min(Math.max(day, 1), lastDay);
}

/**
 * Whether a PENDING fee record is overdue, evaluated in IST.
 * Overdue when today (IST) is strictly after the due day of the record's month/year.
 */
function isOverdue({ month, year, feeDueDay }) {
  const { year: ty, month: tm, day: td } = nowInIST();
  const dueDay = clampDayToMonth(feeDueDay, month, year);

  if (ty > year) return true;
  if (ty < year) return false;
  if (tm > month) return true;
  if (tm < month) return false;
  return td > dueDay;
}

module.exports = { nowInIST, currentPeriod, clampDayToMonth, isOverdue };
