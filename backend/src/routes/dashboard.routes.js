const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { asyncHandler } = require('../utils/asyncHandler');
const { monthYearQuerySchema } = require('../validators/schemas');
const { prisma } = require('../lib/prisma');
const { currentPeriod } = require('../lib/time');
const feeRecordService = require('../services/feeRecordService');

const router = express.Router();
router.use(requireAuth);

/**
 * GET /api/dashboard?month=&year=
 * Returns per-student fee status for the period plus summary cards.
 * Fee records for the period are generated on demand if missing.
 */
router.get(
  '/',
  validate(monthYearQuerySchema, 'query'),
  asyncHandler(async (req, res) => {
    const period = req.query.month && req.query.year
      ? { month: req.query.month, year: req.query.year }
      : currentPeriod();

    const tutorId = req.tutor.id;

    // Ensure this period's records exist for all active students.
    await feeRecordService.generateForTutor(tutorId, period.month, period.year);

    const students = await prisma.student.findMany({
      where: { tutorId, isActive: true },
      orderBy: { createdAt: 'asc' },
      include: {
        feeRecords: {
          where: { month: period.month, year: period.year },
          take: 1,
        },
      },
    });

    const rows = students.map((s) => {
      const record = s.feeRecords[0];
      const status = feeRecordService.deriveStatus(record, s);
      return {
        studentId: s.id,
        studentName: s.studentName,
        parentName: s.parentName,
        parentWhatsapp: s.parentWhatsapp,
        feeDueDay: s.feeDueDay,
        feeRecordId: record.id,
        amount: record.amount, // paise
        status, // PAID | PENDING | OVERDUE
        paidAt: record.paidAt,
        transactionId: record.transactionId,
        paymentLink: record.paymentLink,
      };
    });

    const summary = rows.reduce(
      (acc, r) => {
        acc.totalExpected += r.amount;
        if (r.status === 'PAID') acc.totalCollected += r.amount;
        else acc.totalPending += r.amount;
        if (r.status === 'OVERDUE') acc.defaulters += 1;
        return acc;
      },
      { totalExpected: 0, totalCollected: 0, totalPending: 0, defaulters: 0, studentCount: rows.length }
    );

    res.json({ period, summary, rows });
  })
);

module.exports = router;
