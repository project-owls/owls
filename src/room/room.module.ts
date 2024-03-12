import { Module } from '@nestjs/common';
import { RoomService } from './room.service';
import { RoomController } from './room.controller';
import { PrismaService } from 'src/prisma.service';
import { EventModule } from 'src/event/event.module';

@Module({
  imports: [EventModule],
  controllers: [RoomController],
  providers: [RoomService, PrismaService],
})
export class RoomModule {}
