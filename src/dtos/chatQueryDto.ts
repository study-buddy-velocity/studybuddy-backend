import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChatQueryDto {
  @ApiProperty({
    description: 'Subject for the educational query',
    example: 'Physics'
  })
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiProperty({
    description: 'User\'s question or query',
    example: 'Explain Newton\'s laws of motion'
  })
  @IsString()
  @IsNotEmpty()
  query: string;

  @ApiProperty({
    description: "Topic for the educational query (optional)",
    example: "Quadratic Equations",
    required: false
  })
  @IsString()
  @IsOptional()
  topic?: string;
}