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
import { CacheModule } from '@nestjs/cache-manager';
import { RedisClientOptions } from 'redis';
import * as redisStore from 'cache-manager-redis-store';

@Module({
  imports: [AuthModule, UserModule, BoardModule, CommentModule, EventModule, RoomModule, DmModule, 
    CacheModule.register<RedisClientOptions>({
      isGlobal: true,
      useFactory: async () => ({
        store: redisStore,
        host: 'localhost',
        prot: 6379
      }),
    })
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
