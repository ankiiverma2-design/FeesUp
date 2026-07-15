// Subscription plans (Model B: platform charges the tutor a monthly subscription).
// Prices in paise. studentLimit = null means unlimited.

const PLANS = {
  FREE: {
    id: 'FREE',
    name: 'Free',
    price: 0,
    studentLimit: 10,
    features: ['Up to 10 students', 'Fee tracking dashboard', 'WhatsApp reminders', 'Payment links'],
  },
  PRO: {
    id: 'PRO',
    name: 'Pro',
    price: 19900, // ₹199 / month
    studentLimit: null, // unlimited
    features: ['Unlimited students', 'Everything in Free', 'Priority support'],
  },
};

module.exports = { PLANS };
