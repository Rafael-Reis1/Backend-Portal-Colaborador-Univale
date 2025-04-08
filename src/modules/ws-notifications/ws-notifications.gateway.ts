import { UseGuards } from '@nestjs/common';
import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { WsUser } from 'src/auth/decorators/ws-current-user.decorator';
import { WsJwtGuard } from 'src/auth/guards/ws-jwt.guard';
import { SocketAuthMiddleware } from 'src/auth/middleware/ws.mw';
import { User } from '../user/entities/user.entity';
import { WsNotification } from './entities/ws-notification.entity';
import { WsNotificationsService } from './ws-notifications.service';
import { instrument } from '@socket.io/admin-ui';

@WebSocketGateway({
  cors: {
    origin: ["https://admin.socket.io", "https://portalcolaborador.univale.br", "http://127.0.0.1:3000"],
    credentials: true
  }
})
@UseGuards(WsJwtGuard)
export class WsNotificationsGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly wsNotificationsService: WsNotificationsService) {}

  private connectedClients: Map<string, string> = new Map();

  getSocketIdByCpf(cpfProcurado: string): string | undefined {
    for (const [cpf, socketId] of this.connectedClients.entries()) {
      if (cpf === cpfProcurado) {
        return socketId;
      }
    }
    return undefined;
  }

  afterInit(client: Socket) {
    client.use(SocketAuthMiddleware() as any);
    instrument(this.server, {
      auth: {
        type: "basic",
        username: "admin",
        password: "$2b$10$heqvAkYMez.Va6Et2uXInOnkCT6/uQj1brkrbyG3LpopDklcq7ZOS" // "changeit" encrypted with bcrypt
      },
    });
  }

  handleDisconnect(client: Socket) {
    for (const [cpf, socketId] of this.connectedClients.entries()) {
      if (socketId === client.id) {
        this.connectedClients.delete(cpf);
        break;
      }
    }
  }

  @SubscribeMessage('findAllNotifications')
  findAll(@WsUser() user: User) {
    return this.wsNotificationsService.findAll(user);
  }

  @SubscribeMessage('readNotification')
  read(@MessageBody() notification: WsNotification, @WsUser() user: User) {
    return this.wsNotificationsService.read(notification, user);
  }

  @SubscribeMessage('removeWsNotification')
  remove(@MessageBody() id: string, @WsUser() user: User) {
    return this.wsNotificationsService.remove(id, user);
  }

  @SubscribeMessage('conectUser')
  conectUser(@WsUser() user: User, @ConnectedSocket() client: Socket) {
    this.connectedClients.set(user.cpf, client.id);
    return true;
  }
}
