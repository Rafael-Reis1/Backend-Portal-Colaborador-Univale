import { Body, Controller, Post } from '@nestjs/common';
import { IsPublic } from 'src/auth/decorators/is-public.decorator';
import { WsNotificationsGateway } from '../ws-notifications/ws-notifications.gateway';
import { Notification } from './entities/notification.entity';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService,
    private readonly wsNotificationsGateway: WsNotificationsGateway,
  ) {}

  @IsPublic()
  @Post()
  async create(@Body() notification: Notification) {
    const createdNotification = await this.notificationsService.create(notification);

    if (notification.cpfReceiver) {
      const socketId = this.wsNotificationsGateway.getSocketIdByCpf(notification.cpfReceiver);
      if (socketId) {
        this.wsNotificationsGateway.server.to(socketId).emit('new-notification', createdNotification);
      }
    }

    return createdNotification;
  }
}
