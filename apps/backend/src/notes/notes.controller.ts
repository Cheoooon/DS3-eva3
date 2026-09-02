import {
  Controller,
  Post,
  Body,
  Patch,
  Delete,
  Param,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';
import { NotesService } from './notes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Role } from '@prisma/client';

const multerConfig = {
  storage: diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = './uploads';
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = extname(file.originalname);
      cb(null, `${uniqueSuffix}${ext}`);
    },
  }),
  limits: {
    fileSize: 20 * 1024 * 1024, // 20 MB max
  },
};

@Controller('notes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotesController {
  constructor(private notesService: NotesService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file', multerConfig))
  async create(
    @Request() req: { user: { userId: string; role: Role } },
    @Body() body: { practiceId: string; content: string },
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.notesService.create(
      body.practiceId,
      req.user.userId,
      req.user.role,
      body.content,
      false,
      file
        ? {
            fileName: file.originalname,
            fileUrl: `/uploads/${file.filename}`,
            fileType: file.mimetype,
          }
        : undefined,
    );
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Request() req: { user: { userId: string; role: Role } },
    @Body() body: { content: string },
  ) {
    return this.notesService.update(id, body.content, req.user.userId, req.user.role);
  }

  @Delete(':id')
  async delete(
    @Param('id') id: string,
    @Request() req: { user: { userId: string; role: Role } },
  ) {
    return this.notesService.delete(id, req.user.userId, req.user.role);
  }
}
