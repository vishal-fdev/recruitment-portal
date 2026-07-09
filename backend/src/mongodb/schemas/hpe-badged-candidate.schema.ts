import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type HpeBadgedCandidateDocument =
  HydratedDocument<HpeBadgedCandidateDocumentModel>;

@Schema({ collection: 'hpe_badged_candidates', timestamps: true })
export class HpeBadgedCandidateDocumentModel {
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

  @Prop({ required: true })
  uploadedDate!: Date;

  @Prop({ required: true, default: 'SUBMITTED' })
  status!: string;

  @Prop({ type: String, default: null })
  resumePath!: string | null;

  @Prop({ type: String, default: null })
  resumeFileName!: string | null;
}

export const HpeBadgedCandidateSchema =
  SchemaFactory.createForClass(HpeBadgedCandidateDocumentModel);

HpeBadgedCandidateSchema.index({ jobId: 1, candidateId: 1 });
