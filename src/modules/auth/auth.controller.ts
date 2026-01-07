import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  Delete,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SuccessResponse } from 'src/common/interceptors/success-response.interceptor';
import { User } from '../user/entities/user.entity';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/requests/login.dto';
import { ParentSignUpDto } from './dto/requests/parent-sign-up.dto';
import { StudentSignUpDto } from './dto/requests/student-sign-up.dto';
import { SchoolSignUpDto } from './dto/requests/school-sign-up.dto';
import { EmailVerificationService } from '../email-verification/email-verification.service';
import { VerifyEmailDto } from '../email-verification/dto/verify-email.dto';
import { ResendOtpDto } from './dto/requests/resend-otp.dto';
import { ForgetPasswordDto } from './dto/requests/forget-password.dto';
import { UpdatePasswordDto } from './dto/requests/update-password.dto';
import { ChangePasswordDto } from './dto/requests/change-password.dto';
import { CurrentUser } from '../../common/guards/user.decorator';
import { JwtAuthGuard } from '../../common/guards/auth.guard';
import { Auth } from 'src/common/guards/auth.decorator';

@ApiTags('auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly emailVerificationService: EmailVerificationService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @SuccessResponse('auth.LOGIN_SUCCESSFUL')
  async login(@Body() loginDto: LoginDto) {
    const results = await this.authService.login(loginDto);
    return results;
  }

  @Post('parent/sign-up')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'profileImage', maxCount: 1 },
      { name: 'nationalIdFront', maxCount: 1 },
      { name: 'nationalIdBack', maxCount: 1 },
    ]),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        profileImage: { type: 'string', format: 'binary' },
        nationalIdFront: { type: 'string', format: 'binary' },
        nationalIdBack: { type: 'string', format: 'binary' },
        email: { type: 'string', example: 'parent@example.com' },
        fullName: { type: 'string', example: 'Ahmed Mohamed' },
        phoneNumber: { type: 'string', example: '+201234567890' },
        nationalId: { type: 'string', example: '12345678901234' },
        password: { type: 'string', example: 'Password123!' },
        playerId: { type: 'string', example: 'player-id-123' },
        schoolId: { type: 'number', example: 1 },
      },
      required: [
        'email',
        'fullName',
        'phoneNumber',
        'nationalId',
        'password',
        'playerId',
        'schoolId',
      ],
    },
  })
  @ApiOperation({ summary: 'Register new parent user with image uploads' })
  @ApiResponse({ status: 200, description: 'Registration successful' })
  @SuccessResponse('auth.SIGNUP_SUCCESSFUL')
  async signupParent(
    @Body() signDto: ParentSignUpDto,
    @UploadedFiles()
    files: {
      profileImage?: Express.Multer.File[];
      nationalIdFront?: Express.Multer.File[];
      nationalIdBack?: Express.Multer.File[];
    },
  ) {
    const user = await this.authService.signupParent(
      signDto,
      files?.profileImage?.[0],
      files?.nationalIdFront?.[0],
      files?.nationalIdBack?.[0],
    );

    // await this.emailVerificationService.sendVerificationCode({
    //   email: user.email,
    // });

    return user;
  }

  @Post('student/sign-up')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'profileImage', maxCount: 1 }]),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    type: StudentSignUpDto,
  })
  @ApiOperation({ summary: 'Register new student user with profile image' })
  @ApiResponse({ status: 200, description: 'Registration successful' })
  @SuccessResponse('auth.SIGNUP_SUCCESSFUL')
  async signupStudent(
    @Body() signDto: StudentSignUpDto,
    @UploadedFiles()
    files: {
      profileImage?: Express.Multer.File[];
    },
  ) {
    const user = await this.authService.signupStudent(
      signDto,
      files?.profileImage?.[0],
    );

    // await this.emailVerificationService.sendVerificationCode({
    //   email: user.email,
    // });

    return user;
  }

  @Post('school/sign-up')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileFieldsInterceptor([{ name: 'logo', maxCount: 1 }]))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        logo: { type: 'string', format: 'binary' },
        email: { type: 'string', example: 'school@example.com' },
        name: { type: 'string', example: 'Al-Noor School' },
        phoneNumber: { type: 'string', example: '+201234567890' },
        description: {
          type: 'string',
          example: 'A leading educational institution',
        },
        location: { type: 'string', example: 'Cairo, Egypt' },
        stages: {
          type: 'array',
          items: { type: 'string' },
          example: ['الابتدائية', 'الإعدادية', 'الثانوية'],
        },
        password: { type: 'string', example: 'Password123!' },
        playerId: { type: 'string', example: 'player-id-123' },
      },
      required: ['email', 'name', 'phoneNumber', 'password', 'playerId'],
    },
  })
  @ApiOperation({ summary: 'Register new school with logo' })
  @ApiResponse({ status: 200, description: 'Registration successful' })
  @SuccessResponse('auth.SIGNUP_SUCCESSFUL')
  async signupSchool(
    @Body() signDto: SchoolSignUpDto,
    @UploadedFiles()
    files: {
      logo?: Express.Multer.File[];
    },
  ) {
    const result = await this.authService.signupSchool(
      signDto,
      files?.logo?.[0],
    );

    // await this.emailVerificationService.sendVerificationCode({
    //   email: result.email,
    // });

    return result;
  }

  @Get('get-me')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get current user info' })
  @ApiResponse({ status: 200, description: 'User info retrieved successfully' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @SuccessResponse('auth.USER_INFO_RETRIEVED')
  async getMe(@CurrentUser() user: User) {
    return this.authService.getMe(user.id);
  }

  @Delete('delete-account')
  @Auth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete current user account' })
  @ApiResponse({
    status: 200,
    description: 'User account deleted successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @SuccessResponse('auth.USER_ACCOUNT_DELETED')
  async deleteAccount(@CurrentUser() user: User) {
    return this.authService.deleteAccount(user.id);
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @SuccessResponse('auth.VERIFY_EMAIL_SUCCESSFUL')
  @ApiOperation({
    summary: 'second step to verify email on forget password or signup',
  })
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
    return this.emailVerificationService.verifyEmail(verifyEmailDto);
  }

  @Post('resend-otp')
  @HttpCode(HttpStatus.OK)
  @SuccessResponse('auth.VERIFY_EMAIL_SUCCESSFUL')
  async resendOtp(@Body() resendOtpDto: ResendOtpDto) {
    return await this.emailVerificationService.sendVerificationCode(
      resendOtpDto,
      resendOtpDto?.forgetPassword,
    );
  }

  @Post('forget-password')
  @HttpCode(HttpStatus.OK)
  @SuccessResponse('auth.VERIFY_EMAIL_SUCCESSFUL')
  @ApiOperation({ summary: 'first step click on Forget password' })
  async forgetPassword(@Body() forgetPasswordDto: ForgetPasswordDto) {
    return await this.emailVerificationService.sendVerificationCode(
      forgetPasswordDto,
      true,
    );
  }

  @Post('update-password')
  @HttpCode(HttpStatus.OK)
  @SuccessResponse('auth.UPDATE_PASSWORD_SUCCESSFUL')
  @ApiOperation({ summary: 'final step to update password' })
  async updatePassword(@Body() updatePasswordDto: UpdatePasswordDto) {
    return this.authService.updatePassword(updatePasswordDto);
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Change user password' })
  @SuccessResponse('auth.PASSWORD_CHANGED_SUCCESSFULLY')
  async changePassword(
    @Body() body: ChangePasswordDto,
    @CurrentUser() user: User,
  ) {
    return this.authService.changePassword(body, user.id);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Logout user' })
  @SuccessResponse('auth.LOGOUT_SUCCESSFUL')
  async logout(@Request() req) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    await this.authService.logout(req.user.id, token);
    return { message: 'Logged out successfully' };
  }

  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Logout user from all devices' })
  @SuccessResponse('auth.LOGOUT_SUCCESSFUL')
  async logoutFromAllDevices(@CurrentUser() user: User) {
    await this.authService.logoutFromAllDevices(user.id);
    return { message: 'Logged out from all devices successfully' };
  }
}
