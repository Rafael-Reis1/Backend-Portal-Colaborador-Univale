import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Notification } from './entities/notification.entity';
import { PrismaService } from 'src/database/PrismaService';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(Notification: Notification) {
    if(Notification.token == process.env.TOKEN_Fluig) {
      const notification =  await this.prisma.notifications.create({
        data: {
          cpfReceiver: Notification.cpfReceiver,
          nameSender: Notification.nameSender,
          instanceId: Notification.instanceId,
          processId: Notification.processId,
          acitivityName: Notification.acitivityName,
          url: Notification.url
        }
      });

      if(notification) {
        return {
          ok: true,
          notification: notification
        };
      }

      throw new HttpException('Error!', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    throw new HttpException('Token Error!', HttpStatus.UNAUTHORIZED);
  }
}
