const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { prisma } = require('../lib/prisma');
const { env } = require('../config/env');
const { ApiError } = require('../utils/errors');

const SALT_ROUNDS = 10;

/** Strip sensitive fields before returning a tutor to the client. */
function serializeTutor(tutor) {
  if (!tutor) return null;
  const { passwordHash, ...safe } = tutor;
  return safe;
}

function signToken(tutor) {
  return jwt.sign({ email: tutor.email }, env.jwtSecret, {
    subject: tutor.id,
    expiresIn: env.jwtExpiresIn,
    algorithm: 'HS256',
  });
}

async function signup({ name, email, password }) {
  const normalizedEmail = email.toLowerCase().trim();

  const existing = await prisma.tutor.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    throw ApiError.conflict('An account with this email already exists', 'EMAIL_TAKEN');
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const tutor = await prisma.tutor.create({
    data: { name: name.trim(), email: normalizedEmail, passwordHash },
  });

  return { token: signToken(tutor), tutor: serializeTutor(tutor) };
}

async function login({ email, password }) {
  const normalizedEmail = email.toLowerCase().trim();
  const tutor = await prisma.tutor.findUnique({ where: { email: normalizedEmail } });

  // Constant-ish response regardless of whether the email exists.
  const ok = tutor ? await bcrypt.compare(password, tutor.passwordHash) : false;
  if (!tutor || !ok) {
    throw ApiError.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');
  }

  return { token: signToken(tutor), tutor: serializeTutor(tutor) };
}

async function getById(id) {
  const tutor = await prisma.tutor.findUnique({ where: { id } });
  if (!tutor) throw ApiError.notFound('Tutor not found');
  return serializeTutor(tutor);
}

module.exports = { signup, login, getById, serializeTutor, signToken };
