import { Injectable } from '@nestjs/common';
import { EventGateway } from 'src/event/event.gateway';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class RoomService {
  constructor(
    private prisma: PrismaService,
    private readonly eventGateway: EventGateway,
  ) {}
  
  // 모든 방 조회
  async getAllRooms() {
    return await this.prisma.room.findMany({})
  }

  // 방 채팅 작성
  async createRoomChat(roomId: number, userId: string, content: string) {
    const createRoomChat = await this.prisma.roomChat.create({
      data: {
        roomId,
        userId,
        content,
      },
      select: {
        roomId: true,
        user: {
          select: {
            id: true,
            nickname: true,
          },
        },
        room: {
          select: {
            name: true
          }
        },
        content: true,
        createdAt: true,
      },
    })

    // 해당방 접속중인 유저들에게 신규 작성 채팅 알림
    this.eventGateway.server.to(`${createRoomChat.room.name}`).emit('message', createRoomChat)

    return createRoomChat
  }

  // 해당 방 모든 채팅 조회(100개 기준)
  async getRoomChats(roomId: number, page: number) {
    return await this.prisma.roomChat.findMany({
      where: {
        roomId,
      },
      select: {
        content: true,
        user: {
          select: {
            id: true,
            nickname: true,
          }
        },
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 100,
      skip: (page - 1) * 100,
    })
  }
}

