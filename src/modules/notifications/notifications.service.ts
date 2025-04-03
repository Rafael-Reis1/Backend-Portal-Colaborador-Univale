import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Notification } from './entities/notification.entity';
import { PrismaService } from 'src/database/PrismaService';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(Notification: Notification) {
    if(Notification.token == process.env.TOKEN_Fluig) {
      await this.prisma.notifications.create({
        data: {
          title: Notification.title,
          text: Notification.text,
          cpfReceiver: Notification.cpfReceiver,
          cpfSender: Notification.cpfSender,
          priority: Notification.priority,
          instanceId: Notification.instanceId,
          processId: Notification.processId
        }
      });

      return {
        ok: true
      }
    }

    throw new HttpException('Token Error!', HttpStatus.UNAUTHORIZED);
  }
}
