import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export enum FeedbackStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  REJECTED = 'rejected',
  OPEN = 'open',
  IN_PROGRESS = 'in-progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed'
}

@Schema({ timestamps: true })
export class Feedback extends Document {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true, type: MongooseSchema.Types.ObjectId })
  userId: MongooseSchema.Types.ObjectId;

  @Prop({ required: true })
  userName: string;

  @Prop({
    type: String,
    enum: Object.values(FeedbackStatus),
    default: FeedbackStatus.PENDING
  })
  status: FeedbackStatus;

  @Prop({ type: String, default: null })
  adminResponse: string;

  @Prop({
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  })
  priority: string;

  @Prop({ type: String, default: 'General' })
  category: string;

  @Prop({ type: String, default: null })
  subject: string;

  @Prop({ type: [String], default: [] })
  attachments: string[];
}

export const FeedbackSchema = SchemaFactory.createForClass(Feedback);