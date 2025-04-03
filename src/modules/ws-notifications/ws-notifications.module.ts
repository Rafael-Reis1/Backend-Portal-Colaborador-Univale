import { Module } from '@nestjs/common';
import { WsNotificationsService } from './ws-notifications.service';
import { WsNotificationsGateway } from './ws-notifications.gateway';
import { PrismaService } from 'src/database/PrismaService';

@Module({
  providers: [WsNotificationsGateway, WsNotificationsService, PrismaService],
})
export class WsNotificationsModule {}
