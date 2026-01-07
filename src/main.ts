import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/errors/error.filter';
import { ConfigService } from '@nestjs/config';

import { setupSwagger } from './common/setup/swagger-setup';
import { join } from 'path';
import * as bodyParser from 'body-parser';
import * as express from 'express';
import { verify } from 'crypto';
import { raw } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // bodyParser: false, // Disable automatic body parsing
  });
  app.enableCors();
  app.use('/api/v1/payment/webhook', express.raw({ type: 'application/json' }));

  app.setGlobalPrefix('api/v1');

  setupSwagger(app);

  app.use('/static', express.static(join(__dirname, '..', 'public')));




  const configService = app.get(ConfigService);


  app.useGlobalFilters(new GlobalExceptionFilter(configService));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  await app.listen(process.env.HTTP_PORT ?? 3777);

  void Logger.log(`Application is running on: ${await app.getUrl()}`);
  void Logger.log(`Environment: ${process.env.APP_ENV}`);
  void Logger.log(
    `Database is running on: ${process.env.DATABASE_HOST}:${process.env.DATABASE_PORT}/${process.env.DATABASE_NAME}`,
  );
  void Logger.log(`Swagger is running on: ${await app.getUrl()}/api/docs`);
}
bootstrap()
  .then(() => {
    void Logger.log('Bootstrap completed');
  })
  .catch((error) => {
    void Logger.error('Bootstrap failed', error);
  });
