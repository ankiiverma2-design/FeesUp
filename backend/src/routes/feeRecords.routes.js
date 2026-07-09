const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { asyncHandler } = require('../utils/asyncHandler');
const { updateFeeStatusSchema } = require('../validators/schemas');
const { prisma } = require('../lib/prisma');
const { ApiError } = require('../utils/errors');

const router = express.Router();
router.use(requireAuth);

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
