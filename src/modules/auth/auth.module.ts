import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PasswordService } from '../../common/helpers/encryption/password.service';
import { EmailVerificationModule } from '../email-verification/email-verification.module';
import { UserModule } from '../user/user.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { CustomI18nModule } from '../../common/services/custom-i18n.module';
import { User } from '../user/entities/user.entity';
import { Parent } from '../user/entities/parent.entity';
import { Student } from '../student/entities/student.entity';
import { School } from '../school/entities/school.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileUploadModule } from '../../common/fileUpload/file-upload.module';
import { DeliveryPerson } from '../delivery-person/entities/delivery-person.entity';

@Module({
  imports: [
    HttpModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        global: true,
        secret: configService.get<string>('JWT.secret'),
        signOptions: {
          expiresIn: configService.get('JWT.expiresIn', '15m'),
        },
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([User, Parent, Student, School ,DeliveryPerson]),
    UserModule,
    EmailVerificationModule,
    CustomI18nModule,
    FileUploadModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, PasswordService],
  exports: [AuthService],
})
export class AuthModule {}