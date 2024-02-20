import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { KakaoStrategy } from './strategies/social-kakao.strategy';
import { PassportModule } from '@nestjs/passport';
import { RefreshTokenStrategy } from './strategies/refresh-token.strategy';
import { UserModule } from 'src/user/user.module';
import { AccessTokenStrategy } from './strategies/access-token.strategy';

@Module({
  imports: [
    UserModule,
    PassportModule,
    JwtModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, KakaoStrategy, RefreshTokenStrategy],
})
export class AuthModule {}
