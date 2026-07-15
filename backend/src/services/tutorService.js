const { prisma } = require('../lib/prisma');
const { serializeTutor } = require('./authService');

/**
 * Update tutor profile / onboarding details (phone, PAN, bank account, IFSC).
 * These are collected for compliance and future Razorpay payouts (Model A / Route).
 */
async function updateProfile(tutorId, data) {
  const patch = {};
  if (data.name !== undefined) patch.name = data.name;
  if (data.phone !== undefined) patch.phone = data.phone;
  if (data.panNumber !== undefined) patch.panNumber = data.panNumber.toUpperCase();
  if (data.bankAccount !== undefined) patch.bankAccount = data.bankAccount;
  if (data.ifsc !== undefined) patch.ifsc = data.ifsc.toUpperCase();
  if (data.razorpayAccountId !== undefined) patch.razorpayAccountId = data.razorpayAccountId;

  const tutor = await prisma.tutor.update({ where: { id: tutorId }, data: patch });
  return serializeTutor(tutor);
}

module.exports = { updateProfile };
