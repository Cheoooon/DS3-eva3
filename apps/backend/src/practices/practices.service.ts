import {
  Injectable,
  ForbiddenException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role, PracticeStatus } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';

export interface CreatePracticeData {
  title: string;
  description?: string;
  startDate?: string | Date;
  endDate?: string | Date;
  activitiesDescription?: string;
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyDetails?: string;
  supervisorName?: string;
  supervisorContact?: string;
}

export interface UpdatePracticeData extends Partial<CreatePracticeData> {
  status?: PracticeStatus;
  studentPhone?: string;
  studentCareer?: string;
}

@Injectable()
export class PracticesService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  private get defaultInclude() {
    return {
      student: { include: { studentProfile: true } },
      teacher: { include: { teacherProfile: true } },
      notes: {
        include: {
          author: { include: { studentProfile: true, teacherProfile: true } },
          attachments: true,
        },
        orderBy: { createdAt: 'desc' as const },
      },
    };
  }

  async create(studentId: string, data: CreatePracticeData, teacherId?: string) {
    const activePractice = await this.prisma.practice.findFirst({
      where: {
        studentId,
        status: PracticeStatus.IN_PROGRESS,
      },
    });

    if (activePractice) {
      throw new ConflictException('El estudiante ya tiene una práctica en progreso.');
    }

    return this.prisma.practice.create({
      data: {
        title: data.title,
        description: data.description,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        activitiesDescription: data.activitiesDescription,
        companyName: data.companyName,
        companyAddress: data.companyAddress,
        companyPhone: data.companyPhone,
        companyDetails: data.companyDetails,
        supervisorName: data.supervisorName,
        supervisorContact: data.supervisorContact,
        studentId,
        teacherId,
        status: PracticeStatus.IN_PROGRESS,
      },
      include: this.defaultInclude,
    });
  }

  async findAll(user: { userId: string; role: Role }) {
    if (user.role === Role.ADMIN) {
      return this.prisma.practice.findMany({
        include: this.defaultInclude,
        orderBy: { createdAt: 'desc' },
      });
    }
    if (user.role === Role.TEACHER) {
      return this.prisma.practice.findMany({
        where: { teacherId: user.userId },
        include: this.defaultInclude,
        orderBy: { createdAt: 'desc' },
      });
    }
    return this.prisma.practice.findMany({
      where: { studentId: user.userId },
      include: this.defaultInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const practice = await this.prisma.practice.findUnique({
      where: { id },
      include: this.defaultInclude,
    });
    if (!practice) {
      throw new NotFoundException('Práctica no encontrada.');
    }
    return practice;
  }

  async update(id: string, user: { userId: string; role: Role }, data: UpdatePracticeData) {
    const practice = await this.findOne(id);

    // Regla: El estudiante NO puede editar la práctica después de creada
    if (user.role === Role.STUDENT) {
      throw new ForbiddenException('El estudiante no tiene permisos para editar la práctica.');
    }

    // Regla: El docente sólo puede editar si es el profesor asignado a la práctica
    if (user.role === Role.TEACHER && practice.teacherId !== user.userId) {
      throw new ForbiddenException('Solo el profesor asignado a esta práctica puede modificarla.');
    }

    // Regla: El profesor asignado NO puede editar los datos personales del estudiante (solo ver). Solo ADMIN puede.
    if (user.role === Role.ADMIN && (data.studentPhone || data.studentCareer)) {
      await this.prisma.studentProfile.updateMany({
        where: { userId: practice.studentId },
        data: {
          phone: data.studentPhone || undefined,
          career: data.studentCareer || undefined,
        },
      });
    }

    const updated = await this.prisma.practice.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        activitiesDescription: data.activitiesDescription,
        companyName: data.companyName,
        companyAddress: data.companyAddress,
        companyPhone: data.companyPhone,
        companyDetails: data.companyDetails,
        supervisorName: data.supervisorName,
        supervisorContact: data.supervisorContact,
        status: data.status,
      },
      include: this.defaultInclude,
    });

    if (data.status && data.status !== practice.status) {
      this.eventEmitter.emit('practice.statusChanged', { practiceId: id, status: data.status });
    }

    return updated;
  }

  async assignTeacher(practiceId: string, teacherId: string) {
    return this.prisma.practice.update({
      where: { id: practiceId },
      data: { teacherId },
      include: this.defaultInclude,
    });
  }

  async removeTeacher(practiceId: string, userRole: Role) {
    if (userRole !== Role.ADMIN) {
      throw new ForbiddenException('Solo el administrador puede desasignar profesores.');
    }
    return this.prisma.practice.update({
      where: { id: practiceId },
      data: { teacherId: null },
      include: this.defaultInclude,
    });
  }

  async updateStatus(id: string, status: PracticeStatus) {
    const practice = await this.prisma.practice.update({
      where: { id },
      data: { status },
      include: this.defaultInclude,
    });
    this.eventEmitter.emit('practice.statusChanged', { practiceId: id, status });
    return practice;
  }
}
