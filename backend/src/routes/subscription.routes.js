const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { asyncHandler } = require('../utils/asyncHandler');
const subscriptionService = require('../services/subscriptionService');

const router = express.Router();
router.use(requireAuth);

// GET /api/subscription — current plan, usage, and available plans.
router.get(
  '/',
  asyncHandler(async (req, res) => {
    res.json(await subscriptionService.getStatus(req.tutor.id));
  })
);

// POST /api/subscription/upgrade — move to Pro (unlimited students).
router.post(
  '/upgrade',
  asyncHandler(async (req, res) => {
    res.json(await subscriptionService.upgrade(req.tutor.id));
  })
);

// POST /api/subscription/cancel — downgrade to Free.
router.post(
  '/cancel',
  asyncHandler(async (req, res) => {
    res.json(await subscriptionService.cancel(req.tutor.id));
  })
);

module.exports = router;
