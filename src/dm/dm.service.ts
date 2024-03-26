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

  // DM방 생성
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
    
    // 기존 상대방과 DM을 주고받은 적이 있는지 확인
    if (checkCreatedDM.length !== 0) {
      const checkDMRoomId = checkCreatedDM[0].DMRoomId

      // 현재도 상대방이 해당 DM방을 나가지 않았는지 확인
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

      // 상대방이 나가지 않았다면 해당 DM방으로 JOIN 아니라면 신규 DM방 생성
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

  // DM방 멤버로 JOIN
  async enterDMRoomMember(roomId: number, userId: string): Promise<void> {
    // 이미 DM방 멤버인지 확인
    const checkUserEnterDMRoomMerber = await this.prisma.dMRoomMember.findUnique({
      where: {
        userId_DMRoomId: {
          userId,
          DMRoomId: roomId
        }
      }
    })

    // DM방 멤버가 아니라면 JOIN
    if (!checkUserEnterDMRoomMerber) {
      await this.prisma.dMRoomMember.create({
        data: {
          DMRoomId: roomId,
          userId,
        }
      })
    }
  }

  // DM 생성
  async createDMChat(DMRoomId: number, senderId: string, receiverId: string, content: string): Promise<DMDto> {
    // 상대방이 현재 해당 방에 JOIN해 있는지 확인 후 아니라면 멤버로 JOIN
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

    // 상대방의 최신 socketId 확인
    const receiverSocketId = this.eventGateway.getClientId()[receiverId]

    // 상대방이 현재 접속 중이라면 실시간으로 dm내용 알림
    this.eventGateway.server.to(receiverSocketId).emit('dm', createDMChat)

    return createDMChat
  }


  // DM방의 DM 조회
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

  // 내가 참여중인 모든 DM방 조회
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

  // DM방 나가기
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
