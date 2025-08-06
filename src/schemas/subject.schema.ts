import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema()
export class Topic extends Document {
  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop({ required: false })
  classId: string;
}

export const TopicSchema = SchemaFactory.createForClass(Topic);

@Schema({ timestamps: true })
export class Subject extends Document {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop()
  description: string;

  @Prop({ type: [TopicSchema] })
  topics: Topic[];
}

export const SubjectSchema = SchemaFactory.createForClass(Subject);