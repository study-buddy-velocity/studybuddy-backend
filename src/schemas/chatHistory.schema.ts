import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import * as mongoose from 'mongoose';

export type ChatHistoryDocument = HydratedDocument<ChatHistory>;

@Schema({ timestamps: true })
export class QueryResponse {
  @Prop({ required: true })
  query: string;

  @Prop({ required: true })
  response: string;

  @Prop({ required: true })
  tokensUsed: number;

  @Prop({ required: false })
  summary: string;
}

@Schema() export class SubjectWise {
  @Prop({ required: true})
  subject: string;

  @Prop({type: [QueryResponse], default: null})
  queries: QueryResponse[];
}

@Schema({ timestamps: true })
export class ChatHistory {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId; // Reference to the User schema

  @Prop({ required: true })
  date: String; // Tracks the day for the queries

  @Prop({ type: [SubjectWise], default: null })
  subjectWise: SubjectWise[]; // List of query-response pairs for the day with subject

  @Prop({ required: true, default: 0 })
  totalTokensSpent: number; // Total tokens spent for the day

  @Prop({ type: [String], required: true, default: null })
  subjects: String[]; // Subjects learned this day
}

const QueryResponseSchema = SchemaFactory.createForClass(QueryResponse);
const ChatHistorySchema = SchemaFactory.createForClass(ChatHistory);

// Ensure one document per user per day
ChatHistorySchema.index({ userId: 1, date: 1 }, { unique: true });

export { ChatHistorySchema, QueryResponseSchema };
