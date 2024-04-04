import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  // oauth 로그인 로직
  async OAuthLogin({ socialLoginDto }) {
    let { email, nickname } = socialLoginDto;

    let user = await this.userService.findByEmail( email );

    // 기존 미가입 회원일 경우
    if(!user) {
      const foundUser = await this.userService.findByNickname(nickname);

      // 존재하는 닉네임일 경우 랜덤 숫자 추가 (닉네임 + 랜덤 숫자)
      if (foundUser !== null) {
        nickname = nickname + Math.random().toString(16).substring(2, 8);
      }

      socialLoginDto = { email, nickname }
      
      user = await this.userService.userCreate(
        socialLoginDto,
      );

      // 회원가입시 프로필 이미지는 default.png
      await this.userService.createUserProfileImage(user.id, "uploads\default.png")
    }

    // access, refresh token 발급
    const accessToken = this.generateAccessToken({ userId: user.id });
    const refreshToken = this.generateRefreshToken({ userId: user.id });

    return { accessToken, refreshToken };
  }

  // access toekn 생성
  generateAccessToken(userId: any): string {
    // payload에 들어갈 데이터
    const payload = {
      userId,
    };

    // secret key와 만료일 기입
    const createdAccessToken = this.jwtService.sign(payload, {
      secret: process.env.ACCESS_TOKEN_SECRET,
      expiresIn: 24 * 60 * 60,
    });

    return createdAccessToken;
  }

  // refresh toekn 생성
  generateRefreshToken(userId: any): string {
    // payload에 들어갈 데이터
    const payload = {
      userId,
    };

    // secret key와 만료일 기입
    const createdRefreshToken = this.jwtService.sign(payload, {
      secret: process.env.REFRESH_TOKEN_SECRET,
      expiresIn: 7 * 24 * 60 * 60,
    });

    return createdRefreshToken;
  }
}
