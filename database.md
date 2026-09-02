// Prisma Schema - Copiar directamente en /prisma/schema.prisma

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Role {
  ADMIN
  TEACHER
  STUDENT
}

enum PracticeStatus {
  IN_PROGRESS
  FINISHED
}

model User {
  id           String          @id @default(uuid())
  email        String          @unique
  password     String
  role         Role
  createdAt    DateTime        @default(now())
  updatedAt    DateTime        @updatedAt

  studentProfile StudentProfile?
  teacherProfile TeacherProfile?

  studentPractices Practice[]  @relation("StudentPractices")
  teacherPractices Practice[]  @relation("TeacherPractices")
  
  notes        Note[]
}

model StudentProfile {
  id             String   @id @default(uuid())
  userId         String   @unique
  user           User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  firstName      String
  lastName       String
  enrollmentCode String   @unique
  career         String
}

model TeacherProfile {
  id         String   @id @default(uuid())
  userId     String   @unique
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  firstName  String
  lastName   String
  department String
}

model Practice {
  id          String         @id @default(uuid())
  status      PracticeStatus @default(IN_PROGRESS)
  title       String
  description String?        @db.Text
  
  studentId   String
  student     User           @relation("StudentPractices", fields: [studentId], references: [id])

  teacherId   String?
  teacher     User?          @relation("TeacherPractices", fields: [teacherId], references: [id])

  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt

  notes       Note[]
}

model Note {
  id         String   @id @default(uuid())
  practiceId String
  practice   Practice @relation(fields: [practiceId], references: [id], onDelete: Cascade)
  
  authorId   String?
  author     User?    @relation(fields: [authorId], references: [id])

  isSystem   Boolean  @default(false)
  content    String   @db.Text

  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  attachments NoteAttachment[]
}

model NoteAttachment {
  id         String   @id @default(uuid())
  noteId     String
  note       Note     @relation(fields: [noteId], references: [id], onDelete: Cascade)
  fileName   String
  fileUrl    String
  fileType   String
  uploadedAt DateTime @default(now())
}
