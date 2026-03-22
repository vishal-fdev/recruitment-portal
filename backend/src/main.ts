import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as express from 'express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: [
      'http://localhost:5173',
      'https://recruitment-portal-five.vercel.app', // ✅ ADD THIS
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.use(
    '/uploads',
    express.static(join(__dirname, '..', 'uploads')),
  );

  await app.listen(process.env.PORT || 3000); // ✅ IMPORTANT FOR RENDER
}
bootstrap();