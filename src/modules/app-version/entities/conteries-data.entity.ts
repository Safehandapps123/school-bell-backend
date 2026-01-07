import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';


@Entity('countries_data')
export class CountriesData {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'name', type: 'varchar', length: 255 })
    name: string;

    @Column({ name: 'phone_code', type: 'varchar', length: 10 })
    phoneCode: string;

    @Column({ name: 'flag', type: 'varchar', length: 255 })
    flag: string;

    @Column({ name: 'number_of_digits', type: 'int' })
    numberOfDigits: number;

    @Column({ name: 'is_active', type: 'boolean', default: true })
    isActive: boolean;

    @Column({ name: 'currency', type: 'varchar', length: 10 , default: 'USD' })
    currency: string;
}
