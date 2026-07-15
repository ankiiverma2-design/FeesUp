const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { asyncHandler } = require('../utils/asyncHandler');
const { onboardingSchema } = require('../validators/schemas');
const tutorService = require('../services/tutorService');

const router = express.Router();
router.use(requireAuth);

/**
 * PATCH /api/tutor/profile
 * Update onboarding / profile details (name, phone, PAN, bank account, IFSC).
 */
router.patch(
  '/profile',
  validate(onboardingSchema),
  asyncHandler(async (req, res) => {
    const tutor = await tutorService.updateProfile(req.tutor.id, req.body);
    res.json({ tutor });
  })
);

module.exports = router;
