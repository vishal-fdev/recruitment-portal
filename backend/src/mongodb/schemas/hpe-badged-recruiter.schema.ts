import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type HpeBadgedRecruiterDocument =
  HydratedDocument<HpeBadgedRecruiterDocumentModel>;

@Schema({ collection: 'hpe_badged_recruiters', timestamps: true })
export class HpeBadgedRecruiterDocumentModel {
  @Prop({ required: true })
  name!: string;

  @Prop({ required: true, index: true, unique: true })
  email!: string;

  @Prop({ default: true })
  isActive!: boolean;

  @Prop({ type: String, default: '' })
  createdByEmail!: string;
}

export const HpeBadgedRecruiterSchema =
  SchemaFactory.createForClass(HpeBadgedRecruiterDocumentModel);

HpeBadgedRecruiterSchema.index({ email: 1 }, { unique: true });

