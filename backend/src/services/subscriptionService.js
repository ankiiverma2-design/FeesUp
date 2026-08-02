const { prisma } = require('../lib/prisma');
const { ApiError } = require('../utils/errors');
const { PLANS } = require('../config/plans');
const { env } = require('../config/env');
const { paymentProvider } = require('../providers');
const { currentPeriod } = require('../lib/time');

/** Current plan + usage for a tutor. */
async function getStatus(tutorId) {
  const tutor = await prisma.tutor.findUnique({ where: { id: tutorId } });
  if (!tutor) throw ApiError.notFound('Tutor not found');
  const plan = PLANS[tutor.subscriptionPlan] || PLANS.FREE;
  const studentCount = await prisma.student.count({ where: { tutorId, isActive: true } });
  return {
    plan: plan.id,
    planName: plan.name,
    price: plan.price,
    status: tutor.subscriptionStatus,
    studentLimit: plan.studentLimit,
    studentCount,
    plans: Object.values(PLANS),
  };
}

/**
 * Activate Pro immediately (used in mock/dev so Settings works without a webhook).
 */
async function activatePro(tutorId) {
  await prisma.tutor.update({
    where: { id: tutorId },
    data: { subscriptionPlan: 'PRO', subscriptionStatus: 'ACTIVE' },
  });
  return getStatus(tutorId);
}

/**
 * Upgrade to Pro.
 *
 * - mock provider: activates immediately (local/demo DX).
 * - razorpay (and other live providers): creates a Payment Link for ₹199; plan flips to Pro
 *   only when the `payment_link.paid` webhook arrives with purpose=subscription.
 */
async function upgrade(tutorId) {
  const tutor = await prisma.tutor.findUnique({ where: { id: tutorId } });
  if (!tutor) throw ApiError.notFound('Tutor not found');
  if (tutor.subscriptionPlan === 'PRO') throw ApiError.badRequest('Already on the Pro plan');

  // Offline / mock: activate now so the free-tier cap can be tested end-to-end.
  if (env.paymentProvider === 'mock') {
    const status = await activatePro(tutorId);
    return { ...status, activated: true };
  }

  const period = currentPeriod();
  // Unique per tutor + calendar month so retries in the same month reuse the reference.
  const referenceId = `sub_${tutorId.replace(/-/g, '').slice(0, 20)}_${period.year}${String(period.month).padStart(2, '0')}`;

  const { id, shortUrl } = await paymentProvider.createPaymentLink({
    purpose: 'subscription',
    referenceId,
    tutorId,
    amount: PLANS.PRO.price,
    description: 'FeesUp Pro — monthly subscription',
    customer: {
      name: tutor.name,
      contact: tutor.phone || undefined,
      email: tutor.email,
    },
    notes: {
      purpose: 'subscription',
      tutorId,
      plan: 'PRO',
      amount: String(PLANS.PRO.price),
    },
  });

  const status = await getStatus(tutorId);
  return {
    ...status,
    activated: false,
    paymentLink: shortUrl,
    razorpayPaymentLinkId: id,
  };
}

/** Cancel/downgrade to Free. Existing students are kept; new adds beyond the cap are blocked. */
async function cancel(tutorId) {
  await prisma.tutor.update({
    where: { id: tutorId },
    data: { subscriptionPlan: 'FREE', subscriptionStatus: 'ACTIVE' },
  });
  return getStatus(tutorId);
}

module.exports = { getStatus, upgrade, cancel, activatePro };
