const express = require('express');
const { asyncHandler } = require('../utils/asyncHandler');
const paymentService = require('../services/paymentService');

const router = express.Router();

/**
 * POST /api/webhooks/razorpay
 * Public endpoint (verified by signature, not JWT). Uses a raw body parser because HMAC
 * verification must run against the exact received bytes.
 */
router.post(
  '/razorpay',
  express.raw({ type: '*/*', limit: '1mb' }),
  asyncHandler(async (req, res) => {
    const signature = req.headers['x-razorpay-signature'];
    const eventId = req.headers['x-razorpay-event-id'];
    // req.body is a Buffer here thanks to express.raw.
    const result = await paymentService.handleWebhook(req.body, signature, eventId);
    res.json({ received: true, ...result });
  })
);

module.exports = router;
