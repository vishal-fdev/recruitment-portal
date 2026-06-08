import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes } from 'mongoose';
import { JobStatus } from '../../jobs/job-status.enum';

export type JobDocument = HydratedDocument<JobDocumentModel>;

@Schema({ collection: 'jobs', timestamps: true })
export class JobDocumentModel {
  @Prop({ required: true, index: true, unique: true })
  postgresId!: number;

  @Prop({ required: true })
  title!: string;

  @Prop()
  location!: string;

  @Prop()
  experience!: string;

  @Prop({ type: String, default: null })
  department!: string | null;

  @Prop({ type: String, default: null })
  jobCategory!: string | null;

  @Prop({ type: String, default: null })
  workType!: string | null;

  @Prop({ type: String, default: null })
  region!: string | null;

  @Prop({ type: String, default: null })
  dealName!: string | null;

  @Prop({ type: String, default: null })
  hiringManager!: string | null;

  @Prop({ type: String, default: null })
  justification!: string | null;

  @Prop({ type: String, default: null })
  employmentType!: string | null;

  @Prop({ type: String, default: null })
  budget!: string | null;

  @Prop({ type: String, default: null })
  startDate!: string | null;

  @Prop({ type: String, default: null })
  endDate!: string | null;

  @Prop({ type: String, default: null })
  level!: string | null;

  @Prop({ type: Number, default: null })
  numberOfPositions!: number | null;

  @Prop({ type: Number, default: null })
  currentNumberOfPositions!: number | null;

  @Prop({ type: String, default: null })
  requestType!: string | null;

  @Prop({ type: String, default: null })
  backfillEmployeeId!: string | null;

  @Prop({ type: String, default: null })
  backfillEmployeeName!: string | null;

  @Prop({ type: String, default: null })
  description!: string | null;

  @Prop({ enum: Object.values(JobStatus), default: JobStatus.PENDING_APPROVAL })
  status!: JobStatus;

  @Prop({ default: true })
  isActive!: boolean;

  @Prop({ type: String, default: null })
  jdPath!: string | null;

  @Prop({ type: String, default: null })
  jdFileName!: string | null;

  @Prop({ type: String, default: null })
  jdMimeType!: string | null;

  @Prop({ type: String, default: null })
  jdFiles!: string | null;

  @Prop({ type: String, default: null })
  psqPath!: string | null;

  @Prop({ type: String, default: null })
  psqFileName!: string | null;

  @Prop({ type: String, default: null })
  psqMimeType!: string | null;

  @Prop({ type: String, default: null })
  psqFiles!: string | null;

  @Prop({ type: [SchemaTypes.Mixed], default: [] })
  positions!: Record<string, unknown>[];

  @Prop({ type: [SchemaTypes.Mixed], default: [] })
  interviewRounds!: Record<string, unknown>[];

  @Prop({ type: [SchemaTypes.Mixed], default: [] })
  jobVendors!: Record<string, unknown>[];

  @Prop({ type: [SchemaTypes.Mixed], default: [] })
  candidates!: Record<string, unknown>[];
}

export const JobSchema = SchemaFactory.createForClass(JobDocumentModel);
