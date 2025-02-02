import { IsArray, IsNotEmpty, IsOptional, IsString, IsMongoId } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDetailsDto } from './createUserDetailsDto';


export class UpdateUserDetailsDto extends PartialType(CreateUserDetailsDto) {}