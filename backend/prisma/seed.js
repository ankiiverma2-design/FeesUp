/* Optional seed: creates a demo tutor with a few students so the dashboard has data.
 * Run with: npm run seed  (requires DATABASE_URL and applied migrations)
 */
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const email = 'demo@feesup.app';
  const passwordHash = await bcrypt.hash('password123', 10);

  const tutor = await prisma.tutor.upsert({
    where: { email },
    update: {},
    create: { name: 'Demo Tutor', email, passwordHash, phone: '+919800000000' },
  });

  const demoStudents = [
    { studentName: 'Aarav Sharma', parentName: 'Rohit Sharma', parentWhatsapp: '+919811111111', monthlyFee: 200000, feeDueDay: 5 },
    { studentName: 'Diya Verma', parentName: 'Neha Verma', parentWhatsapp: '+919822222222', monthlyFee: 250000, feeDueDay: 10 },
    { studentName: 'Kabir Singh', parentName: 'Amit Singh', parentWhatsapp: '+919833333333', monthlyFee: 180000, feeDueDay: 1 },
  ];

  for (const s of demoStudents) {
    const existing = await prisma.student.findFirst({
      where: { tutorId: tutor.id, studentName: s.studentName },
    });
    if (!existing) {
      await prisma.student.create({ data: { ...s, tutorId: tutor.id } });
    }
  }

  // eslint-disable-next-line no-console
  console.log(`Seeded demo tutor: ${email} / password123`);
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
