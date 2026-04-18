import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Column,
} from 'typeorm';
import { Job } from './job.entity';
import { Vendor } from '../vendors/vendors.entity';

@Entity()
export class JobVendor {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Job, (job) => job.jobVendors, {
    onDelete: 'CASCADE',
  })
  job!: Job;

  @ManyToOne(() => Vendor, {
    eager: true,
    onDelete: 'CASCADE',
  })
  vendor!: Vendor;

  @Column({ default: true })
  isEnabled!: boolean;

  // 🔥 NEW (DO NOT REMOVE ANYTHING ABOVE)
  @Column({
    type: 'text',
    default: 'ACTIVE',
  })
  status!: 'ACTIVE' | 'ON_HOLD' | 'CLOSED';
}