import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post, Put, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import * as Multer from 'multer';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { User } from '../user/entities/user.entity';
import { processDTO } from './process.dto';
import { ProcessService } from './process.service';
import * as iconv from 'iconv-lite';
import { IsPublic } from 'src/auth/decorators/is-public.decorator';

@Controller('process')
export class ProcessController {
  constructor(private readonly processService: ProcessService) {}

  @Post('start')
  async startProcess(@Body() data: processDTO, @CurrentUser() user: User) {
    return this.processService.startProcess(data, user);
  }

  @Post('move')
  async moveProcess(@Body() data: processDTO) {
    return this.processService.moveProcessAxios(data);
  }
  
  @Post('all')
  @HttpCode(HttpStatus.OK)
  async findProcessUser(@CurrentUser() user: User, @Body() data: processDTO) {
    if(data.tipoAtividade != null) {
      return this.processService.findProcessUser(user, data);
    }
    else return 'tipoAtividade is null'
  }

  @Post('id')
  @HttpCode(HttpStatus.OK)
  async findProcessUserById(@CurrentUser() user: User, @Body() data: processDTO) {
    return this.processService.findProcessUserById(user, data);
  }

  @Put('update')
  async updateCardData(@Body() data: processDTO) {
    return this.processService.updateCardData(data, data.processInstanceId);
  }

  @Post('attachments')
  @UseInterceptors(FilesInterceptor('files', 1000000, {  
    storage: Multer.memoryStorage(),
  }))
  async uploadFiles(@UploadedFiles() files: Multer.File[], @Body('json') json: string, @CurrentUser() user: User) {
    files.forEach(file => {
      const decodedName = iconv.decode(Buffer.from(file.originalname, 'binary'), 'utf8');
      file.originalname = decodedName;
    });

    const parsedJson = JSON.parse(json);

    return this.processService.handleFiles(files, user, parsedJson);
  }

  @Get('attachments/:processInstanceId')
  async getAttachments(@CurrentUser() user: User, @Param('processInstanceId') processInstanceId: string) {
    return this.processService.getAttachments(user, processInstanceId);
  }

  @Put('deleteAttachment')
  async deleteAttachment(@CurrentUser() user: User, @Body() data: processDTO) {
    return this.processService.deleteAttachment(user, data);
  }

  @IsPublic()
  @Patch('activity')
  async updateActivity(@Body() data: processDTO) {
    return this.processService.updateActivity(data)
  }
}
