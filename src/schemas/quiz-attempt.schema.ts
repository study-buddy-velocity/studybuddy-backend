import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({ timestamps: true })
export class QuizAnswer extends Document {
  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'Quiz' })
  quizId: MongooseSchema.Types.ObjectId;

  @Prop({ required: true })
  selectedAnswer: number; // Index of selected option

  @Prop({ required: true })
  isCorrect: boolean;

  @Prop({ required: false })
  timeSpent: number; // Time spent on this question in seconds
}

export const QuizAnswerSchema = SchemaFactory.createForClass(QuizAnswer);

@Schema({ timestamps: true })
export class QuizAttempt extends Document {
  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'User' })
  userId: MongooseSchema.Types.ObjectId;

  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'Subject' })
  subjectId: MongooseSchema.Types.ObjectId;

  @Prop({ required: true })
  topicId: string;

  @Prop({ type: [QuizAnswerSchema], required: true })
  answers: QuizAnswer[];

  @Prop({ required: true })
  totalQuestions: number;

  @Prop({ required: true })
  correctAnswers: number;

  @Prop({ required: true })
  score: number; // Percentage score

  @Prop({ required: true })
  totalTimeSpent: number; // Total time in seconds

  @Prop({ default: 'completed' })
  status: string; // completed, abandoned, etc.
}

export const QuizAttemptSchema = SchemaFactory.createForClass(QuizAttempt);
