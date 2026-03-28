// src/jobs/job-position.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';

import { Job } from './job.entity';

export enum JobPositionStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
}

@Entity()
export class JobPosition {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  level: string;

  @Column('int')
  openings: number;

  @Column({
    type: 'text',
    default: JobPositionStatus.OPEN,
  })
  status: JobPositionStatus;

  // ✅ NEW
  @Column({ default: 'NEW' })
  requestType: string;

  @Column({ nullable: true })
  backfillEmployeeId: string;

  @Column({ nullable: true })
  backfillEmployeeName: string;

/* ================= JD ================= */

@Column({ nullable: true })
jdPath: string;

@Column({ nullable: true })
jdFileName: string;

@Column({ nullable: true })
jdMimeType: string;

/* ================= PSQ ================= */

@Column({ nullable: true })
psqPath: string;

@Column({ nullable: true })
psqFileName: string;

@Column({ nullable: true })
psqMimeType: string;

  @ManyToOne(() => Job, (job) => job.positions, {
    onDelete: 'CASCADE',
  })
  job: Job;

  @CreateDateColumn()
  createdAt: Date;
}