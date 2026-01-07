import { MaxLength } from 'class-validator';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from './user.entity';
import { Student } from '../../student/entities/student.entity';

@Entity('parents')
export class Parent extends BaseEntity {
  @Column({ name: 'user_id' ,nullable : true})
  userId: number;

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

  @Column({ name: 'national_id', nullable: true })
  @MaxLength(50, { message: 'National ID cannot be longer than 50 characters' })
  nationalId: string;

  @Column({
    name: 'national_id_front',
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
  nationalIdFront: string;

  @Column({
    name: 'national_id_back',
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
  nationalIdBack: string;

  // Relations
  @OneToOne(() => User, { eager: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => Student, (student) => student.parent)
  students: Student[];
}
