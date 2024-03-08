import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway()
export class EventGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() public server: Server;

  roomUsers: { [key: string]: string[] } = {};

  @SubscribeMessage('join')
  handleJoin(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { nickname: string; room: string },   
  ): void {
    if (socket.rooms.has(data.room)) {
      return
    }

    socket.join(data.room)

    if (!this.roomUsers[data.room]) {
      this.roomUsers[data.room] = []
    }

    socket.data.nickname = data.nickname
    socket.data.room = data.room

    this.roomUsers[data.room].push(data.nickname)
    this.server.to(data.room).emit('userJoined', `${data.nickname}님이 ${data.room}에 입장하셨습니다.`)
    this.server.to(data.room).emit('userList', { userList: this.roomUsers[data.room] })
    this.server.to(data.room).emit('userCount', { userCount: this.roomUsers[data.room].length})
  }

  @SubscribeMessage('exit')
  handleExit(
    @ConnectedSocket() socket: Socket,
  ): void {
    if (!socket.rooms.has(socket.data.room)) {
      return;
    }

    const index = this.roomUsers[socket.data.room]?.indexOf(socket.data.nickname)
    if (index !== -1) {
      this.roomUsers[socket.data.room].splice(index, 1)

      this.server.to(socket.data.room).emit('userList', { userList: this.roomUsers[socket.data.room] })
      this.server.to(socket.data.room).emit('userCount', { userCount: this.roomUsers[socket.data.room].length})

      delete socket.data.nickname
      delete socket.data.room
    }
  }

  @SubscribeMessage('getUserList')
  handleGetUserList(
    @ConnectedSocket() socket: Socket,
    @MessageBody() room: string,   
  ): void {
    this.server.to(room).emit('userList', { userList: this.roomUsers[room] })
    this.server.to(room).emit('userCount', { userCount: this.roomUsers[room].length })
  }

  afterInit(server: any) {
    console.log('websocketServer Init Complete')
  }

  handleConnection(@ConnectedSocket() socket: Socket): void {
    
  }

  handleDisconnect(@ConnectedSocket() socket: Socket): any {
    if (socket.data.room) {
      const index = this.roomUsers[socket.data.room]?.indexOf(socket.data.nickname)
      if (index !== -1) {
        this.roomUsers[socket.data.room].splice(index, 1)
  
        this.server.to(socket.data.room).emit('userList', { userList: this.roomUsers[socket.data.room] })
        this.server.to(socket.data.room).emit('userCount', { userCount: this.roomUsers[socket.data.room].length})
      }
    }
  }
}
