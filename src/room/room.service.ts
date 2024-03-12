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

  async getRoomMembers(roomId: number) {
    return await this.prisma.room.findUnique({
      where: {
        id: roomId
      },
      include: {
        roomMember: {
          select: {
            user: {
              select: {
                nickname: true,
              }
            }
          }
        },
      },
    })
  }

  // async enterRoom(roomId: number, userId: string) {
  //   const enterRoom = await this.prisma.roomMember.create({
  //     data: {
  //       roomId,
  //       userId,
  //     },
  //     select: {
  //       user: {
  //         select: {
  //           nickname: true,
  //           profileImage: true,
  //         }
  //       },
  //       room: true,
  //     }
  //   })

  //   this.eventGateway.server.to(`${enterRoom.room.name}`).emit('join', `${enterRoom.user.nickname}님이 입장하셨습니다.`)

  //   return enterRoom
  // }

  // async exitRoom(roomId: number, userId: string) {
  //   const exitRoom = await this.prisma.roomMember.delete({
  //     where: {
  //       userId_roomId: {
  //         userId,
  //         roomId,
  //       }
  //     },
  //     select: {
  //       user: {
  //         select: {
  //           nickname: true,
  //           profileImage: true,
  //         }
  //       },
  //       room: true,
  //     }
  //   })

  //   this.eventGateway.server.to(`${exitRoom.room.name}`).emit('exit', `${exitRoom.user.nickname}님이 퇴장하셨습니다.`)

  //   return exitRoom
  // }

  async getNowEnteringRooms(roomId:number, userId: string) {
    return await this.prisma.roomMember.findUnique({
      where: {
        userId_roomId: {
          roomId,
          userId,
        }
      }
    })
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

