import { IsArray, IsBoolean, IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class OptionDto {
  @IsString()
  @IsNotEmpty()
  text: string;

  @IsBoolean()
  isCorrect: boolean;
}

export class CreateQuizDto {
  @IsString()
  @IsNotEmpty()
  question: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OptionDto)
  options: OptionDto[];

  @IsMongoId()
  @IsNotEmpty()
  subjectId: string;

  @IsString()
  @IsNotEmpty()
  topicId: string;

  @IsString()
  @IsOptional()
  type?: string;

  @IsNumber()
  @IsOptional()
  difficulty?: number;

  @IsString()
  @IsOptional()
  explanation?: string;

  @IsString()
  @IsOptional()
  classId?: string;
}

export class BulkCreateQuizDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuizDto)
  questions: CreateQuizDto[];
}

export class UpdateQuizDto {
  @IsString()
  @IsOptional()
  question?: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => OptionDto)
  options?: OptionDto[];

  @IsString()
  @IsOptional()
  type?: string;

  @IsNumber()
  @IsOptional()
  difficulty?: number;

  @IsString()
  @IsOptional()
  explanation?: string;
}

export class QuizFilterDto {
  @IsMongoId()
  @IsOptional()
  subjectId?: string;

  @IsString()
  @IsOptional()
  topicId?: string;

  @IsString()
  @IsOptional()
  classId?: string;
  
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Type(() => Number)
  noOfQuestions?: number;
}
