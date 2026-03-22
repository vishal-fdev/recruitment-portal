import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
} from 'typeorm';

import { Vendor } from './vendors.entity';

@Entity()
export class VendorEscalation {

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  contactType: string;

  @Column()
  name: string;

  @Column()
  email: string;

  @Column()
  phone: string;

  @Column()
  country: string;

  @Column()
  designation: string;

  @Column({ default: 'Pending' })
  approvalStatus: string;

  @Column({ default: 'Active' })
  status: string;

  @ManyToOne(() => Vendor, (vendor) => vendor.escalations, {
    onDelete: 'CASCADE',
  })
  vendor: Vendor;
}