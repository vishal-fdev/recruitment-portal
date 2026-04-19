// src/jobs/job.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';

import { JobVendor } from './job-vendor.entity';
import { Candidate } from '../candidates/candidate.entity';
import { InterviewRound } from './interview-round.entity';
import { JobStatus } from './job-status.enum';
import { JobPosition } from './job-position.entity';

@Entity()
export class Job {
  @PrimaryGeneratedColumn()
  id!: number;

  /* ================= BASIC ================= */

  @Column()
  title!: string;

  @Column()
  location!: string;

  @Column()
  experience!: string;

  @Column({ nullable: true })
  department!: string;

  @Column({ nullable: true })
  jobCategory!: string;

  @Column({ nullable: true })
  workType!: string;

  @Column({ nullable: true })
  region!: string;

  @Column({ nullable: true })
  dealName!: string;

  @Column({ nullable: true })
  hiringManager!: string;

  @Column({ type: 'text', nullable: true })
  justification!: string;

  /* ================= CONTRACT ================= */

  @Column({ nullable: true })
  employmentType!: string;

  @Column({ nullable: true })
  budget!: string;

  @Column({ nullable: true })
  startDate!: string;

  @Column({ nullable: true })
  endDate!: string;

  /* ================= POSITION ================= */

  @Column({ nullable: true })
  level!: string;

  @Column({ type: 'int', nullable: true })
  numberOfPositions!: number;

  @Column({ type: 'int', nullable: true })
  currentNumberOfPositions!: number;

  @Column({ nullable: true })
  requestType!: string;

  @Column({ nullable: true })
  backfillEmployeeId!: string;

  @Column({ nullable: true })
  backfillEmployeeName!: string;

  /* ================= DESCRIPTION ================= */

  @Column({ type: 'text', nullable: true })
  description!: string;

  /* ================= APPROVAL ================= */

  @Column({
    type: 'text',
    default: JobStatus.PENDING_APPROVAL,
  })
  status!: JobStatus;

  @Column({ default: true })
  isActive!: boolean;

  /* ================= JD ================= */

  @Column({ nullable: true })
  jdPath!: string;

  @Column({ nullable: true })
  jdFileName!: string;

  @Column({ nullable: true })
  jdMimeType!: string;

  /* ================= PSQ ================= */

  @Column({ nullable: true })
  psqPath!: string;

  @Column({ nullable: true })
  psqFileName!: string;

  @Column({ nullable: true })
  psqMimeType!: string;

  /* ================= TIMESTAMP ================= */

  @CreateDateColumn()
  createdAt!: Date;

  /* ================= RELATIONS ================= */

  @OneToMany(() => JobVendor, (jv) => jv.job)
  jobVendors!: JobVendor[];

  @OneToMany(() => Candidate, (c) => c.job)
  candidates!: Candidate[];

  @OneToMany(() => JobPosition, (pos) => pos.job, {
    cascade: true,
    eager: true,
  })
  positions!: JobPosition[];

  @OneToMany(() => InterviewRound, (round) => round.job, {
    cascade: true,
  })
  interviewRounds!: InterviewRound[];
}
