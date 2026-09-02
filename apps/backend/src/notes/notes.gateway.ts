import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable } from '@nestjs/common';

@WebSocketGateway({ cors: true })
@Injectable()
export class NotesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }


  @SubscribeMessage('joinPracticeRoom')
  joinPracticeRoom(client: Socket, practiceId: string) {
    client.join(`practice_${practiceId}`);
  }
  notifyNoteCreated(practiceId: string, note: any) {
    this.server.to(`practice_${practiceId}`).emit('noteCreated', note);
  }

}
