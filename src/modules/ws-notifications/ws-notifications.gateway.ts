import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import { WsNotificationsService } from './ws-notifications.service';
import { WsNotification } from './entities/ws-notification.entity';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { WsJwtGuard } from 'src/auth/guards/ws-jwt.guard';
import { SocketAuthMiddleware } from 'src/auth/middleware/ws.mw';

@WebSocketGateway({
  cors: {
      origin: '*',
  },
})
@UseGuards(WsJwtGuard)
export class WsNotificationsGateway {
  constructor(private readonly wsNotificationsService: WsNotificationsService) {}

  afterInit(client: Socket) {
    client.use(SocketAuthMiddleware() as any);
  }

  @SubscribeMessage('createWsNotification')
  create(@MessageBody() WsNotification: WsNotification) {
    return this.wsNotificationsService.create(WsNotification);
  }

  @SubscribeMessage('findAllWsNotifications')
  findAll() {
    return this.wsNotificationsService.findAll();
  }

  @SubscribeMessage('removeWsNotification')
  remove(@MessageBody() id: number) {
    return this.wsNotificationsService.remove(id);
  }

  @SubscribeMessage('conectUser')
  conectUser(@MessageBody() Notification: WsNotification, @ConnectedSocket() client: Socket) {

  }
}
