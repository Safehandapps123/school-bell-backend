import { INestApplication, Req } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AuthModule } from '../../modules/auth/auth.module';
import { UserModule } from '../../modules/user/user.module';
import { AppVersionModule } from '../../modules/app-version/app-version.module';
import { SchoolModule } from 'src/modules/school/school.module';
import { StudentModule } from 'src/modules/student/student.module';
import { DeliveryPersonModule } from 'src/modules/delivery-person/delivery-person.module';
import { ReqForReceiptModule } from 'src/modules/req-for-receipt/req-for-receipt.module';
import { NotificationModule } from 'src/modules/notification/notification.module';
import { SubscriptionModule } from 'src/modules/subscription/subscription.module';

export function setupSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('School bell API')
    .setDescription('School bell API description')
    .setVersion('2.0.0')
    .addBearerAuth()
    .addSecurityRequirements('bearer')
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    include: [
      AuthModule,
      UserModule,
      AppVersionModule,
      SchoolModule,
      StudentModule,
      DeliveryPersonModule,
      ReqForReceiptModule,
      NotificationModule,
      SubscriptionModule
    ],
  });

  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
    customSiteTitle: 'School bell API Documentation',
    customCss: '.swagger-ui .topbar { display: none }',
  });
}
