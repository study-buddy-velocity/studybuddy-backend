import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema()
export class Option extends Document {
  @Prop({ required: true })
  text: string;

  @Prop({ required: true })
  isCorrect: boolean;
}

export const OptionSchema = SchemaFactory.createForClass(Option);

@Schema({ timestamps: true })
export class Quiz extends Document {
  @Prop({ required: true })
  question: string;

  @Prop({ type: [OptionSchema], required: true })
  options: Option[];

  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'Subject' })
  subjectId: MongooseSchema.Types.ObjectId;

  @Prop({ required: true })
  topicId: string;

  @Prop({ default: 'multiple-choice' })
  type: string;

  @Prop({ default: 1 })
  difficulty: number;

  @Prop({ required: false })
  explanation?: string;
}

export const QuizSchema = SchemaFactory.createForClass(Quiz);