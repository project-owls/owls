import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { BoardModule } from './board/board.module';
import { CommentModule } from './comment/comment.module';
import { EventModule } from './event/event.module';
import { RoomModule } from './room/room.module';
import { DmModule } from './dm/dm.module';

@Module({
  imports: [AuthModule, UserModule, BoardModule, CommentModule, EventModule, RoomModule, DmModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
