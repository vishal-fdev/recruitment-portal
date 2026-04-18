// src/candidates/candidate.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';

import { Vendor } from '../vendors/vendors.entity';
import { Job } from '../jobs/job.entity';
import { JobPosition } from '../jobs/job-position.entity';
import { CandidateStatus } from './candidate-status.enum';
import { CandidateInterview } from './candidate-interview.entity';

@Entity()
export class Candidate {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column()
  email!: string;

  @Column()
  phone!: string;

  @Column({ type: 'text', nullable: true })
  primarySkills!: string;

  @Column({ type: 'text', nullable: true })
  secondarySkills!: string;

  @Column({ nullable: true })
  country!: string;

  @Column({ nullable: true })
  state!: string;

  @Column({ nullable: true })
  city!: string;

  @Column('int')
  experience!: number;

  @Column('int', { default: 0 })
  noticePeriod!: number;

  @Column()
  currentOrg!: string;

  @Column()
  resumePath!: string;

  @Column({
    type: 'text',
    default: CandidateStatus.NEW,
  })
  status!: CandidateStatus;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => Vendor, { eager: true })
  vendor!: Vendor;

  @ManyToOne(() => Job, { eager: true, nullable: true })
  job!: Job | null;

  @ManyToOne(() => JobPosition, {
    eager: true,
    nullable: true,
  })
  position!: JobPosition | null;

  @OneToMany(
    () => CandidateInterview,
    (interview) => interview.candidate,
    { cascade: true, eager: true },
  )
  interviews!: CandidateInterview[];
}