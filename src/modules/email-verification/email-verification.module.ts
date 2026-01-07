import { Module } from '@nestjs/common';
import { EmailVerificationService } from './email-verification.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailVerification } from './entities/email-verification.entity';
import { User } from '../user/entities/user.entity';
import { ServerEmailModule } from 'src/common/email/email.module';
import { CustomI18nModule } from 'src/common/services/custom-i18n.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([EmailVerification, User]),
    ServerEmailModule,
    CustomI18nModule,
  ],
  providers: [EmailVerificationService],
  exports: [EmailVerificationService],
})
export class EmailVerificationModule {}
