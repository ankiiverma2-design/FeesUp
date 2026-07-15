const express = require('express');
const { requireInternalSecret } = require('../middleware/internal');
const { validate } = require('../middleware/validate');
const { asyncHandler } = require('../utils/asyncHandler');
const { generateFeeRecordsSchema } = require('../validators/schemas');
const feeRecordService = require('../services/feeRecordService');
const reminderService = require('../services/reminderService');

const router = express.Router();
router.use(requireInternalSecret);

/**
 * POST /internal/jobs/generate-fee-records
 * Invoked by an external scheduler (e.g. daily/monthly cron) to create fee records for the
 * current period across all tutors. Idempotent.
 */
router.post(
  '/jobs/generate-fee-records',
  validate(generateFeeRecordsSchema),
  asyncHandler(async (req, res) => {
    const result = await feeRecordService.generateForAll(req.body.month, req.body.year);
    res.json({ ok: true, ...result });
  })
);

/**
 * POST /internal/jobs/send-reminders
 * Invoked by a daily cron. Sends the applicable reminder (pre-due / due / overdue) to every
 * active student's unpaid fee record for the current period. Idempotent per reminder type.
 */
router.post(
  '/jobs/send-reminders',
  validate(generateFeeRecordsSchema),
  asyncHandler(async (req, res) => {
    const result = await reminderService.sweepAll(req.body.month, req.body.year);
    res.json({ ok: true, ...result });
  })
);

module.exports = router;
