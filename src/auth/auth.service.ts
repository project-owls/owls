import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async OAuthLogin({ socialLoginDto }) {
    let { email, nickname } = socialLoginDto;

    let user = await this.userService.findByEmail( email );

    if(!user) {
      const foundUser = await this.userService.findByNickname(nickname);

      if (foundUser !== null) {
        nickname = nickname + Math.random().toString(16).substring(2, 8);
      }

      socialLoginDto = { email, nickname }
      
      user = await this.userService.create(
        socialLoginDto,
      );

      await this.userService.createUserProfileImage(user.id, "uploads\\default.png")
    }

    const accessToken = this.generateAccessToken({ userId: user.id });
    const refreshToken = this.generateRefreshToken({ userId: user.id });

    return { accessToken, refreshToken };
  }

  generateAccessToken(userId: any): string {
    const payload = {
      userId,
    };

    const createdAccessToken = this.jwtService.sign(payload, {
      secret: process.env.ACCESS_TOKEN_SECRET,
      expiresIn: 24 * 60 * 60,
    });

    return createdAccessToken;
  }

  generateRefreshToken(userId: any): string {
    const payload = {
      userId,
    };

    const createdRefreshToken = this.jwtService.sign(payload, {
      secret: process.env.REFRESH_TOKEN_SECRET,
      expiresIn: 7 * 24 * 60 * 60,
    });

    return createdRefreshToken;
  }
}
