import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseIntPipe, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { RoomService } from './room.service';
import { User } from 'src/common/decorators/user.decorator';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ResponseMsg } from 'src/common/decorators/response-message.decorator';
import { CreateChatDto } from 'src/common/dto/create-chat.dto';


@Controller('room')
@ApiTags('ROOM')
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @ApiOperation({ 
    summary: '방 조회',
    description: '방을 조회합니다.'
  })
  @ApiOkResponse({
    description: '방을 성공적으로 조회하였습니다.',
  })
  @HttpCode(HttpStatus.OK)
  @ResponseMsg('방을 성공적으로 조회하였습니다.')
  @Get()
  async getAllRooms() {
    const getAllRooms = await this.roomService.getAllRooms()

    return {
      data: getAllRooms
    }
  }

  // @ApiBearerAuth('JWT')
  // @UseGuards(AuthGuard('accessToken'))
  // @Get('/members/:room_id')
  // async getRoomMembers(
  //   @Param('room_id', ParseIntPipe) roomId: number,
  // ) {
  //   const getRoomMembers = await this.roomService.getRoomMembers(roomId)

  //   return {
  //     data: getRoomMembers
  //   }
  // }

  @ApiOperation({ 
    summary: '방 채팅 작성',
    description: '방 채팅을 작성합니다.'
  })
  @ApiOkResponse({
    description: '해당 방(room_id)의 채팅을 성공적으로 작성하였습니다.',
    type: CreateChatDto,
  })
  @ApiBearerAuth('JWT')
  @UseGuards(AuthGuard('accessToken'))
  @HttpCode(HttpStatus.OK)
  @ResponseMsg('해당 방의 채팅을 성공적으로 작성하였습니다.')
  @Post('chats/:room_id')
  async createRoomChat(
    @Param('room_id', ParseIntPipe) roomId: number,
    @Body() createChatDto: CreateChatDto,
    @User() user,
  ) {
    const { userId } = user
    const { content } = createChatDto

    const createRoomChat = await this.roomService.createRoomChat(roomId, userId, content)

    return {
      data: createRoomChat
    }
  }

  @ApiOperation({ 
    summary: '방 채팅 조회',
    description: '방 채팅을 조회합니다.'
  })
  @ApiOkResponse({
    description: '해당 방(room_id)의 채팅을 성공적으로 조회하였습니다.',
  })
  @ApiBearerAuth('JWT')
  @UseGuards(AuthGuard('accessToken'))
  @HttpCode(HttpStatus.OK)
  @ResponseMsg('해당 방의 채팅을 성공적으로 조회하였습니다.')
  @Get('chats/:room_id')
  async getRoomChats(
    @Param('room_id', ParseIntPipe) roomId: number,
    @Query('page') page: number,
  ) {
    const getRoomChats = await this.roomService.getRoomChats(roomId, page);

    return {
      data: getRoomChats
    }
  }
}
