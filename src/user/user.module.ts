import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { PrismaService } from 'src/prisma.service';
import { AccessTokenStrategy } from 'src/auth/strategies/access-token.strategy';

@Module({
  controllers: [UserController],
  providers: [UserService, PrismaService, AccessTokenStrategy],
  exports: [UserService]
})
export class UserModule {}
