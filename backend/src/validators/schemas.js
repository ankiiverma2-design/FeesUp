const { z } = require('zod');

const signupSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120),
  email: z.string().trim().email('A valid email is required'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(200),
});

const loginSchema = z.object({
  email: z.string().trim().email('A valid email is required'),
  password: z.string().min(1, 'Password is required'),
});

// Parent WhatsApp number in E.164 format, e.g. +919812345678
const whatsappSchema = z
  .string()
  .trim()
  .regex(/^\+[1-9]\d{7,14}$/, 'WhatsApp number must be in international format, e.g. +919812345678');

const createStudentSchema = z.object({
  studentName: z.string().trim().min(1, 'Student name is required').max(120),
  parentName: z.string().trim().min(1, 'Parent name is required').max(120),
  parentWhatsapp: whatsappSchema,
  // Amount accepted in rupees from the UI, converted to paise in the controller.
  monthlyFee: z.coerce.number().positive('Monthly fee must be greater than 0').max(1000000),
  feeDueDay: z.coerce.number().int().min(1).max(28).default(5),
});

const updateStudentSchema = createStudentSchema.partial();

const monthYearQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
});

const updateFeeStatusSchema = z.object({
  status: z.enum(['PENDING', 'PAID']),
});

const generateFeeRecordsSchema = z.object({
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
});

module.exports = {
  signupSchema,
  loginSchema,
  createStudentSchema,
  updateStudentSchema,
  monthYearQuerySchema,
  updateFeeStatusSchema,
  generateFeeRecordsSchema,
};
