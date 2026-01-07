import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { DeliveryPerson } from 'src/modules/delivery-person/entities/delivery-person.entity';
import { Student } from 'src/modules/student/entities/student.entity';
import { HowToReceiveEnum } from '../enums/how-to-receive.enum';
import { RequestStautsEnum } from '../enums/request-status.enum';
import { DeliveryPersonEnum } from '../enums/delivery-person.enum';

@Entity('req_for_receipts')
export class ReqForReceipt extends BaseEntity {
  @Column({ name: 'student_id' })
  studentId: number;

  @Column({ type: 'timestamptz'})
  date: Date;

  @Column({ name: 'request_reason', type: 'text', nullable: true })
  requestReason: string;

  @Column({
    type: 'enum',
    enum: HowToReceiveEnum,
    name: 'how_to_receive',
  })
  howToReceive: HowToReceiveEnum;

  @Column({
    type: 'enum',
    enum: DeliveryPersonEnum,
    name: 'delivery_person_type',
  })
  deliveryPersonType : DeliveryPersonEnum;

  @Column({ name: 'number_of_car', nullable: true })
  numberOfCar: string;

  @Column({ nullable: true })
  location: string;

  @Column({ name: 'delivery_id', nullable: true })
  deliveryId: number;

  @Column({
    type: 'enum',
    enum: RequestStautsEnum,
    name: 'status',
    default : RequestStautsEnum.PENDING
  })
  stauts :RequestStautsEnum;

  @Column({ name: 'cancellation_reason', type: 'text', nullable: true })
  cancellationReason: string;

  @Column({ name: 'cancelled_at', type: 'timestamptz', nullable: true })
  cancelledAt: Date;

  @Column({ name: 'reminder_count', type: 'int', default: 0 })
  reminderCount: number;

  // Relations
  @ManyToOne(() => Student, { eager: false })
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @ManyToOne(() => DeliveryPerson, { eager: false, nullable: true })
  @JoinColumn({ name: 'delivery_id' })
  deliveryPerson: DeliveryPerson;
}
