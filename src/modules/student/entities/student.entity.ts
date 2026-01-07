import { MaxLength } from 'class-validator';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { School } from '../../school/entities/school.entity';
import { Parent } from '../../user/entities/parent.entity';
import { User } from 'src/modules/user/entities/user.entity';
import { DeliveryPerson } from 'src/modules/delivery-person/entities/delivery-person.entity';

@Entity('students')
export class Student extends BaseEntity {
  @Column({ type: 'date', name: 'date_of_birth' })
  dateOfBirth: Date;

  @Column({ name: 'full_name', nullable: true })
  @MaxLength(100, { message: 'Full name cannot be longer than 100 characters' })
  fullName: string;

  @Column({
    name: 'profile_image',
    nullable: true,
    transformer: {
      to: (value: string) => value,
      from: (value: string) => {
        const baseUrl =
          process.env.IMAGEKIT_URL_ENDPOINT || 'https://yourbaseurl.com';
        if (!value) return value;
        if (value.startsWith('http://') || value.startsWith('https://')) {
          return value.replace(/^(http:\/\/|https:\/\/)[^\/]+/, baseUrl);
        }
        return `${baseUrl}${value}`;
      },
    },
  })
  profileImage: string;

  @Column({ nullable: true })
  @MaxLength(100, { message: 'Stage cannot be longer than 100 characters' })
  stage: string;

  @Column({ name: 'school_id' })
  schoolId: number;

  @Column({ nullable: true })
  @MaxLength(50, { message: 'Class cannot be longer than 50 characters' })
  class: string;

  @Column({ unique: true })
  @MaxLength(50, { message: 'Code cannot be longer than 50 characters' })
  code: string;

  @Column({ name: 'parent_id' ,nullable: true })
  parentId: number;

  @Column({ name: 'user_id' , nullable: true })
  userId: number;

  @Column({ name: 'has_account', default: false })
  hasAccount: boolean;

  // Relations
  @ManyToOne(() => School, { eager: false })
  @JoinColumn({ name: 'school_id' })
  school: School;

  @ManyToOne(() => Parent, (parent) => parent.students, { eager: false  ,nullable: true })
  @JoinColumn({ name: 'parent_id' })
  parent: Parent;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
