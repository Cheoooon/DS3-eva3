import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  PracticesService,
  CreatePracticeData,
  UpdatePracticeData,
} from './practices.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role, PracticeStatus } from '@prisma/client';

@Controller('practices')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PracticesController {
  constructor(private practicesService: PracticesService) {}

  @Post()
  @Roles(Role.STUDENT, Role.ADMIN, Role.TEACHER)
  async create(
    @Request() req: { user: { userId: string; role: Role } },
    @Body() body: CreatePracticeData & { studentId?: string },
  ) {
    const studentId =
      (req.user.role === Role.ADMIN || req.user.role === Role.TEACHER) && body.studentId
        ? body.studentId
        : req.user.userId;
    return this.practicesService.create(studentId, body);
  }

  @Get()
  async findAll(@Request() req: { user: { userId: string; role: Role } }) {
    return this.practicesService.findAll(req.user);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.practicesService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.TEACHER, Role.ADMIN)
  async update(
    @Param('id') id: string,
    @Request() req: { user: { userId: string; role: Role } },
    @Body() body: UpdatePracticeData,
  ) {
    return this.practicesService.update(id, req.user, body);
  }

  @Patch(':id/status')
  @Roles(Role.TEACHER, Role.ADMIN)
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: PracticeStatus },
  ) {
    return this.practicesService.updateStatus(id, body.status);
  }

  @Patch(':id/assign')
  @Roles(Role.TEACHER, Role.ADMIN)
  async assignTeacher(
    @Param('id') id: string,
    @Request()
    req: {
      user: { userId: string; role: Role };
      body: { teacherId?: string };
    },
  ) {
    const teacherId =
      req.user.role === Role.ADMIN
        ? req.body.teacherId || req.user.userId
        : req.user.userId;
    return this.practicesService.assignTeacher(id, teacherId);
  }

  @Patch(':id/remove-teacher')
  @Roles(Role.ADMIN)
  async removeTeacher(
    @Param('id') id: string,
    @Request() req: { user: { role: Role } },
  ) {
    return this.practicesService.removeTeacher(id, req.user.role);
  }
}
