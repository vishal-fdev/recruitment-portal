// src/main.ts

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as express from 'express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  /* ✅ CORS FIX (ALLOW VERCEL + LOCAL) */
  app.enableCors({
    origin: [
      'http://localhost:5173', // local dev
      'https://recruitment-portal-five.vercel.app', // your frontend
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  /* ✅ STATIC FILES */
  app.use(
    '/uploads',
    express.static(join(__dirname, '..', 'uploads')),
  );

  /* ✅ PORT FIX (CRITICAL FOR RENDER) */
  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`🚀 Server running on port ${port}`);
}

bootstrap();