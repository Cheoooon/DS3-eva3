import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';

export interface UpdateUserDto {
  email?: string;
  password?: string;
  role?: Role;
  firstName?: string;
  lastName?: string;
  enrollmentCode?: string;
  career?: string;
  department?: string;
  phone?: string;
}

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findOne(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: {
        studentProfile: true,
        teacherProfile: true,
      },
    });
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        studentProfile: true,
        teacherProfile: true,
      },
    });
    if (user) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async findAll(role?: Role) {
    const users = await this.prisma.user.findMany({
      where: role ? { role } : undefined,
      include: {
        studentProfile: true,
        teacherProfile: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return users.map(({ password, ...rest }) => rest);
  }

  async create(dto: CreateUserDto) {
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    return this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        role: dto.role,
        studentProfile:
          dto.role === Role.STUDENT
            ? {
                create: {
                  firstName: dto.firstName,
                  lastName: dto.lastName,
                  enrollmentCode: dto.enrollmentCode || '',
                  career: dto.career || '',
                },
              }
            : undefined,
        teacherProfile:
          dto.role === Role.TEACHER
            ? {
                create: {
                  firstName: dto.firstName,
                  lastName: dto.lastName,
                  department: dto.department || '',
                },
              }
            : undefined,
      },
    });
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        studentProfile: true,
        teacherProfile: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado.');
    }

    const hashedPassword = dto.password
      ? await bcrypt.hash(dto.password, 10)
      : undefined;

    const targetRole = dto.role || user.role;

    // Actualizar datos base del usuario
    await this.prisma.user.update({
      where: { id },
      data: {
        email: dto.email || undefined,
        password: hashedPassword,
        role: dto.role || undefined,
      },
    });

    // Actualizar o crear perfil de estudiante
    if (targetRole === Role.STUDENT) {
      await this.prisma.studentProfile.upsert({
        where: { userId: id },
        create: {
          userId: id,
          firstName: dto.firstName || 'Estudiante',
          lastName: dto.lastName || 'Usuario',
          enrollmentCode: dto.enrollmentCode || `MAT-${Date.now()}`,
          career: dto.career || 'Sin Carrera',
          phone: dto.phone || undefined,
        },
        update: {
          firstName: dto.firstName || undefined,
          lastName: dto.lastName || undefined,
          enrollmentCode: dto.enrollmentCode || undefined,
          career: dto.career || undefined,
          phone: dto.phone !== undefined ? dto.phone : undefined,
        },
      });
    }

    // Actualizar o crear perfil de docente
    if (targetRole === Role.TEACHER) {
      await this.prisma.teacherProfile.upsert({
        where: { userId: id },
        create: {
          userId: id,
          firstName: dto.firstName || 'Docente',
          lastName: dto.lastName || 'Usuario',
          department: dto.department || 'General',
        },
        update: {
          firstName: dto.firstName || undefined,
          lastName: dto.lastName || undefined,
          department: dto.department || undefined,
        },
      });
    }

    return this.findById(id);
  }
}
