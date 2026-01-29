import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';
import { JobVendor } from './job-vendor.entity';
import { Candidate } from '../candidates/candidate.entity';

@Entity()
export class Job {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  location: string;

  @Column()
  experience: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  // ✅ Job ↔ Vendors (via join table)
  @OneToMany(() => JobVendor, (jv) => jv.job)
  jobVendors: JobVendor[];

  // ✅ Job ↔ Candidates
  @OneToMany(() => Candidate, (c) => c.job)
  candidates: Candidate[];
}
