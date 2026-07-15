const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { asyncHandler } = require('../utils/asyncHandler');
const rateLimit = require('express-rate-limit');
const { updateFeeStatusSchema } = require('../validators/schemas');
const { prisma } = require('../lib/prisma');
const { ApiError } = require('../utils/errors');
const paymentService = require('../services/paymentService');
const reminderService = require('../services/reminderService');

const router = express.Router();
router.use(requireAuth);

// Limit manual reminder sends to avoid WhatsApp spam / runaway messaging cost.
const remindLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: 'Too many reminders sent, please slow down' } },
});

/**
 * POST /api/fee-records/:id/payment-link
 * Generate (or return the existing) Razorpay payment link for this fee record.
 */
router.post(
  '/:id/payment-link',
  asyncHandler(async (req, res) => {
    const result = await paymentService.createOrGetLink(req.tutor.id, req.params.id);
    res.json(result);
  })
);

/**
 * POST /api/fee-records/:id/remind
 * Manually send a WhatsApp reminder for this fee record now.
 */
router.post(
  '/:id/remind',
  remindLimiter,
  asyncHandler(async (req, res) => {
    const result = await reminderService.sendReminder({
      tutorId: req.tutor.id,
      feeRecordId: req.params.id,
      manual: true,
    });
    res.json(result);
  })
);

/**
 * PATCH /api/fee-records/:id/status
 * Manual mark paid / pending. Used before the Razorpay webhook integration (Phase 2).
 * When marking PAID manually, records a timestamp and a manual transaction marker.
 */
router.patch(
  '/:id/status',
  validate(updateFeeStatusSchema),
  asyncHandler(async (req, res) => {
    const record = await prisma.feeRecord.findFirst({
      where: { id: req.params.id, tutorId: req.tutor.id },
    });
    if (!record) throw ApiError.notFound('Fee record not found');

    const { status } = req.body;
    const data =
      status === 'PAID'
        ? { status: 'PAID', paidAt: new Date(), transactionId: record.transactionId || 'manual' }
        : { status: 'PENDING', paidAt: null, transactionId: null };

    const updated = await prisma.feeRecord.update({ where: { id: record.id }, data });
    res.json({ feeRecord: updated });
  })
);

module.exports = router;
