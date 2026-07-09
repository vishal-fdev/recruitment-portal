import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type HpeBadgedSubmissionDocument =
  HydratedDocument<HpeBadgedSubmissionDocumentModel>;

@Schema({ collection: 'hpe_badged_submissions', timestamps: true })
export class HpeBadgedSubmissionDocumentModel {
  @Prop({ required: true, index: true })
  jobId!: string;

  @Prop({ required: true, index: true })
  candidateId!: string;

  @Prop({ required: true })
  candidateName!: string;

  @Prop({ required: true, index: true })
  email!: string;

  @Prop({ required: true })
  contactNumber!: string;

  @Prop({ type: String, default: '' })
  currentCompany!: string;

  @Prop({ type: String, default: '' })
  noticePeriod!: string;

  @Prop({ type: String, default: '' })
  primarySkills!: string;

  @Prop({ type: String, default: '' })
  secondarySkills!: string;

  @Prop({ type: String, default: '' })
  experience!: string;

  @Prop({ type: String, default: '' })
  location!: string;

  @Prop({ type: String, default: '' })
  recruiterEmail!: string;

  @Prop({ type: String, default: 'SUBMITTED', index: true })
  status!: string;

  @Prop({ type: Date, default: Date.now })
  submittedAt!: Date;

  @Prop({ type: String, default: null })
  resumePath!: string | null;

  @Prop({ type: String, default: null })
  resumeFileName!: string | null;
}

export const HpeBadgedSubmissionSchema =
  SchemaFactory.createForClass(HpeBadgedSubmissionDocumentModel);

HpeBadgedSubmissionSchema.index({ jobId: 1, candidateId: 1 }, { unique: true });
