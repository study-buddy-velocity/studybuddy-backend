import { IsNotEmpty, IsString } from 'class-validator';

export class ChatQueryDto {
  @IsString()
  @IsNotEmpty()
  subject: string;

  @IsString()
  @IsNotEmpty()
  query: string;
}