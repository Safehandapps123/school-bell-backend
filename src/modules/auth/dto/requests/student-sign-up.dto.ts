import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
  IsOptional,
  IsNumber,
  IsDateString,
} from 'class-validator';

export class StudentSignUpDto {
  @ApiProperty({ description: 'Student email address' })
  @IsNotEmpty()
  @IsString()
  @IsEmail({}, { message: 'Email must be a valid email address' })
  @MaxLength(255, { message: 'Email cannot be longer than 255 characters' })
  email: string;

  @ApiProperty({ description: 'Full name of the student' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100, { message: 'Name cannot be longer than 100 characters' })
  fullName: string;

  @ApiProperty({ description: 'Phone number' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(20, { message: 'Phone number cannot be longer than 20 characters' })
  phoneNumber: string;

  @ApiProperty({ description: 'Date of birth', example: '2010-01-15' })
  @IsNotEmpty()
  @IsDateString()
  dateOfBirth: string;

  @ApiPropertyOptional({ description: 'Profile image' , type: 'string', format: 'binary' })
  @IsOptional()
  @IsString()
  profileImage?: string;

  @ApiPropertyOptional({ description: 'Education stage/grade' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  stage?: string;

  @ApiPropertyOptional({ description: 'Class/Section' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  class?: string;

  @ApiProperty({ description: 'Unique student code' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  code: string;

  @ApiProperty({ description: 'User password' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(128, { message: 'Password cannot be longer than 128 characters' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  @ApiProperty({ description: 'OneSignal player ID for notifications' })
  @IsString()
  @IsOptional()
  playerId ?: string;

  @ApiProperty({ description: 'School ID' })
  @IsNotEmpty()
  @IsNumber()
  schoolId: number;
}
