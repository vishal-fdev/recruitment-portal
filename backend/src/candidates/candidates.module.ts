// src/candidates/candidates.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CandidatesController } from './candidates.controller';
import { CandidatesService } from './candidates.service';

import { Candidate } from './candidate.entity';
import { Vendor } from '../vendors/vendors.entity';
import { Job } from '../jobs/job.entity';
import { JobVendor } from '../jobs/job-vendor.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Candidate,
      Vendor,
      Job,        // 🔥 REQUIRED
      JobVendor,  // 🔥 REQUIRED
    ]),
  ],
  controllers: [CandidatesController],
  providers: [CandidatesService],
})
export class CandidatesModule {}
