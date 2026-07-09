const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { asyncHandler } = require('../utils/asyncHandler');
const { createStudentSchema, updateStudentSchema } = require('../validators/schemas');
const studentService = require('../services/studentService');
const { prisma } = require('../lib/prisma');

const router = express.Router();
router.use(requireAuth);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const students = await studentService.list(req.tutor.id);
    res.json({ students });
  })
);

router.post(
  '/',
  validate(createStudentSchema),
  asyncHandler(async (req, res) => {
    // Load the tutor's plan to enforce the free-tier cap.
    const tutor = await prisma.tutor.findUnique({ where: { id: req.tutor.id } });
    const student = await studentService.create(tutor, req.body);
    res.status(201).json({ student });
  })
);

router.patch(
  '/:id',
  validate(updateStudentSchema),
  asyncHandler(async (req, res) => {
    const student = await studentService.update(req.tutor.id, req.params.id, req.body);
    res.json({ student });
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await studentService.softDelete(req.tutor.id, req.params.id);
    res.status(204).send();
  })
);

module.exports = router;
