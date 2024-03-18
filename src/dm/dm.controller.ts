import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ParseIntPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { DmService } from './dm.service';
import { User } from 'src/common/decorators/user.decorator';
import { AuthGuard } from '@nestjs/passport';
import { ResponseMsg } from 'src/common/decorators/response-message.decorator';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DMDto } from './dto/dm.dto';
import { AllDMDto } from './dto/all-dm.dto';

@UseGuards(AuthGuard('accessToken'))
@Controller('dm')
@ApiTags('DM')
@ApiBearerAuth('JWT')
export class DmController {
  constructor(private readonly dmService: DmService) {}

  @ApiOperation({ 
    summary: 'DM방 생성',
    description: 'DM방을 생성합니다.'
  })
  @ApiOkResponse({
    description: 'DM방을 성공적으로 생성하였습니다.',
  })
  @HttpCode(HttpStatus.OK)
  @ResponseMsg(`DM방을 성공적으로 생성하였습니다.`)
  @Post('create/DMRoom')
  async createDMRoom(
    @Body('receiverId') receiverId: string,
    @User() user,
  ) {
    const { userId } = user

    const createDMRoom = await this.dmService.createDMRoom(userId, receiverId)

    return {
      data: createDMRoom
    }
  }

  @ApiOperation({ 
    summary: 'DM 보내기',
    description: 'DM을 보냅니다.'
  })
  @ApiOkResponse({
    description: 'DM을 성공적으로 보냈습니다.',
    type: DMDto
  })
  @HttpCode(HttpStatus.OK)
  @ResponseMsg(`DM을 성공적으로 보냈습니다.`)
  @Post('chats/:DMRoom_id')
  async createDMChat(
    @Param('DMRoom_id', ParseIntPipe) DMRoomId: number,
    @Body() DMDto: DMDto,
    @User() user, 
  ) {
    const senderId = user.userId
    const { content, receiverId } = DMDto

    const createDMChat = await this.dmService.createDMChat(
      DMRoomId, senderId, receiverId, content
    )

    return {
      data: createDMChat
    }
  }

  @ApiOperation({ 
    summary: '참여중인 특정 DM방 DM 조회',
    description: '참여중인 특정 DM방id와 최신 DM 내용을 조회합니다.'
  })
  @ApiOkResponse({
    description: '참여중인 특정 DM방id와 최신 DM 내용을 성공적으로 조회했습니다.',
    type: AllDMDto
  })
  @HttpCode(HttpStatus.OK)
  @ResponseMsg('참여중인 특정 DM방id와 최신 DM 내용을 성공적으로 조회했습니다.')
  @Get('chats/:DMRoom_id')
  async getDMRoomChats(
    @Param('DMRoom_id', ParseIntPipe) DMRoomId: number,
    @User() user
  ) {
    const { userId } = user

    const getDMRoomChats = await this.dmService.getDMRoomChats(
      DMRoomId, userId
    )

    return {
      data: getDMRoomChats
    }
  }

  @ApiOperation({ 
    summary: '참여중인 DM방 조회',
    description: '참여중인 DM방을 조회합니다.'
  })
  @ApiOkResponse({
    description: '참여중인 DM방을 성공적으로 조회했습니다.',
    type: DMDto
  })
  @HttpCode(HttpStatus.OK)
  @ResponseMsg('참여중인 DM방을 성공적으로 조회했습니다.')
  @Get()
  async getMyDMRooms(
    @User() user,
  ) {
    const { userId } = user

    const getMyDMRooms = await this.dmService.getMyDMRooms(
      userId
    )

    return {
      data: getMyDMRooms
    }
  }

  @ApiOperation({ 
    summary: 'DM방 나가기',
    description: '해당 DM방을 나갑니다.'
  })
  @ApiOkResponse({
    description: '해당 DM방을 성공적으로 나갔습니다.',
  })
  @HttpCode(HttpStatus.OK)
  @ResponseMsg('해당 DM방을 성공적으로 나갔습니다.')
  @Delete('exit/:DMRoom_id')
  async exitDMRoom(
    @Param('DMRoom_id', ParseIntPipe) DMRoomId: number,
    @User() user
  ) {
    const { userId } = user

    await this.dmService.exitDMRoom(
      userId, DMRoomId
    )

    return {
      data: {}
    }
  }
}
