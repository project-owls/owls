import { Module } from '@nestjs/common';
import { DmService } from './dm.service';
import { DmController } from './dm.controller';
import { PrismaService } from 'src/prisma.service';
import { EventModule } from 'src/event/event.module';

@Module({
  imports: [EventModule],
  controllers: [DmController],
  providers: [DmService, PrismaService],
})
export class DmModule {}
