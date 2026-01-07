import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EmailVerification } from './entities/email-verification.entity';
import { MoreThan, Repository } from 'typeorm';
import { User } from '../user/entities/user.entity';
import { ServerEmailService } from 'src/common/email/email.service';
import { CustomI18nService } from 'src/common/services/custom-i18n.service';
import { SendVerificationDto } from './dto/send-verification.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import * as crypto from 'node:crypto';

@Injectable()
export class EmailVerificationService {
  constructor(
    @InjectRepository(EmailVerification)
    private readonly emailVerificationRepository: Repository<EmailVerification>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly emailService: ServerEmailService,
    private readonly i18n: CustomI18nService,
  ) {}

  async sendVerificationCode(sendVerificationDto: SendVerificationDto ,forgetPassword?: boolean) {
    const { email } = sendVerificationDto;

    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException(`User with email ${email} not found.`);
    }

    if (user.isEmailVerified && !forgetPassword) {
      throw new BadRequestException('Email is already verified');
    }

    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    const recentAttempts = await this.emailVerificationRepository.count({
      where: {
        userId: user.id,
        createdAt: MoreThan(oneHourAgo),
      },
    });

    if (recentAttempts >= 5) {
      throw new BadRequestException(
        'Too many verification attempts. Please try again later.',
      );
    }

    const oneMinuteAgo = new Date();
    oneMinuteAgo.setMinutes(oneMinuteAgo.getMinutes() - 1);

    const recentRequest = await this.emailVerificationRepository.findOne({
      where: {
        userId: user.id,
        createdAt: MoreThan(oneMinuteAgo),
      },
      order: { createdAt: 'DESC' },
    });

    if (recentRequest) {
      throw new BadRequestException(
        'A verification code was sent recently. Please wait before requesting a new one.',
      );
    }

    const otpCode = this.generateOTP();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 120);

    const emailVerification = this.emailVerificationRepository.create({
      userId: user.id,
      otpCode,
      expiresAt,
    });

    await this.emailVerificationRepository.save(emailVerification);

    this.emailService.sendVerificationEmail(
      'ssss',
      user.email,
      otpCode,
    ) .catch((err) => {
      console.error('Failed to send email:', err.message);
    });

    return {
      message: 'Verification code sent successfully.',
      expiresIn: '15 minutes',
    };
  }

  async verifyEmail(verifyEmailDto: VerifyEmailDto) {
    const { email, otpCode , forgetPassword } = verifyEmailDto;

    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException(`User with email ${email} not found.`);
    }


    const verification = await this.emailVerificationRepository.findOne({
      where: {
        userId: user.id,
        otpCode,
        isUsed: false,
        expiresAt: MoreThan(new Date()),
      },
      order: { createdAt: 'DESC' },
    });

    if (!verification) {
      const latestVerification = await this.emailVerificationRepository.findOne(
        {
          where: { userId: user.id, isUsed: false },
          order: { createdAt: 'DESC' },
        },
      );

      if (latestVerification) {
        latestVerification.attempts += 1;
        await this.emailVerificationRepository.save(latestVerification);

        if (latestVerification.attempts >= 5) {
          latestVerification.isUsed = true;
          await this.emailVerificationRepository.save(latestVerification);
          return { message: 'Too many attempts. Please request a new verification code.' };
        }
      }

      throw new BadRequestException(this.i18n.t('email-verification.INVALID_VERIFICATION_CODE'));
    }

    if(forgetPassword){
      return ;
    }
    verification.isUsed = true;
    await this.emailVerificationRepository.save(verification);

    user.isEmailVerified = true;
    await this.userRepository.save(user);
  }

  private generateOTP(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  async cleanupExpiredCodes() {
    const result = await this.emailVerificationRepository.delete({
      expiresAt: MoreThan(new Date()),
    });
    return result.affected;
  }
}
