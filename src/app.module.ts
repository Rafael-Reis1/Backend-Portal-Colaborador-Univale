import { Module } from '@nestjs/common';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { APP_GUARD } from '@nestjs/core';
import { ProcessModule } from './modules/process/process.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { WsNotificationsModule } from './modules/ws-notifications/ws-notifications.module';
@Module({
  imports: [UserModule, AuthModule, ProcessModule, NotificationsModule, WsNotificationsModule],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard
    }
  ]
})
export class AppModule {}
