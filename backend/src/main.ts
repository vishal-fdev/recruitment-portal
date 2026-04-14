// src/main.ts

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as express from 'express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ✅ FIXED CORS (VERY IMPORTANT)
  app.enableCors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        'http://localhost:5173',
        'http://localhost:3000',
        'https://aurasol.in',
        'https://www.aurasol.in',
        'https://recruitment-portal-five.vercel.app',
      ];

      // allow requests with no origin (like Postman)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  });

  // ✅ Serve uploads
  app.use('/uploads', express.static(join(__dirname, '..', 'uploads')));

  await app.listen(3000);
}

bootstrap();