import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes } from 'mongoose';
import { UserRole } from '../../users/user.entity';

export type UserDocument = HydratedDocument<UserDocumentModel>;

@Schema({ collection: 'users', timestamps: true })
export class UserDocumentModel {
  @Prop({ required: true, index: true, unique: true })
  postgresId!: number;

  @Prop({ required: true, index: true })
  email!: string;

  @Prop({ required: true, enum: Object.values(UserRole) })
  role!: UserRole;

  @Prop({ default: true })
  isActive!: boolean;

  @Prop({ type: String, default: null })
  vendorPostgresId!: string | null;

  @Prop({ type: SchemaTypes.Mixed, default: null })
  vendorSnapshot!: Record<string, unknown> | null;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'VendorDocumentModel', default: null })
  vendorRef!: string | null;
}

export const UserSchema = SchemaFactory.createForClass(UserDocumentModel);
