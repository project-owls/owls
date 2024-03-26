import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Cache } from 'cache-manager';
import { Server, Socket } from 'socket.io';

@WebSocketGateway()
export class EventGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  // cache manager를 활용하여 cache 적용
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  @WebSocketServer() public server: Server;
  
  // 유저의 최신 socketId 조회
  async getClientId(): Promise<{ [key: string]: string }> {
    const getClientId = await this.cacheManager.get<{ [key: string]: string }>('clientId');
    return getClientId || {};
  }

  // 해당 방의 접속 유저 조회
  async getRoomUsers(): Promise<{ [key: string]: string[] }> {
    const getRoomUsers = await this.cacheManager.get<{ [key: string]: string[] }>('roomUsers');
    return getRoomUsers || {};
  }

  // 유저의 최신 socketId 업데이트
  async setClientId(clientId: { [key: string]: string }): Promise<void> {
    await this.cacheManager.set(`clientId`, clientId, { ttl: 259200});
  }

  // 해당 방의 접속 유저 업데이트
  async setRoomUsers(roomUsers: { [key: string]: string[] }): Promise<void> {
    await this.cacheManager.set(`roomUsers`, roomUsers, { ttl: 259200});
  }

  // 유저 로그인 시 소켓id 최신화
  @SubscribeMessage('userLogin')
  async handleLiogin(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { id: string },
  ): Promise<void> {
    const clientId = await this.getClientId();
    clientId[data.id] = socket.id;
    await this.setClientId(clientId);
  }

  // 방 join
  @SubscribeMessage('roomJoin')
  async handleJoin(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { nickname: string; room: string },
  ): Promise<void> {
    // 기존 접속된 방이 있다면 기존 방 나가기
    if (socket.rooms.has(data.room)) {
      this.handleExit
    }
    
    // 해당 방 접속
    socket.join(data.room)

    let roomUsers = await this.getRoomUsers()

    // 해당 방에 대한 기록이 없을 경우 배열로 생성
    if (!roomUsers[data.room]) {
      roomUsers[data.room] = []
    }

    socket.data.nickname = data.nickname
    socket.data.room = data.room

    // 해당 방 유저목록에 유저 닉네임 추가
    roomUsers[data.room].push(data.nickname)

    await this.setRoomUsers(roomUsers)

    // 해당 방에 접속중인 유저들에게 신규 유저 접속 알림
    this.server.to(data.room).emit('userJoin', `${data.nickname}님이 ${data.room}에 입장하셨습니다.`)
    // 해당 방 접속중인 유저들의 유저목록 업데이트
    this.server.to(data.room).emit('userList', { userList: roomUsers[data.room] })
    // 해당방 접속중인 유저 수 업데이트
    this.server.to(data.room).emit('userCount', { userCount: roomUsers[data.room].length})
  }

  // 방 나가기
  @SubscribeMessage('roomExit')
  async handleExit(
    @ConnectedSocket() socket: Socket,
  ): Promise<void> {
    // 접속중인 방이 없다면 로직 종료
    if (!socket.rooms.has(socket.data.room)) {
      return;
    }

    let roomUsers = await this.getRoomUsers()

    // 해당 방 유저목록 중 몇번째에 위치하는지 확인
    const index = roomUsers[socket.data.room]?.indexOf(socket.data.nickname)
    // 해당 방 유저목록에 존재한다면 해당 닉네임 삭제
    if (index !== -1) {
      roomUsers[socket.data.room].splice(index, 1)

      await this.setRoomUsers(roomUsers);

      // 해당 방에 접속중인 유저들에게 유저 퇴장 알림
      this.server.to(socket.data.room).emit('userExit', `${socket.data.nickname}님이 퇴장하셨습니다.`)
      // 해당 유저의 socket에서 방 삭제
      socket.leave(socket.data.room)
      // 해당 방 접속중인 유저들의 유저목록 업데이트
      this.server.to(socket.data.room).emit('userList', { userList: roomUsers[socket.data.room] })
      // 해당방 접속중인 유저 수 업데이트
      this.server.to(socket.data.room).emit('userCount', { userCount: roomUsers[socket.data.room].length})

      delete socket.data.nickname
      delete socket.data.room
    }
  }

  // 해당 방 접속 유저 확인
  @SubscribeMessage('getRoomUserList')
  async handleGetUserList(
    @ConnectedSocket() socket: Socket,
    @MessageBody() room: string,   
  ): Promise<void> {
    let roomUsers = await this.getRoomUsers()

    // 해당 방 접속중인 유저들의 유저목록
    this.server.to(room).emit('userList', { userList: roomUsers[room] })
    // 해당방 접속중인 유저 수
    this.server.to(room).emit('userCount', { userCount: roomUsers[room].length })
  }

  afterInit(server: any) {
    console.log('websocketServer Init Complete')
  }

  handleConnection(@ConnectedSocket() socket: Socket): void {
    
  }

  // 유저가 사이트를 나갔을 때 접속중인 방 퇴장
  async handleDisconnect(@ConnectedSocket() socket: Socket): Promise<void> {
    // 방을 접속중이었다면
    if (socket.data.room) {
      let roomUsers = await this.getRoomUsers()

      // 해당 방 유저목록 중 몇번째에 위치하는지 확인
      const index = roomUsers[socket.data.room]?.indexOf(socket.data.nickname)
      // 해당 방 유저목록에 존재한다면 해당 닉네임 삭제
      if (index !== -1) {
        roomUsers[socket.data.room].splice(index, 1)

        await this.setRoomUsers(roomUsers);

        // 해당 방에 접속중인 유저들에게 유저 퇴장 알림
        this.server.to(socket.data.room).emit('userExit', `${socket.data.nickname}님이 퇴장하셨습니다.`)
        // 해당 유저의 socket에서 방 삭제
        socket.leave(socket.data.room) 
        // 해당 방 접속중인 유저들의 유저목록 업데이트
        this.server.to(socket.data.room).emit('userList', { userList: roomUsers[socket.data.room] })
        // 해당방 접속중인 유저 수 업데이트
        this.server.to(socket.data.room).emit('userCount', { userCount: roomUsers[socket.data.room].length})
      }
    }
  }
}
