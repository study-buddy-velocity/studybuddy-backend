import { IsArray, IsNotEmpty, IsOptional, IsString, IsMongoId } from 'class-validator';
import { User } from 'src/schemas/user.schema';

export class CreateUserDetailsDto {
  @IsOptional()
  @IsMongoId()
  userID?: String;

  @IsString()
  @IsNotEmpty()
  dob: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  phoneno: string;

  @IsString()
  @IsNotEmpty()
  schoolName: string;

  @IsString()
  @IsNotEmpty()
  class: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  subjects?: string[];

  @IsString()
  @IsOptional()
  profileImage?: string;
}