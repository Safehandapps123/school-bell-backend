import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsArray,
  IsOptional,
  MaxLength,
} from 'class-validator';

export class SchoolSignUpDto {
  @ApiProperty({ example: 'school@example.com', description: 'School email' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'Al-Noor School', description: 'School name' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({ example: '+201234567890', description: 'School phone number' })
  @IsNotEmpty()
  @IsString()
  phoneNumber: string;

  @ApiProperty({
    example: 'A leading educational institution',
    description: 'School description',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: 'Cairo, Egypt',
    description: 'School location',
    required: false,
  })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({
    example: ['الابتدائية', 'الإعدادية', 'الثانوية'],
    description: 'Educational stages',
    required: false,
    type: [String],
  })
  @ApiPropertyOptional({
    description: 'Education stages (مراحل)',
    type: [String],
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      return value
        .split(',')
        .map((s: string) => s.trim())
        .filter(Boolean);
    }
    return value;
  })
  @IsArray()
  @IsString({ each: true })
  stages?: string[];

  @ApiProperty({ example: 'Password123!', description: 'Account password' })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({
    example: 'player-id-123',
    description: 'Firebase Cloud Messaging player ID',
  })
  @IsNotEmpty()
  @IsString()
  playerId: string;
}
