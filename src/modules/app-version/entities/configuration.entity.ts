import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';


@Entity('configuration')
export class Configuration {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'shipping_amount' , type: 'float'  , default: 10 })
  shippingAmount: number;
}
