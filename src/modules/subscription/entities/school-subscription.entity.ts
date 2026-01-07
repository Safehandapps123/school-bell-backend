import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { School } from '../../school/entities/school.entity';
import { SubscriptionPlan } from './subscription-plan.entity';
import { SubscriptionStatus } from '../enums/subscription-status.enum';

@Entity('school_subscriptions')
export class SchoolSubscription extends BaseEntity {
  @Column({ name: 'school_id' })
  schoolId: number;

  @Column({ name: 'plan_id' })
  planId: number;

  @Column({ type: 'timestamptz', name: 'start_date' })
  startDate: Date;

  @Column({ type: 'timestamptz', name: 'end_date' })
  endDate: Date;

  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.ACTIVE,
  })
  status: SubscriptionStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'paid_amount' })
  paidAmount: number;

  @Column({ type: 'text', nullable: true, name: 'payment_method' })
  paymentMethod: string;

  @Column({ type: 'text', nullable: true, name: 'payment_reference' })
  paymentReference: string;

  @Column({ type: 'boolean', default: false, name: 'auto_renew' })
  autoRenew: boolean;

  // Relations
  @ManyToOne(() => School, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'school_id' })
  school: School;

  @ManyToOne(() => SubscriptionPlan, (plan) => plan.subscriptions)
  @JoinColumn({ name: 'plan_id' })
  plan: SubscriptionPlan;
}
