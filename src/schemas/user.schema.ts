import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types,Model } from 'mongoose';
import { UserDetails } from './userDetails.schema';
import * as mongoose from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true, minlength: 8 })
  password: string;

  @Prop({ required: true })
  role: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'UserDetails' })
  userDetails: Types.ObjectId; // Reference to UserDetails
}

const UserSchema = SchemaFactory.createForClass(User);


export { UserSchema };