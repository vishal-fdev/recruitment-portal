// src/main.ts

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as express from 'express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ✅ PROPER CORS CONFIG (LOCAL + VERCEL SAFE)
  app.enableCors({
    origin: [
      'http://localhost:5173',   // ✅ local frontend
      'https://aurasol.in',      // ✅ your main domain
      'https://www.aurasol.in',  // ✅ optional (if www is used)
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true, // ✅ IMPORTANT for JWT
  });

  // ✅ serve uploaded files
  app.use('/uploads', express.static(join(__dirname, '..', 'uploads')));

  await app.listen(3000);

  console.log('🚀 BACKEND RUNNING ON PORT 3000');
}

bootstrap();