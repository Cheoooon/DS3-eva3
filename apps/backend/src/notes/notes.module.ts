import { NotesGateway } from './notes.gateway';
import { Module } from '@nestjs/common';
import { NotesService } from './notes.service';
import { NotesController } from './notes.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [NotesController],
  providers: [NotesService, NotesGateway],
  exports: [NotesService, NotesGateway],
})
export class NotesModule {}
