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

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CandidateDocumentModel.name, schema: CandidateSchema },
      { name: JobDocumentModel.name, schema: JobSchema },
      { name: PartnerSlotDocumentModel.name, schema: PartnerSlotSchema },
      { name: UserDocumentModel.name, schema: UserSchema },
      { name: VendorDocumentModel.name, schema: VendorSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class MongoModelsModule {}
