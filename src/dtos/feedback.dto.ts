import { IsArray, IsEnum, IsMongoId, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { FeedbackStatus } from 'src/schemas/feedback.schema';

export class CreateFeedbackDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsOptional()
  priority?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  subject?: string;

  @IsArray()
  @IsOptional()
  attachments?: string[];
}

export class UpdateFeedbackStatusDto {
  @IsEnum(FeedbackStatus)
  @IsNotEmpty()
  status: FeedbackStatus;

  @IsString()
  @IsOptional()
  adminResponse?: string;
}

export class FeedbackFilterDto {
  @IsEnum(FeedbackStatus)
  @IsOptional()
  status?: FeedbackStatus;

  @IsMongoId()
  @IsOptional()
  userId?: string;
}