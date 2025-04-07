import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/database/PrismaService';
import { User } from '../user/entities/user.entity';
import { WsNotification } from './entities/ws-notification.entity';

@Injectable()
export class WsNotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(user: User) {
    return await this.prisma.notifications.findMany({
      where: {
        cpfReceiver: user.cpf
      },
      orderBy: {
        createdAt: 'asc' 
      },
      omit: {
        cpfReceiver: true
      }
    });
  }

  async read(notification: WsNotification, user: User) {
    const userNotification = await this.prisma.notifications.findFirst({
      where: {
        id: notification.id,
        cpfReceiver: user.cpf
      }
    });

    if(userNotification) {
      return this.prisma.notifications.update({
        where: {
          id: notification.id,
          cpfReceiver: user.cpf
        },
        data: {
          read: notification.read
        }
      });
    }

    return {
      erro: 'Notifications does not exist!'
    };
  }

  async remove(id: string, user: User) {
    const notification = await this.prisma.notifications.findFirst({
      where: {
        id: id,
        cpfReceiver: user.cpf
      }
    });

    if(notification) {
      return this.prisma.notifications.delete({
        where: {
          id: id,
          cpfReceiver: user.cpf
        }
      });
    }

    return {
      erro: 'Notifications does not exist!'
    };
  }
}
