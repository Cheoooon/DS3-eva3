import { NotesGateway } from './notes.gateway';
import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
import { OnEvent } from '@nestjs/event-emitter';

export interface NoteAttachmentData {
  fileName: string;
  fileUrl: string;
  fileType: string;
}

@Injectable()
export class NotesService {
  constructor(private prisma: PrismaService, private notesGateway: NotesGateway) {}

  @OnEvent('practice.statusChanged')
  async handleStatusChanged(payload: { practiceId: string; status: string }) {
    const statusMap: Record<string, string> = {
      IN_PROGRESS: 'En Progreso',
      FINISHED: 'Finalizada',
    };
    const spanishStatus = statusMap[payload.status] || payload.status;
    await this.create(
      payload.practiceId,
      '',
      `La práctica ha cambiado de estado a ${spanishStatus}`,
      true,
    );
  }

  @OnEvent('practice.teacherAssigned')
  async handleTeacherAssigned(payload: { practiceId: string; teacherId: string }) {
    const teacher = await this.prisma.user.findUnique({
      where: { id: payload.teacherId },
      include: { teacherProfile: true },
    });
    const teacherName = teacher?.teacherProfile
      ? `${teacher.teacherProfile.firstName} ${teacher.teacherProfile.lastName}`
      : teacher?.email || 'Desconocido';

    await this.create(
      payload.practiceId,
      '',
      `Se ha asignado al docente ${teacherName} a esta práctica.`,
      true,
    );
  }

  @OnEvent('practice.teacherRemoved')
  async handleTeacherRemoved(payload: { practiceId: string }) {
    await this.create(
      payload.practiceId,
      '',
      `Se ha desasignado al docente de esta práctica.`,
      true,
    );
  }
  // Método auxiliar para no romper los eventos de OnEvent existentes que llaman a create
  async create(
    practiceId: string,
    authorId: string,
    content: string,
    isSystem = false,
    attachment?: NoteAttachmentData,
  ) {
    const practice = await this.prisma.practice.findUnique({ where: { id: practiceId } });
    if (!practice) throw new NotFoundException('Práctica no encontrada');
    if (!isSystem && practice.status === 'FINISHED') {
      throw new ForbiddenException('No se pueden agregar notas a una práctica finalizada');
    }

    const note = await this.prisma.note.create({
      data: {
        content,
        isSystem,
        practiceId,
        authorId: isSystem ? undefined : authorId,
        attachments: attachment
          ? {
              create: {
                fileName: attachment.fileName,
                fileUrl: attachment.fileUrl,
                fileType: attachment.fileType,
              },
            }
          : undefined,
      },
      include: {
        author: {
          include: { studentProfile: true, teacherProfile: true },
        },
        attachments: true,
      },
    });
    this.notesGateway.notifyNoteCreated(practiceId, note);
    return note;
  }

  async update(noteId: string, content: string, userId: string, role: Role) {
    const note = await this.prisma.note.findUnique({ where: { id: noteId } });
    if (!note) throw new NotFoundException('Nota no encontrada');

    if (role === Role.STUDENT) {
      if (note.isSystem) throw new ForbiddenException('No puede editar notas del sistema');
      if (note.authorId !== userId) throw new ForbiddenException('No puede editar notas ajenas');

      const now = new Date();
      const limit = new Date(note.createdAt.getTime() + 5 * 60 * 1000);
      if (now > limit) throw new ForbiddenException('El tiempo de edición (5 min) ha expirado');
    }

    return this.prisma.note.update({
      where: { id: noteId },
      data: { content },
      include: {
        author: {
          include: { studentProfile: true, teacherProfile: true },
        },
        attachments: true,
      },
    });
  }

  async delete(noteId: string, userId: string, role: Role) {
    const note = await this.prisma.note.findUnique({ where: { id: noteId } });
    if (!note) throw new NotFoundException('Nota no encontrada');

    if (role === Role.STUDENT) {
      if (note.isSystem) throw new ForbiddenException('No puede eliminar notas del sistema');
      if (note.authorId !== userId) throw new ForbiddenException('No puede eliminar notas ajenas');

      const now = new Date();
      const limit = new Date(note.createdAt.getTime() + 5 * 60 * 1000);
      if (now > limit) throw new ForbiddenException('El tiempo de eliminación (5 min) ha expirado');
    }
    return this.prisma.note.delete({ where: { id: noteId } });
  }
}
