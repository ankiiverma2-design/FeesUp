// Money is stored/returned as integer paise; format to Indian Rupees for display.
export function formatPaise(paise) {
  const rupees = (paise || 0) / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: rupees % 1 === 0 ? 0 : 2,
  }).format(rupees);
}

export function paiseToRupees(paise) {
  return (paise || 0) / 100;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function monthLabel(month, year) {
  return `${MONTHS[month - 1]} ${year}`;
}

export { MONTHS };
