const { prisma } = require('../lib/prisma');
const { ApiError } = require('../utils/errors');
const { PLANS } = require('../config/plans');

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
 * Upgrade to Pro.
 * NOTE (Model B): in production this would create a Razorpay Subscription and only flip the
 * plan on the subscription's `activated`/`charged` webhook. Here we activate immediately so the
 * flow is usable end-to-end; the billing integration slots in behind this same method later.
 */
async function upgrade(tutorId) {
  const tutor = await prisma.tutor.findUnique({ where: { id: tutorId } });
  if (!tutor) throw ApiError.notFound('Tutor not found');
  if (tutor.subscriptionPlan === 'PRO') throw ApiError.badRequest('Already on the Pro plan');

  await prisma.tutor.update({
    where: { id: tutorId },
    data: { subscriptionPlan: 'PRO', subscriptionStatus: 'ACTIVE' },
  });
  return getStatus(tutorId);
}

/** Cancel/downgrade to Free. Existing students are kept; new adds beyond the cap are blocked. */
async function cancel(tutorId) {
  await prisma.tutor.update({
    where: { id: tutorId },
    data: { subscriptionPlan: 'FREE', subscriptionStatus: 'ACTIVE' },
  });
  return getStatus(tutorId);
}

module.exports = { getStatus, upgrade, cancel };
