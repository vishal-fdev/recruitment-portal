import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { Job } from './job.entity';
import { JobVendor } from './job-vendor.entity';
import { Vendor } from '../vendors/vendors.entity';
import { Candidate } from '../candidates/candidate.entity';
import { InterviewRound } from './interview-round.entity';
import { InterviewPanel } from './interview-panel.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Job,
      JobVendor,
      Vendor,
      Candidate,
      InterviewPanel,
      InterviewRound,
    ]),
  ],
  controllers: [JobsController],
  providers: [JobsService],
  exports: [JobsService],
})
export class JobsModule {}
