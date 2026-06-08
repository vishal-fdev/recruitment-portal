import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes } from 'mongoose';
import { CandidateStatus } from '../../candidates/candidate-status.enum';

export type CandidateDocument = HydratedDocument<CandidateDocumentModel>;

@Schema({ collection: 'candidates', timestamps: true })
export class CandidateDocumentModel {
  @Prop({ required: true, index: true, unique: true })
  postgresId!: number;

  @Prop({ required: true })
  name!: string;

  @Prop({ required: true, index: true })
  email!: string;

  @Prop({ required: true })
  phone!: string;

  @Prop({ type: String, default: null })
  aadharNo!: string | null;

  @Prop({ type: String, default: null })
  gender!: string | null;

  @Prop({ type: String, default: null })
  education!: string | null;

  @Prop({ type: String, default: null })
  videoLink!: string | null;

  @Prop({ type: String, default: null })
  primarySkills!: string | null;

  @Prop({ type: String, default: null })
  secondarySkills!: string | null;

  @Prop({ type: String, default: null })
  country!: string | null;

  @Prop({ type: String, default: null })
  state!: string | null;

  @Prop({ type: String, default: null })
  city!: string | null;

  @Prop({ required: true })
  experience!: number;

  @Prop({ default: 0 })
  noticePeriod!: number;

  @Prop({ required: true })
  currentOrg!: string;

  @Prop({ required: true })
  resumePath!: string;

  @Prop({ enum: Object.values(CandidateStatus), default: CandidateStatus.NEW })
  status!: CandidateStatus;

  @Prop({ type: String, default: null })
  dropJustification!: string | null;

  @Prop({ type: String, default: null })
  ytjJustification!: string | null;

  @Prop({ type: String, default: null })
  dateOfJoining!: string | null;

  @Prop({ type: String, default: null })
  vendorPostgresId!: string | null;

  @Prop({ type: Number, default: null })
  jobPostgresId!: number | null;

  @Prop({ type: Number, default: null })
  positionPostgresId!: number | null;

  @Prop({ type: SchemaTypes.Mixed, default: null })
  vendorSnapshot!: Record<string, unknown> | null;

  @Prop({ type: SchemaTypes.Mixed, default: null })
  jobSnapshot!: Record<string, unknown> | null;

  @Prop({ type: SchemaTypes.Mixed, default: null })
  positionSnapshot!: Record<string, unknown> | null;

  @Prop({ type: [SchemaTypes.Mixed], default: [] })
  interviews!: Record<string, unknown>[];
}

export const CandidateSchema =
  SchemaFactory.createForClass(CandidateDocumentModel);
