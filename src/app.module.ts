import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import JWTConfig from './common/config/JWT-config';
import appConfig from './common/config/app.config';
import OvhStorageConfig from './common/config/cloud-storage.config';
import { dataSourceOptions } from './common/config/datasource-config';
import { LoggerMiddleware } from './logger.middleware';
import { AcceptLanguageResolver, I18nModule } from 'nestjs-i18n';
import * as path from 'node:path';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { CustomI18nModule } from './common/services/custom-i18n.module';
import { EmailVerificationModule } from './modules/email-verification/email-verification.module';
import { AppVersionModule } from './modules/app-version/app-version.module';
import { SchoolModule } from './modules/school/school.module';
import { StudentModule } from './modules/student/student.module';
import { DeliveryPersonModule } from './modules/delivery-person/delivery-person.module';
import { ReqForReceiptModule } from './modules/req-for-receipt/req-for-receipt.module';
import { NotificationModule } from './modules/notification/notification.module';
import { SubscriptionModule } from './modules/subscription/subscription.module';
import { PusherModule } from './common/services/pusher.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [JWTConfig, appConfig, OvhStorageConfig],
      envFilePath: ['.env'],
      cache: true,
    }),
    I18nModule.forRoot({
      loaderOptions: {
        path: path.join('dist/i18n/'),
        watch: true,
      },
      fallbackLanguage: 'ar',
      resolvers: [AcceptLanguageResolver],
    }),
    TypeOrmModule.forRoot(dataSourceOptions),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000,
          limit: 500,
        },
      ],
    }),
    EmailVerificationModule,
    CustomI18nModule,
    UserModule,
    AuthModule,
    AppVersionModule,
    SchoolModule,
    StudentModule,
    DeliveryPersonModule,
    ReqForReceiptModule,
    NotificationModule,
    SubscriptionModule,
    PusherModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {
  private nodeEnv: string;

  configure(consumer: MiddlewareConsumer) {
    this.nodeEnv = process.env.APP_ENV || 'development';
    // if (this.nodeEnv === 'development') {
      consumer
        .apply(LoggerMiddleware)
        .exclude(
          { path: 'payment/webhook', method: RequestMethod.POST }, // Exclude webhook
          { path: 'api/v1/payment/webhook', method: RequestMethod.ALL },
        )
        .forRoutes('*');
    }
  // }
}
