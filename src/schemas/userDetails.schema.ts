import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types  } from 'mongoose';
import * as mongoose from 'mongoose';
import { User } from './user.schema';

export type UserDetailsDocument = HydratedDocument<UserDetails>;

@Schema({ timestamps: true })
export class UserDetails {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    user: Types.ObjectId; // Reference to the User

  @Prop({ required: true})
  dob: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  phoneno: string;

  @Prop({ required: true })
  schoolName: string;

  @Prop({ required: true })
  class: string;

  @Prop([String])
  subjects: string[];

  @Prop({ required: false })
  profileImage: string;
}

export const UserDetailsSchema = SchemaFactory.createForClass(UserDetails);