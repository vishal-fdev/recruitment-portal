import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CandidatesController } from './candidates.controller';
import { CandidatesService } from './candidates.service';
import { Candidate } from './candidate.entity';
import { Vendor } from '../vendors/vendors.entity';
import { Job } from '../jobs/job.entity';
import { JobVendor } from '../jobs/job-vendor.entity';
import { CandidateInterview } from './candidate-interview.entity';
import { InterviewRound } from '../jobs/interview-round.entity';
import { JobPosition } from '../jobs/job-position.entity';
import { PartnerSlot } from '../partner-slots/partner-slot.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Candidate,
      Vendor,
      Job,
      JobVendor,
      CandidateInterview,
      InterviewRound,
      JobPosition,
      PartnerSlot,
    ]),
  ],
  controllers: [CandidatesController],
  providers: [CandidatesService],
  exports: [CandidatesService],
})
export class CandidatesModule {}
