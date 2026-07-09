const { prisma } = require('../lib/prisma');
const { currentPeriod, isOverdue } = require('../lib/time');

/**
 * Derive the display status for a fee record.
 * Stored status is PENDING | PAID; OVERDUE is computed from the due date (IST).
 */
function deriveStatus(record, student) {
  if (record.status === 'PAID') return 'PAID';
  const overdue = isOverdue({
    month: record.month,
    year: record.year,
    feeDueDay: student.feeDueDay,
  });
  return overdue ? 'OVERDUE' : 'PENDING';
}

/**
 * Ensure a fee record exists for a student in the given period. Idempotent thanks to the
 * unique (studentId, month, year) constraint. The amount snapshots the student's current fee.
 */
async function ensureFeeRecord(student, month, year) {
  return prisma.feeRecord.upsert({
    where: {
      studentId_month_year: { studentId: student.id, month, year },
    },
    update: {}, // never overwrite an existing record (preserves paid history + amount)
    create: {
      studentId: student.id,
      tutorId: student.tutorId,
      month,
      year,
      amount: student.monthlyFee,
      status: 'PENDING',
    },
  });
}

/**
 * Generate fee records for all active students of a tutor for a period.
 * Returns the number of records that now exist (created or pre-existing).
 */
async function generateForTutor(tutorId, month, year) {
  const students = await prisma.student.findMany({
    where: { tutorId, isActive: true },
  });
  await Promise.all(students.map((s) => ensureFeeRecord(s, month, year)));
  return students.length;
}

/**
 * Job entry point: generate current (or specified) period records for every tutor's
 * active students. Used by the scheduled /internal/jobs/generate-fee-records endpoint.
 */
async function generateForAll(month, year) {
  const period = month && year ? { month, year } : currentPeriod();
  const students = await prisma.student.findMany({ where: { isActive: true } });
  await Promise.all(students.map((s) => ensureFeeRecord(s, period.month, period.year)));
  return { month: period.month, year: period.year, studentsProcessed: students.length };
}

module.exports = { deriveStatus, ensureFeeRecord, generateForTutor, generateForAll };
