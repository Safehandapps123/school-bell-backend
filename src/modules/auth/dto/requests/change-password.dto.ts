import { IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsNotEmpty()
  @IsString()
  currentPassword: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(128, { message: 'Password cannot be longer than 128 characters' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  newPassword: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(128, { message: 'Password cannot be longer than 128 characters' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  confirmNewPassword: string;
}
