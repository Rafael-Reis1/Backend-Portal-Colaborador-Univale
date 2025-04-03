import { Test, TestingModule } from '@nestjs/testing';
import { WsNotificationsGateway } from './ws-notifications.gateway';
import { WsNotificationsService } from './ws-notifications.service';

describe('WsNotificationsGateway', () => {
  let gateway: WsNotificationsGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WsNotificationsGateway, WsNotificationsService],
    }).compile();

    gateway = module.get<WsNotificationsGateway>(WsNotificationsGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
