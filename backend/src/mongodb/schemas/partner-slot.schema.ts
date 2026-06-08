import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PartnerSlotDocument = HydratedDocument<PartnerSlotDocumentModel>;

@Schema({ collection: 'partnerSlots', timestamps: true })
export class PartnerSlotDocumentModel {
  @Prop({ required: true, index: true })
  postgresId!: number;

  @Prop({ required: true, index: true })
  candidatePostgresId!: number;

  @Prop({ required: true, index: true })
  jobPostgresId!: number;

  @Prop({ required: true, index: true })
  vendorPostgresId!: string;

  @Prop({ type: Object, default: null })
  candidateSnapshot!: Record<string, any> | null;

  @Prop({ type: Object, default: null })
  jobSnapshot!: Record<string, any> | null;

  @Prop({ type: Object, default: null })
  vendorSnapshot!: Record<string, any> | null;

  @Prop({ required: true })
  roundName!: string;

  @Prop({ required: true })
  interviewDate!: string;

  @Prop({ required: true })
  interviewTime!: string;

  @Prop({ type: String, default: null })
  hmComment!: string | null;

  @Prop({ required: true })
  status!: string;

  @Prop({ type: String, default: null })
  vendorJustification!: string | null;

  @Prop({ required: true })
  attendanceStatus!: string;

  @Prop({ type: String, default: null })
  attendanceComment!: string | null;

  @Prop({ default: false })
  hmFeedbackSubmitted!: boolean;

  @Prop({ type: Date, default: null })
  createdAt!: Date | null;

  @Prop({ type: Date, default: null })
  updatedAt!: Date | null;
}

export const PartnerSlotSchema = SchemaFactory.createForClass(
  PartnerSlotDocumentModel,
);
