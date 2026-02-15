import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
} from 'typeorm';
import { Vendor } from './vendors.entity';

@Entity()
export class VendorEngagement {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  engagementType: string;

  @Column({ nullable: true })
  startDate: string;

  @Column({ nullable: true })
  endDate: string;

  @ManyToOne(() => Vendor, (vendor) => vendor.engagements)
  vendor: Vendor;
}
