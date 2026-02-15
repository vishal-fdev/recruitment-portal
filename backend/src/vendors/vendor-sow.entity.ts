import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
} from 'typeorm';
import { Vendor } from './vendors.entity';

@Entity()
export class VendorSOW {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  sowNumber: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  startDate: string;

  @Column({ nullable: true })
  endDate: string;

  @ManyToOne(() => Vendor, (vendor) => vendor.sows)
  vendor: Vendor;
}
