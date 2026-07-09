import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes } from 'mongoose';

export type HpeBadgedJobDocument =
  HydratedDocument<HpeBadgedJobDocumentModel>;

@Schema({ collection: 'hpe_badged_jobs', timestamps: true })
export class HpeBadgedJobDocumentModel {
  @Prop({ required: true, index: true, unique: true })
  jobId!: string;

  @Prop({ required: true })
  title!: string;

  @Prop({ type: String, default: '' })
  category!: string;

  @Prop({ type: String, default: '' })
  businessUnit!: string;

  @Prop({ type: String, default: '' })
  hiringManager!: string;

  @Prop({ type: String, default: '' })
  level!: string;

  @Prop({ type: String, default: '' })
  location!: string;

  @Prop({ type: String, default: 'Onsite' })
  workType!: string;

  @Prop({ type: String, default: 'NEW' })
  requestType!: string;

  @Prop({ type: String, default: '' })
  backfillEmployeeId!: string;

  @Prop({ type: String, default: '' })
  backfillEmployeeName!: string;

  @Prop({ type: Number, default: 1 })
  positions!: number;

  @Prop({ type: Number, default: 1 })
  currentPositions!: number;

  @Prop({ type: Date, default: null })
  startDate!: Date | null;

  @Prop({ type: Date, default: null })
  endDate!: Date | null;

  @Prop({ type: String, default: '' })
  region!: string;

  @Prop({ type: String, default: '' })
  dealName!: string;

  @Prop({ type: String, default: '' })
  justification!: string;

  @Prop({ type: String, default: '' })
  description!: string;

  @Prop({ type: String, default: '' })
  primarySkills!: string;

  @Prop({ type: String, default: '' })
  secondarySkills!: string;

  @Prop({ type: String, default: '' })
  experience!: string;

  @Prop({ type: SchemaTypes.Mixed, default: {} })
  panelDetails!: Record<string, unknown>;

  @Prop({ type: [SchemaTypes.Mixed], default: [] })
  positionsDetail!: any[];

  @Prop({ type: String, default: 'OPEN', index: true })
  status!: string;

  @Prop({ type: String, default: '' })
  createdByEmail!: string;

  @Prop({ type: [SchemaTypes.Mixed], default: [] })
  assignedRecruiters!: Array<{ id: string; name: string; email: string }>;
}

export const HpeBadgedJobSchema =
  SchemaFactory.createForClass(HpeBadgedJobDocumentModel);

HpeBadgedJobSchema.index({ jobId: 1 }, { unique: true });
HpeBadgedJobSchema.index({ 'assignedRecruiters.email': 1 });


