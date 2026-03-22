// src/main.ts

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as express from 'express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ✅ FIXED CORS FOR PRODUCTION + LOCAL
  app.enableCors({
    origin: [
      'http://localhost:5173',
      'https://aurasol.in',
      'https://www.aurasol.in',
      'https://recruitment-portal-five.vercel.app',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // ✅ Serve uploads
  app.use('/uploads', express.static(join(__dirname, '..', 'uploads')));

  await app.listen(3000);
}

bootstrap();