import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Candidate } from '../candidates/candidate.entity';
import { InterviewRound } from '../jobs/interview-round.entity';
import { Job } from '../jobs/job.entity';
import { Vendor } from '../vendors/vendors.entity';
import { PartnerSlot } from './partner-slot.entity';
import { PartnerSlotsController } from './partner-slots.controller';
import { PartnerSlotsService } from './partner-slots.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PartnerSlot,
      Candidate,
      Job,
      Vendor,
      InterviewRound,
    ]),
  ],
  controllers: [PartnerSlotsController],
  providers: [PartnerSlotsService],
  exports: [PartnerSlotsService],
})
export class PartnerSlotsModule {}
