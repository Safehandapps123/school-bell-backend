import { IsEmail, MaxLength } from 'class-validator';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Gender } from '../enums/gender.enum';
import { RolesEnum } from 'src/common/enums/roles.enum';
import { Notification } from 'src/modules/notification/entities/notification.entity';
import { UserStatus } from '../enums/user-status.enum';
import { School } from 'src/modules/school/entities/school.entity';
import { Parent } from './parent.entity';
import { Student } from 'src/modules/student/entities/student.entity';
import { DeliveryPerson } from 'src/modules/delivery-person/entities/delivery-person.entity';
import { on } from 'stream';

@Entity('users')
export class User extends BaseEntity {
  @Column({ nullable: true })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @MaxLength(255, { message: 'Email cannot be longer than 255 characters' })
  email: string;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.UNVERIFIED,
  })
  status: UserStatus;

  @Column({
    name: 'password',
    select: false,
    nullable: true,
  })
  @MaxLength(100, { message: 'Password cannot be longer than 100 characters' })
  password: string;

  @Column({
    type: 'enum',
    enum: Gender,
    nullable: true,
  })
  gender: Gender;



  @Column({ name: 'phone_number', nullable: true })
  @MaxLength(20, {
    message: 'Phone number cannot be longer than 20 characters',
  })
  phoneNumber: string;

  @Column({ default: false })
  isEmailVerified: boolean;

  @Column({
    type: 'enum',
    enum: RolesEnum,
    default: RolesEnum.PARENT,
  })
  role: RolesEnum;

  @Column({
    name : 'school_id'
  })
  schoolId : number;

  @Column({
    name : 'parent_id',
    nullable : true
  })
  parentId : number;

  @Column({
    name : 'delivery_person_id',
    nullable : true
  })
  deliveryPersonId : number;

  @Column({
    name : 'student_id',
    nullable : true
  })
  studentId : number;

  @Column({ type: 'jsonb', nullable: true, select: false })
  whitelistedTokens: string[]; // Store JTIs of whitelisted tokens

  @Column({ type: 'jsonb', nullable: true })
  playerIds?: string[];

  @OneToMany(() => Notification, (notification) => notification.user)
  notifications: Notification[];

  @ManyToOne(() => Parent, (parent) => parent.user, { nullable: true })
  @JoinColumn({
    name : 'parent_id'
  })
  parentProfile: Parent;

  @ManyToOne(() => Student, (student) => student.parent, { nullable: true })
  @JoinColumn({
    name : 'student_id'
  })
  studentProfile: Student;

  @ManyToOne(() => School, { nullable: true })
  @JoinColumn({ name: 'school_id' })
  school: School;

  @ManyToOne(() => DeliveryPerson, (deliveryPerson) => deliveryPerson.user, { nullable: true })
  @JoinColumn({
    name : 'delivery_person_id'
  })
  deliveryPersonProfile: DeliveryPerson;
}