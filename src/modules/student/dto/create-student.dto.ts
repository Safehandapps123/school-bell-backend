import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
  IsDateString,
  MaxLength,
  IsBoolean,
} from 'class-validator';

export class CreateStudentDto {
  @ApiProperty({ description: 'Student full name' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  fullName: string;

  @ApiProperty({ description: 'Date of birth', example: '2010-01-15' })
  @IsNotEmpty()
  @IsDateString()
  dateOfBirth: string;

  @ApiPropertyOptional({ description: 'Profile image URL' , type: 'string', format: 'binary' })
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
}
