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

  @Column({ nullable: true })
  engagementStatus: string;

  @Column({ nullable: true })
  engagementType: string;

  @Column({ nullable: true })
  businessUnit: string;

  @Column({ nullable: true })
  evaluationStatus: string;

  @Column({ nullable: true })
  evaluatedBy: string;

  @Column({ nullable: true })
  extendedDate: string;

  @ManyToOne(() => Vendor, (vendor) => vendor.engagements, {
    onDelete: 'CASCADE',
  })
  vendor: Vendor;
}