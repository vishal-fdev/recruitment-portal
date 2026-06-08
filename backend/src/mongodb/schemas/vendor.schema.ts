import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes } from 'mongoose';

export type VendorDocument = HydratedDocument<VendorDocumentModel>;

@Schema({ collection: 'vendors', timestamps: true })
export class VendorDocumentModel {
  @Prop({ required: true, index: true, unique: true })
  postgresId!: string;

  @Prop({ required: true })
  name!: string;

  @Prop({ required: true, index: true })
  email!: string;

  @Prop({ default: true })
  isActive!: boolean;

  @Prop({ type: SchemaTypes.Mixed, default: null })
  profile!: Record<string, unknown> | null;

  @Prop({ type: [SchemaTypes.Mixed], default: [] })
  escalations!: Record<string, unknown>[];

  @Prop({ type: [SchemaTypes.Mixed], default: [] })
  engagements!: Record<string, unknown>[];

  @Prop({ type: [SchemaTypes.Mixed], default: [] })
  sows!: Record<string, unknown>[];
}

export const VendorSchema = SchemaFactory.createForClass(VendorDocumentModel);
