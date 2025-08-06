import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class TopicDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class SubjectDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsOptional()
  topics?: TopicDto[];
}

export class UpdateSubjectDto extends SubjectDto {}

export class AddTopicDto {
  @IsString()
  @IsNotEmpty()
  subjectId: string;
  
  @IsNotEmpty()
  topic: TopicDto;
}

export class UpdateTopicDto {
  @IsString()
  @IsNotEmpty()
  subjectId: string;
  
  @IsString()
  @IsNotEmpty()
  topicId: string;
  
  @IsNotEmpty()
  topic: TopicDto;
}