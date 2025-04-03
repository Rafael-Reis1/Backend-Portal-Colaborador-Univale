import { Test, TestingModule } from '@nestjs/testing';
import { WsNotificationsService } from './ws-notifications.service';

describe('WsNotificationsService', () => {
  let service: WsNotificationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WsNotificationsService],
    }).compile();

    service = module.get<WsNotificationsService>(WsNotificationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
