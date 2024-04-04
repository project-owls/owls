import { Body, Controller, Delete, Get, HttpCode, HttpStatus, NotFoundException, Post, Put, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { UserService } from './user.service';
import { AuthGuard } from '@nestjs/passport';
import { User } from 'src/common/decorators/user.decorator';
import { ResponseMsg } from 'src/common/decorators/response-message.decorator';
import { ResponseTransformInterceptor } from 'src/common/interceptors/response-transform.interceptor';
import { UserDto } from 'src/common/dto/user.dto';
import { ApiBearerAuth, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('users')
@ApiTags('USER')
@UseInterceptors(ResponseTransformInterceptor)
export class UserController {
  constructor(
    private userService: UserService,
  ) {}
  
  @Get('current')
  @ApiOperation({ 
    summary: '내 정보 조회',
    description: '액세스토큰을 이용하여 내 정보를 조회합니다.'
  })
  @ApiOkResponse({
    description: '내 정보를 성공적으로 찾았습니다.',
    type: UserDto
  })
  @ApiNotFoundResponse({
    description: '해당 유저가 존재하지 않습니다.'
  })
  @ApiBearerAuth('JWT')
  @UseGuards(AuthGuard('accessToken'))
  @HttpCode(HttpStatus.OK)
  @ResponseMsg('내 정보를 성공적으로 찾았습니다.')
  async getMyData(@User() user) {
    const { userId } = user;

    const foundMyData = await this.userService.findById(userId);

    if (!foundMyData) {
      throw new NotFoundException(
        '해당 유저가 존재하지 않습니다.',
      );
    }

    return {
      data: foundMyData,
    }
  }

  @Put('update')
  @ApiOperation({ 
    summary: '내 정보 업데이트',
    description: '액세스 토큰을 이용하여 내 정보(닉네임)를 업데이트합니다.'
   })
  @ApiOkResponse({
    description: '유저 정보가 성공적으로 변경되었습니다.'
  })
  @ApiNotFoundResponse({
    description: '해당 유저가 존재하지 않습니다.'
  })
  @ApiBearerAuth('JWT')
  @UseGuards(AuthGuard('accessToken'))
  @HttpCode(HttpStatus.OK)
  @ResponseMsg('유저 정보가 성공적으로 변경되었습니다.')
  async updateMyData(
    @User() user, 
    @Body() updateUserDto: UserDto,
    ) {
    const userId: string = user.userId;

    const foundMyData = await this.userService.findById(userId);

    if (!foundMyData) {
      throw new NotFoundException(
        '해당 유저가 존재하지 않습니다.',
      );
    }

    const updatedMyData = await this.userService.userUpdate(userId, updateUserDto);

    return {
      data: updatedMyData,
    }
  }

  @Delete('delete')
  @ApiOperation({ 
    summary: '회원 탈퇴',
    description: '액세스 토큰을 이용하여 회원 탈퇴를 진행합니다.'
 })
  @ApiOkResponse({
    description: '회원탈퇴가 성공적으로 완료되었습니다.'
  })
  @ApiNotFoundResponse({
    description: '해당 유저가 존재하지 않습니다.'
  })
  @ApiBearerAuth('JWT')
  @UseGuards(AuthGuard('accessToken'))
  @HttpCode(HttpStatus.OK)
  @ResponseMsg('회원탈퇴가 성공적으로 완료되었습니다.')
  async deleteMyData(@User() user) {
    const userId: string = user.userId;

    const foundMyData = await this.userService.findById(userId);

    if (!foundMyData) {
      throw new NotFoundException(
        '해당 유저가 존재하지 않습니다.',
      );
    }

    await this.userService.userDelete(userId);

    return {}
  }

  @Post('image')
  @ApiOperation({ 
    summary: '프로필이미지 업데이트',
    description: '액세스 토큰을 이용하여 프로필 이미지를 업데이트합니다.'
   })
  @ApiOkResponse({
    description: '프로필이미지가 성공적으로 업데이트되었습니다.'
  })
  @ApiBearerAuth('JWT')
  @UseGuards(AuthGuard('accessToken'))
  @UseInterceptors(FileInterceptor('image', {
    limits: { fileSize: 5 * 1024 * 1024 },
  }))
  @HttpCode(HttpStatus.OK)
  @ResponseMsg('프로필이미지가 성공적으로 업데이트되었습니다.')
  async updateUserProfileImage(
    @User() user,
    @UploadedFile() file: Express.Multer.File
  ) {
    const userId: string = user.userId;

    const updateProfileImage = await this.userService.updateUserProfileImage(userId, file)
    
    const { url } = updateProfileImage

    return {
      data: { url }
    }
  }
}
