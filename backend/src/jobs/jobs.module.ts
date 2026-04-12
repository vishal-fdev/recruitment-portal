import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { JobApprovalsController } from './job-approvals.controller';

import { Job } from './job.entity';
import { JobVendor } from './job-vendor.entity';
import { Vendor } from '../vendors/vendors.entity';
import { Candidate } from '../candidates/candidate.entity';
import { InterviewRound } from './interview-round.entity';
import { InterviewPanel } from './interview-panel.entity';
import { JobPosition } from './job-position.entity';

import { MailService } from '../common/mail.service'; // ✅ ADD THIS

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Job,
      JobVendor,
      Vendor,
      Candidate,
      InterviewPanel,
      InterviewRound,
      JobPosition,
    ]),
  ],
  controllers: [JobsController, JobApprovalsController],
  providers: [
    JobsService,
    MailService, // ✅ ADD THIS
  ],
  exports: [JobsService],
})
export class JobsModule {}