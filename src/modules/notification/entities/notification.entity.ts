import { MaxLength } from 'class-validator';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { NotificationTypeEnum } from '../enums/notification-type.enum';
import { NavigationData } from '../interfaces/notification.interface';
import { NotificationRecipient } from './notification-recipient.entity';
import { User } from 'src/modules/user/entities/user.entity';

@Entity('notifications')
export class Notification extends BaseEntity {
  @Column({ length: 255 })
  @MaxLength(255, {
    message: 'Notification title cannot exceed 255 characters',
  })
  title: string;

  @Column({ type: 'text' })
  @MaxLength(2000, {
    message: 'Notification message cannot exceed 2000 characters',
  })
  message: string;

  @Column({ type: 'jsonb', nullable: true })
  navigationData: NavigationData;

  // Creator information
  @Column({ nullable: true })
  createdById?: number;

  @Column({
    type: 'enum',
    enum: NotificationTypeEnum,
    default: NotificationTypeEnum.Direct,
  })
  type: NotificationTypeEnum;

  @CreateDateColumn(
    {
      type: 'timestamptz',
      default: () => 'CURRENT_TIMESTAMP',
    }
  )
  scheduledAt: Date;

  @Column({ nullable: true })
  @MaxLength(100, { message: 'OneSignal ID cannot exceed 100 characters' })
  oneSignalId: string;

  @OneToMany(() => NotificationRecipient, (nr) => nr.notification)
  recipients: NotificationRecipient[];

  @Column({ name: 'for_admin', nullable: true })
  forAdmin?: boolean;

  @ManyToOne(() => User, (user) => user.notifications)
  user: User;
}
