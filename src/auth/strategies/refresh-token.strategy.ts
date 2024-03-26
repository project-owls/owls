import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";

@Injectable()
// refreshToken 검증
export class RefreshTokenStrategy extends PassportStrategy(Strategy, 'refreshToken') {
  constructor() {
    super({
      secretOrKey: process.env.REFRESH_TOKEN_SECRET,
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    })
  }

  // 검증 후 return 데이터
  validate(payload) {
    return { userId: payload.userId.userId };
  }

}