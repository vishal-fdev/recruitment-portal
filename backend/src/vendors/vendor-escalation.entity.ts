import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
} from 'typeorm';
import { Vendor } from './vendors.entity';

@Entity()
export class VendorEscalation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  level: string;

  @Column()
  name: string;

  @Column()
  email: string;

  @Column()
  phone: string;

  @ManyToOne(() => Vendor, (vendor) => vendor.escalations)
  vendor: Vendor;
}
