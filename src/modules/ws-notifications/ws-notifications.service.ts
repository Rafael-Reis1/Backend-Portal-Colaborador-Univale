import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/database/PrismaService';
import { WsNotification } from './entities/ws-notification.entity';

@Injectable()
export class WsNotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  create(WsNotification: WsNotification) {
    return 'Not implemented';
  }

  findAll() {
    return `This action returns all wsNotifications`;
  }

  remove(id: number) {
    return `This action removes a #${id} wsNotification`;
  }
}
