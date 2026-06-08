// src/app.module.ts

import { Module } from '@nestjs/common';
import { MailService } from './common/mail.service';
import { ConfigModule } from '@nestjs/config';

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { VendorsModule } from './vendors/vendors.module';
import { CandidatesModule } from './candidates/candidates.module';
import { JobsModule } from './jobs/jobs.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { PartnerSlotsModule } from './partner-slots/partner-slots.module';
import { MongoDatabaseModule } from './mongodb/mongodb.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongoDatabaseModule,

    AuthModule,
    UsersModule,
    VendorsModule,
    CandidatesModule,
    JobsModule,
    DashboardModule,
    PartnerSlotsModule,
  ],
  providers: [MailService], // ✅ ADD THIS
  exports: [MailService],   // ✅ ADD THIS
})
export class AppModule {}

 
