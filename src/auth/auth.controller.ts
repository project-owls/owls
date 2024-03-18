import { Body, Controller, Get, HttpCode, HttpStatus, Post, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { User } from '../common/decorators/user.decorator';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SocialLoginDto } from 'src/user/dto/social-login.dto';
import { ResponseMsg } from 'src/common/decorators/response-message.decorator';

@Controller('auth')
@ApiTags('AUTH')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) {}

  @Get('kakao')
  @ApiOperation({ 
    summary: '카카오 로그인',
    description: '카카오 API를 이용한 로그인/회원가입'
  })
  @ApiOkResponse({
    description: '성공적으로 카카오 로그인을 했으며 브라우저 쿠키에 access/refresh Token이 저장되었습니다.',
  })
  @UseGuards(AuthGuard('kakao'))
  @HttpCode(HttpStatus.OK)
  @ResponseMsg('성공적으로 카카오 로그인을 했으며 브라우저 쿠키에 access/refresh Token이 저장되었습니다.')
  async kakaoLogin(
    @User() socialLoginDto: SocialLoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken } = await this.authService.OAuthLogin({
      socialLoginDto,
    });

    res.cookie('refreshToken', refreshToken, { httpOnly: true });
    res.cookie('accessToken', accessToken, { httpOnly: true });

    return {
      data: {}
    }
  }

  @Post('test')
  async test(
    @Body() socialLoginDto: SocialLoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken } = await this.authService.OAuthLogin({
      socialLoginDto,
    });

    res.cookie('refreshToken', refreshToken, { httpOnly: true });
    res.cookie('accessToken', accessToken, { httpOnly: true });

    return {
      data: {}
    }
  }

  @Get('google')
  @ApiOperation({ 
    summary: '구글 로그인',
    description: '구글 API를 이용한 로그인/회원가입'
  })
  @ApiOkResponse({
    description: '성공적으로 구글 로그인을 했으며 브라우저 쿠키에 access/refresh Token이 저장되었습니다.',
  })
  @UseGuards(AuthGuard('google'))
  @HttpCode(HttpStatus.OK)
  @ResponseMsg('성공적으로 구글 로그인을 했으며 브라우저 쿠키에 access/refresh Token이 저장되었습니다.')
  async googleLogin(
    @User() socialLoginDto: SocialLoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {

    const { accessToken, refreshToken } = await this.authService.OAuthLogin({
      socialLoginDto,
    });

    res.cookie('refreshToken', refreshToken, { httpOnly: true });
    res.cookie('accessToken', accessToken, { httpOnly: true });

    return {
      data: {}
    }
  }


  @Get('refresh')
  @ApiBearerAuth('JWT')
  @ApiOperation({ 
    summary: 'refresh Token 으로 access Token 재발급',
    description: 'refrsh Token을 이용하여 access Token 재발급'
  })
  @ApiOkResponse({
    description: '성공적으로 access Token이 재발급되었으며 브라우저 쿠키에 저장되었습니다.',
  })
  @UseGuards(AuthGuard('refreshToken'))
  @HttpCode(HttpStatus.OK)
  @ResponseMsg('성공적으로 access Token이 재발급되었으며 브라우저 쿠키에 저장되었습니다.')
  async refresh(@User() user, @Res() res: Response) {
    const newAccessToken = this.authService.generateAccessToken({
      userId: user.userId
    });

    res.clearCookie('refreshToken', { httpOnly: true });
    res.cookie('accessToken', newAccessToken, { httpOnly: true });

    return {
      data: {}
    }
  }

  @Get('logout')
  @ApiOperation({ 
    summary: '로그아웃',
    description: '로그아웃을 하며, 쿠키에 저장된 access/refresh Token 삭제'
  })
  @ApiOkResponse({
    description: '성공적으로 로그아웃되었습니다.',
  })
  @HttpCode(HttpStatus.OK)
  @ResponseMsg('성공적으로 로그아웃되었습니다.')
  async logOut(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('accessToken', { httpOnly: true });
    res.clearCookie('refreshToken', { httpOnly: true });

    return {
      data: {}
    }
  }
}
