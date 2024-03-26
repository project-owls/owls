import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";

@Injectable()
// accessToken 검증
export class AccessTokenStrategy extends PassportStrategy(Strategy, 'accessToken') {
  constructor() {
    super({
      secretOrKey: process.env.ACCESS_TOKEN_SECRET,
      // 요청 헤더로부터 token 파싱
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    })
  }

  // 검증 후 return 데이터
  validate(payload) {
    return { userId: payload.userId.userId };
  }

}