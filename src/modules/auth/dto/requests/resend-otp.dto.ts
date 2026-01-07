import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsString,
  Length,
  Matches,
} from 'class-validator';

export class ResendOtpDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsBoolean()
  forgetPassword?: boolean;
}
