// Formatting helpers for building human-readable reminder messages.

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** Format integer paise as Indian Rupees, e.g. 200000 -> "₹2,000". */
function formatPaise(paise) {
  const rupees = (paise || 0) / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: rupees % 1 === 0 ? 0 : 2,
  }).format(rupees);
}

function monthLabel(month, year) {
  return `${MONTHS[month - 1]} ${year}`;
}

module.exports = { formatPaise, monthLabel, MONTHS };
