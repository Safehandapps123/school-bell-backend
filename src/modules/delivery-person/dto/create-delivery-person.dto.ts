import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
  MaxLength,
} from 'class-validator';

export class CreateDeliveryPersonDto {
  @ApiProperty({ description: 'Full name of delivery person' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  fullName: string;

  @ApiPropertyOptional({
    description: 'Profile image',
    type: 'string',
    format: 'binary',
  })
  @IsOptional()
  profileImage?: any;

  @ApiPropertyOptional({
    description: 'National ID number',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  nationalId?: string;

  @ApiPropertyOptional({
    description: 'National ID front image',
    type: 'string',
    format: 'binary',
  })
  @IsOptional()
  @IsString()
  nationalIdFront?: string;

  @ApiPropertyOptional({
    description: 'National ID back image',
    type: 'string',
    format: 'binary',
  })    
  @IsOptional()
  @IsString()
  nationalIdBack?: string;

  @ApiProperty({ description: 'User ID associated with the delivery person' })
  @IsNotEmpty()
  @IsString()
  email: string;

  @ApiProperty({ description: 'Password for the delivery person account' })
  @IsNotEmpty()
  @IsString()
  password: string;

  @ApiProperty({ description: 'Phone number of the delivery person' })
  @IsNotEmpty()
  @IsString()
  phoneNumber: string;
}
