import { Injectable } from '@nestjs/common';
import { EventGateway } from 'src/event/event.gateway';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class RoomService {
  constructor(
    private prisma: PrismaService,
    private readonly eventGateway: EventGateway,
  ) {}
  
  async getAllRooms() {
    return await this.prisma.room.findMany({})
  }

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

    this.eventGateway.server.to(`${createRoomChat.room.name}`).emit('message', createRoomChat)

    return createRoomChat
  }

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

