import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { EventGateway } from 'src/event/event.gateway';
import { DMDto } from './dto/dm.dto';
import { AllDMDto } from './dto/all-dm.dto';

@Injectable()
export class DmService {
  constructor(
    private prisma: PrismaService,
    private readonly eventGateway: EventGateway,
  ) {}

  async createDMRoom(userId: string, receiverId: string): Promise<{DMRoomId: number}> {
    const checkCreatedDM = await this.prisma.dM.findMany({
      where: {
        OR: [
          {
            senderId: userId,
            receiverId,
          },
          {
            senderId: receiverId,
            receiverId: userId,
          }
        ]
      },
      select: {
        DMRoomId:true,
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 1
    })
    
    if (checkCreatedDM.length !== 0) {
      const checkDMRoomId = checkCreatedDM[0].DMRoomId

      const checkCreatedDMRoom = await this.prisma.dMRoomMember.findUnique({
        where: {
          userId_DMRoomId: {
            userId: receiverId,
            DMRoomId: checkDMRoomId
          }
        },
        select: {
          DMRoomId: true
        }
      })

      if (checkCreatedDMRoom) {
        const enterDMRoomMember = await this.prisma.dMRoomMember.create({
          data: {
            DMRoomId: checkCreatedDMRoom.DMRoomId,
            userId
          },
          select: {
            DMRoomId: true,
          }
        })

        return enterDMRoomMember
      }
    } else {
      const createDMRoom = await this.prisma.dMRoom.create({})
    
      const DMRoomId = createDMRoom.id
  
      const enterDMRoomMember = await this.prisma.dMRoomMember.create({
        data: {
          DMRoomId,
          userId
        },
        select: {
          DMRoomId: true,
        }
      })
  
      return enterDMRoomMember
    }
  }

  async enterDMRoomMember(roomId: number, userId: string): Promise<void> {
    const checkUserEnterDMRoomMerber = await this.prisma.dMRoomMember.findUnique({
      where: {
        userId_DMRoomId: {
          userId,
          DMRoomId: roomId
        }
      }
    })

    if (!checkUserEnterDMRoomMerber) {
      await this.prisma.dMRoomMember.create({
        data: {
          DMRoomId: roomId,
          userId,
        }
      })
    }
  }

  async createDMChat(DMRoomId: number, senderId: string, receiverId: string, content: string): Promise<DMDto> {
    await this.enterDMRoomMember(DMRoomId, receiverId)

    const createDMChat = await this.prisma.dM.create({
      data: {
        DMRoomId,
        senderId,
        receiverId,
        content,
      },
      select: {
        content: true,
        createdAt: true,
        sendUser: {
          select: {
            id: true,
            nickname: true,
            profileImage: {
              select: {
                url: true,
              }
            }
          }
        },
        receiveUser: {
          select: {
            id: true,
            nickname: true,
            profileImage: {
              select: {
                url: true,
              }
            }
          }
        }
      }
    })

    const receiverSocketId = this.eventGateway.clientId[receiverId]

    this.eventGateway.server.to(receiverSocketId).emit('dm', createDMChat)

    return createDMChat
  }


  async getDMRoomChats(DMRoomId: number, userId: string): Promise<DMDto[] | null> {
    return await this.prisma.dM.findMany({
      where: {
        OR: [
          {
            DMRoomId,
            senderId: userId
          },
          {
            DMRoomId,
            receiverId: userId
          }
        ]
      },
      select: {
        content: true,
        createdAt: true,
        sendUser: {
          select: {
            id: true,
            nickname: true,
            profileImage: {
              select: {
                url: true,
              }
            }
          }
        },
        receiveUser: {
          select: {
            id: true,
            nickname: true,
            profileImage: {
              select: {
                url: true
              }
            }
          }
        }
      }
    })
  }


  async getMyDMRooms(userId: string): Promise<AllDMDto[]> {
    return await this.prisma.dMRoomMember.findMany({
      where: {
        userId
      },
      select: {
        DMRoomId: true,
        DMRoom: {
          select: {
            DM: {
              select: {
                content: true,
                createdAt: true,
                sendUser: {
                  select: {
                    id: true,
                    nickname: true,
                    profileImage: {
                      select: {
                        url: true
                      }
                    }
                  }
                },
                receiveUser: {
                  select: {
                    id: true,
                    nickname: true,
                    profileImage: {
                      select: {
                        url: true
                      }
                    }
                  }
                }
              },
              orderBy: {
                createdAt: 'desc'
              },
              take: 1
            }
          }
        }
      }
    })
  }

  async exitDMRoom(userId: string, DMRoomId: number): Promise<void> {
    await this.prisma.dMRoomMember.delete({
      where: {
        userId_DMRoomId: {
          userId,
          DMRoomId,
        }
      }
    })
  }
}
