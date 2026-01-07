import { Column, Entity, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { SchoolSubscription } from './school-subscription.entity';

@Entity('subscription_plans')
export class SubscriptionPlan extends BaseEntity {
  @Column({ name: 'name' })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'int', comment: 'Duration in days' })
  duration: number;

  @Column({ type: 'int', nullable: true, name: 'max_students' })
  maxStudents: number;

  @Column({ type: 'int', nullable: true, name: 'max_delivery_persons' })
  maxDeliveryPersons: number;

  @Column({ type: 'jsonb', nullable: true })
  features: string[];

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  // Relations
  @OneToMany(() => SchoolSubscription, (subscription) => subscription.plan)
  subscriptions: SchoolSubscription[];
}
