import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as fs from 'fs';

/*const httpsOptions = {
  key: fs.readFileSync('./secrets/privadakey36994.key'),
  cert: fs.readFileSync('./secrets/certificadopem36994.pem'),
};*/

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();

  // Pipes
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  await app.listen(3000, '127.0.0.1');
  
}
bootstrap();
