import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReqForReceiptService } from './req-for-receipt.service';
import { ReqForReceiptController } from './req-for-receipt.controller';
import { ReqForReceipt } from './entities/req-for-receipt.entity';
import { Student } from '../student/entities/student.entity';
import { DeliveryPerson } from '../delivery-person/entities/delivery-person.entity';
import { NotificationModule } from '../notification/notification.module';
import { School } from '../school/entities/school.entity';
import { SubscriptionModule } from '../subscription/subscription.module';
import { User } from '../user/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ReqForReceipt, Student, DeliveryPerson, School ,User]),
    NotificationModule,
    SubscriptionModule,
   ],
  controllers: [ReqForReceiptController],
  providers: [ReqForReceiptService],
  exports: [ReqForReceiptService],
})
export class ReqForReceiptModule {}
