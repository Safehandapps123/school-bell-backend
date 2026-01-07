import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'Email or phone number for login',
    example: 'user@example.com',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(15)
  @ValidateIf((o) => !o.identifier.includes('@'))
  @Matches(/^[0-9]{10,15}$/, {
    message: 'Phone number must be between 10 and 15 digits',
  })
  @ValidateIf((o) => o.identifier.includes('@'))
  @IsEmail({}, { message: 'Please provide a valid email address' })
  identifier: string;

  @ApiProperty({
    description: 'User password',
    example: 'yourPassword123',
    minimum: 8,
  })
  @IsNotEmpty()
  @IsString()
  password: string;

  @IsNotEmpty()
  @IsString()
  playerId: string;
}
