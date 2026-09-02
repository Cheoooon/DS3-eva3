import { IsEmail, IsEnum, IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { Role } from '@prisma/client';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsEnum(Role)
  role: Role;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsOptional()
  @IsString()
  enrollmentCode?: string; // For Student

  @IsOptional()
  @IsString()
  career?: string; // For Student

  @IsOptional()
  @IsString()
  department?: string; // For Teacher
}
