import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const password = '$2b$10$aUsqYTW96zg7.uBvfyoBn.RIy5aukupRFoCTMmDem7XTjt3I1r9CK';

  // Seed Users
  const admin = await prisma.user.upsert({
    where: { id: 'a0000000-0000-0000-0000-000000000001' },
    update: { password },
    create: {
      id: 'a0000000-0000-0000-0000-000000000001',
      email: 'admin@sistema.cl',
      password,
      role: 'ADMIN',
    },
  });

  const teacher = await prisma.user.upsert({
    where: { id: 't0000000-0000-0000-0000-000000000001' },
    update: { password },
    create: {
      id: 't0000000-0000-0000-0000-000000000001',
      email: 'profe@sistema.cl',
      password,
      role: 'TEACHER',
    },
  });

  const student = await prisma.user.upsert({
    where: { id: 's0000000-0000-0000-0000-000000000001' },
    update: { password },
    create: {
      id: 's0000000-0000-0000-0000-000000000001',
      email: 'alumno@sistema.cl',
      password,
      role: 'STUDENT',
    },
  });

  // Seed Profiles
  await prisma.teacherProfile.upsert({
    where: { id: 'tp0000000000000000000000000000001' },
    update: {},
    create: {
      id: 'tp0000000000000000000000000000001',
      userId: teacher.id,
      firstName: 'Profesor',
      lastName: 'Guía',
      department: 'Ingeniería',
    },
  });

  await prisma.studentProfile.upsert({
    where: { id: 'sp0000000000000000000000000000001' },
    update: {},
    create: {
      id: 'sp0000000000000000000000000000001',
      userId: student.id,
      firstName: 'Estudiante',
      lastName: 'Ejemplo',
      enrollmentCode: '2026001',
      career: 'Ingeniería Informática',
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
