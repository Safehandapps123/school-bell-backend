import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
  IsOptional,
  IsNumber,
} from 'class-validator';

export class ParentSignUpDto {
  @ApiProperty({ description: 'User email address' })
  @IsNotEmpty()
  @IsString()
  @IsEmail({}, { message: 'Email must be a valid email address' })
  @MaxLength(255, { message: 'Email cannot be longer than 255 characters' })
  email: string;

  @ApiProperty({ description: 'Full name of the parent' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(200, { message: 'Name cannot be longer than 200 characters' })
  fullName: string;

  @ApiProperty({ description: 'Phone number' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(20, { message: 'Phone number cannot be longer than 20 characters' })
  phoneNumber: string;

  @ApiProperty({ description: 'National ID number' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(50, { message: 'National ID cannot be longer than 50 characters' })
  nationalId: string;

  @ApiPropertyOptional({ description: 'National ID front image' })
  @IsOptional()
  @IsString()
  nationalIdFront?: string;

  @ApiPropertyOptional({ description: 'National ID back image' })
  @IsOptional()
  @IsString()
  nationalIdBack?: string;

  @ApiPropertyOptional({ description: 'Profile image' })
  @IsOptional()
  @IsString()
  profileImage?: string;

  @ApiProperty({ description: 'User password' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(128, { message: 'Password cannot be longer than 128 characters' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  @ApiProperty({ description: 'OneSignal player ID for notifications' })
  @IsNotEmpty()
  @IsString()
  playerId: string;

  @ApiProperty({ description: 'School ID' })
  @IsNotEmpty()
  @IsNumber()
  schoolId: number;
}

