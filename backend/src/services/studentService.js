const { prisma } = require('../lib/prisma');
const { ApiError } = require('../utils/errors');

const FREE_TIER_STUDENT_LIMIT = 10;

/** List active students for a tutor. */
function list(tutorId) {
  return prisma.student.findMany({
    where: { tutorId, isActive: true },
    orderBy: { createdAt: 'asc' },
  });
}

/** Fetch a single active student, scoped to the tutor. */
async function getOwned(tutorId, studentId) {
  const student = await prisma.student.findFirst({
    where: { id: studentId, tutorId, isActive: true },
  });
  if (!student) throw ApiError.notFound('Student not found');
  return student;
}

/**
 * Create a student. Enforces the free-tier cap for FREE-plan tutors.
 * `monthlyFee` arrives in rupees and is stored as paise.
 */
async function create(tutor, data) {
  if (tutor.subscriptionPlan === 'FREE') {
    const activeCount = await prisma.student.count({
      where: { tutorId: tutor.id, isActive: true },
    });
    if (activeCount >= FREE_TIER_STUDENT_LIMIT) {
      throw ApiError.forbidden(
        `Free tier is limited to ${FREE_TIER_STUDENT_LIMIT} students. Upgrade to add more.`,
        'FREE_TIER_LIMIT'
      );
    }
  }

  return prisma.student.create({
    data: {
      tutorId: tutor.id,
      studentName: data.studentName,
      parentName: data.parentName,
      parentWhatsapp: data.parentWhatsapp,
      monthlyFee: Math.round(data.monthlyFee * 100),
      feeDueDay: data.feeDueDay ?? 5,
    },
  });
}

/** Update an owned student. Converts monthlyFee (rupees) to paise when present. */
async function update(tutorId, studentId, data) {
  await getOwned(tutorId, studentId);

  const patch = {};
  if (data.studentName !== undefined) patch.studentName = data.studentName;
  if (data.parentName !== undefined) patch.parentName = data.parentName;
  if (data.parentWhatsapp !== undefined) patch.parentWhatsapp = data.parentWhatsapp;
  if (data.monthlyFee !== undefined) patch.monthlyFee = Math.round(data.monthlyFee * 100);
  if (data.feeDueDay !== undefined) patch.feeDueDay = data.feeDueDay;

  return prisma.student.update({ where: { id: studentId }, data: patch });
}

/** Soft-delete an owned student (preserves fee/payment history). */
async function softDelete(tutorId, studentId) {
  await getOwned(tutorId, studentId);
  await prisma.student.update({ where: { id: studentId }, data: { isActive: false } });
}

module.exports = { list, getOwned, create, update, softDelete, FREE_TIER_STUDENT_LIMIT };
