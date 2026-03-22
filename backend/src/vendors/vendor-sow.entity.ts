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

  @Column({ nullable: true })
  sowNumber: string;

  @Column({ nullable: true })
  startDate: string;

  @Column({ nullable: true })
  endDate: string;

  @Column({ nullable: true })
  tcValue: string;

  @Column({ nullable: true })
  approvalStatus: string;

  @Column({ nullable: true })
  status: string;

  @ManyToOne(() => Vendor, (vendor) => vendor.sows, {
    onDelete: 'CASCADE',
  })
  vendor: Vendor;
}