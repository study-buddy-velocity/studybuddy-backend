import { IsEmail, IsNotEmpty, MinLength, IsString } from 'class-validator';

export class UserDto {
@IsNotEmpty()
  id: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @IsNotEmpty()
  role: string;
}


export class QueryIdDto {
    @IsString()
    @IsNotEmpty()
    id: string;
  }