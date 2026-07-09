import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  PartnerSlotDocumentModel,
  PartnerSlotSchema,
} from './schemas/partner-slot.schema';
import {
  CandidateDocumentModel,
  CandidateSchema,
} from './schemas/candidate.schema';
import { JobDocumentModel, JobSchema } from './schemas/job.schema';
import { UserDocumentModel, UserSchema } from './schemas/user.schema';
import { VendorDocumentModel, VendorSchema } from './schemas/vendor.schema';
import {
  HpeBadgedCandidateDocumentModel,
  HpeBadgedCandidateSchema,
} from './schemas/hpe-badged-candidate.schema';
import {
  HpeBadgedJobDocumentModel,
  HpeBadgedJobSchema,
} from './schemas/hpe-badged-job.schema';
import {
  HpeBadgedRecruiterDocumentModel,
  HpeBadgedRecruiterSchema,
} from './schemas/hpe-badged-recruiter.schema';
import {
  HpeBadgedSubmissionDocumentModel,
  HpeBadgedSubmissionSchema,
} from './schemas/hpe-badged-submission.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CandidateDocumentModel.name, schema: CandidateSchema },
      { name: JobDocumentModel.name, schema: JobSchema },
      { name: PartnerSlotDocumentModel.name, schema: PartnerSlotSchema },
      { name: UserDocumentModel.name, schema: UserSchema },
      { name: VendorDocumentModel.name, schema: VendorSchema },
      {
        name: HpeBadgedCandidateDocumentModel.name,
        schema: HpeBadgedCandidateSchema,
      },
      { name: HpeBadgedJobDocumentModel.name, schema: HpeBadgedJobSchema },
      {
        name: HpeBadgedRecruiterDocumentModel.name,
        schema: HpeBadgedRecruiterSchema,
      },
      {
        name: HpeBadgedSubmissionDocumentModel.name,
        schema: HpeBadgedSubmissionSchema,
      },
    ]),
  ],
  exports: [MongooseModule],
})
export class MongoModelsModule {}

