import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubscriptionService } from './subscription.service';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionPlan } from './entities/subscription-plan.entity';
import { SchoolSubscription } from './entities/school-subscription.entity';
import { School } from '../school/entities/school.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([SubscriptionPlan, SchoolSubscription, School]),
  ],
  controllers: [SubscriptionController],
  providers: [SubscriptionService],
  exports: [SubscriptionService],
})
export class SubscriptionModule {}
