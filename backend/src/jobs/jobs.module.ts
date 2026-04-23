import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';
import { MailService } from '../common/mail.service';

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


@Module({
  imports: [
    UsersModule,
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
    MailService,
  ],
  exports: [JobsService],
})
export class JobsModule {}
