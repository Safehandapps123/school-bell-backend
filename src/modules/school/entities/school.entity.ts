import { MaxLength } from 'class-validator';
import { Column, Entity, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Student } from '../../student/entities/student.entity';
import { SchoolStatus } from '../enums/school-status.enum';
import { SchoolSubscription } from 'src/modules/subscription/entities/school-subscription.entity';

@Entity('schools')
export class School extends BaseEntity {
	@Column({ name: 'name' })
	@MaxLength(255, { message: 'Name cannot be longer than 255 characters' })
	name: string;

	@Column({
		name: 'logo',
		nullable: true,
		transformer: {
			to: (value: string) => value,
			from: (value: string) => {
				const baseUrl = process.env.IMAGEKIT_URL_ENDPOINT || 'https://yourbaseurl.com';
				if (!value) return value;
				if (value.startsWith('http://') || value.startsWith('https://')) {
					return value.replace(/^(http:\/\/|https:\/\/)[^\/]+/, baseUrl);
				}
				return `${baseUrl}${value}`;
			},
		},
	})
	logo: string;

	@Column({ type: 'text', nullable: true })
	description: string;

	@Column({ nullable: true })
	location: string;

	@Column({ type: 'enum', enum: SchoolStatus, default: SchoolStatus.ACTIVE })
	status: SchoolStatus;

	@Column({ type: 'text', array: true, nullable: true })
	stages: string[];
	
	@Column({ name: 'closed_time', type: 'time', nullable: true })
	closedTime : string;

	// Relations
	@OneToMany(() => Student, (student) => student.school)
	students: Student[];

	@OneToMany(() => SchoolSubscription, (subscription) => subscription.school)
	subscriptions: SchoolSubscription[];
}
