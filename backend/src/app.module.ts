// src/app.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { VendorsModule } from './vendors/vendors.module';
import { CandidatesModule } from './candidates/candidates.module';
import { JobsModule } from './jobs/jobs.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    /* ✅ LOAD ENV VARIABLES */
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    /* ✅ DATABASE CONNECTION */
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,

      entities: [__dirname + '/**/*.entity{.ts,.js}'],

      synchronize: true, // OK for dev (⚠️ turn OFF in prod)

      ssl: {
        rejectUnauthorized: false,
      },
    }),

    /* MODULES */
    AuthModule,
    UsersModule,
    VendorsModule,
    CandidatesModule,
    JobsModule,
    DashboardModule,
  ],
})
export class AppModule {}