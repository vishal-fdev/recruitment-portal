// src/dashboard/dashboard.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';

import { Candidate } from '../candidates/candidate.entity';
import { Job } from '../jobs/job.entity';
import { Vendor } from '../vendors/vendors.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Candidate,
      Job,
      Vendor,
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
