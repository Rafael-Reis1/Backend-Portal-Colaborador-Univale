import { Module } from '@nestjs/common';
import { ProcessService } from './process.service';
import { ProcessController } from './process.controller';
import { PrismaService } from 'src/database/PrismaService';

@Module({
  controllers: [ProcessController],
  providers: [ProcessService, PrismaService],
})
export class ProcessModule {}
