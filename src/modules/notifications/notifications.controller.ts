import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { Notification } from './entities/notification.entity';
import { IsPublic } from 'src/auth/decorators/is-public.decorator';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @IsPublic()
  @Post()
  create(@Body() Notification: Notification) {
    return this.notificationsService.create(Notification);
  }
}
