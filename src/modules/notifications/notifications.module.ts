import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { PrismaService } from 'src/database/PrismaService';
import { WsNotificationsGateway } from '../ws-notifications/ws-notifications.gateway';
import { WsNotificationsService } from '../ws-notifications/ws-notifications.service';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService, PrismaService,
    WsNotificationsGateway, WsNotificationsService],
  imports: [ScheduleModule.forRoot()],
})
export class NotificationsModule {}
