import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Cache } from 'cache-manager';
import { Server, Socket } from 'socket.io';

@WebSocketGateway()
export class EventGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  @WebSocketServer() public server: Server;
  
  async getClientId(): Promise<{ [key: string]: string }> {
    const getClientId = await this.cacheManager.get<{ [key: string]: string }>('clientId');
    return getClientId || {};
  }

  async getRoomUsers(): Promise<{ [key: string]: string[] }> {
    const getRoomUsers = await this.cacheManager.get<{ [key: string]: string[] }>('roomUsers');
    return getRoomUsers || {};
  }

  async setClientId(clientId: { [key: string]: string }): Promise<void> {
    await this.cacheManager.set(`clientId`, clientId, { ttl: 259200});
  }

  async setRoomUsers(roomUsers: { [key: string]: string[] }): Promise<void> {
    await this.cacheManager.set(`roomUsers`, roomUsers, { ttl: 259200});
  }

  @SubscribeMessage('userLogin')
  async handleLiogin(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { id: string },
  ): Promise<void> {
    const clientId = await this.getClientId();
    clientId[data.id] = socket.id;
    await this.setClientId(clientId);
  }

  @SubscribeMessage('roomJoin')
  async handleJoin(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { nickname: string; room: string },
  ): Promise<void> {
    if (socket.rooms.has(data.room)) {
      this.handleExit
    }
    
    socket.join(data.room)

    let roomUsers = await this.getRoomUsers()

    if (!roomUsers[data.room]) {
      roomUsers[data.room] = []
    }

    socket.data.nickname = data.nickname
    socket.data.room = data.room

    roomUsers[data.room].push(data.nickname)

    await this.setRoomUsers(roomUsers)

    this.server.to(data.room).emit('userJoin', `${data.nickname}님이 ${data.room}에 입장하셨습니다.`)
    this.server.to(data.room).emit('userList', { userList: roomUsers[data.room] })
    this.server.to(data.room).emit('userCount', { userCount: roomUsers[data.room].length})
  }

  @SubscribeMessage('roomExit')
  async handleExit(
    @ConnectedSocket() socket: Socket,
  ): Promise<void> {
    if (!socket.rooms.has(socket.data.room)) {
      return;
    }

    let roomUsers = await this.getRoomUsers()

    const index = roomUsers[socket.data.room]?.indexOf(socket.data.nickname)
    if (index !== -1) {
      roomUsers[socket.data.room].splice(index, 1)

      await this.setRoomUsers(roomUsers);

      this.server.to(socket.data.room).emit('userExit', `${socket.data.nickname}님이 퇴장하셨습니다.`)
      socket.leave(socket.data.room)
      this.server.to(socket.data.room).emit('userList', { userList: roomUsers[socket.data.room] })
      this.server.to(socket.data.room).emit('userCount', { userCount: roomUsers[socket.data.room].length})

      delete socket.data.nickname
      delete socket.data.room
    }
  }

  @SubscribeMessage('getRoomUserList')
  async handleGetUserList(
    @ConnectedSocket() socket: Socket,
    @MessageBody() room: string,   
  ): Promise<void> {
    let roomUsers = await this.getRoomUsers()

    this.server.to(room).emit('userList', { userList: roomUsers[room] })
    this.server.to(room).emit('userCount', { userCount: roomUsers[room].length })
  }

  afterInit(server: any) {
    console.log('websocketServer Init Complete')
  }

  handleConnection(@ConnectedSocket() socket: Socket): void {
    
  }

  async handleDisconnect(@ConnectedSocket() socket: Socket): Promise<void> {
    if (socket.data.room) {
      let roomUsers = await this.getRoomUsers()

      const index = roomUsers[socket.data.room]?.indexOf(socket.data.nickname)
      if (index !== -1) {
        roomUsers[socket.data.room].splice(index, 1)

        await this.setRoomUsers(roomUsers);

        this.server.to(socket.data.room).emit('userExit', `${socket.data.nickname}님이 퇴장하셨습니다.`)
        socket.leave(socket.data.room) 
        this.server.to(socket.data.room).emit('userList', { userList: roomUsers[socket.data.room] })
        this.server.to(socket.data.room).emit('userCount', { userCount: roomUsers[socket.data.room].length})
      }
    }
  }
}
