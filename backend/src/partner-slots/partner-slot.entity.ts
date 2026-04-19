import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Candidate } from '../candidates/candidate.entity';
import { Job } from '../jobs/job.entity';
import { Vendor } from '../vendors/vendors.entity';

export enum PartnerSlotStatus {
  PENDING_VENDOR = 'PENDING_VENDOR',
  REJECTED = 'REJECTED',
  SCHEDULED = 'SCHEDULED',
  CLOSED = 'CLOSED',
}

export enum SlotAttendanceStatus {
  PENDING = 'PENDING',
  ATTENDED = 'ATTENDED',
  NO_SHOW = 'NO_SHOW',
  RESCHEDULE_REQUESTED_BY_CANDIDATE = 'RESCHEDULE_REQUESTED_BY_CANDIDATE',
  RESCHEDULE_REQUESTED_BY_PANEL = 'RESCHEDULE_REQUESTED_BY_PANEL',
  DROPPED = 'DROPPED',
}

@Entity()
export class PartnerSlot {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Candidate, { eager: true, onDelete: 'CASCADE' })
  candidate!: Candidate;

  @ManyToOne(() => Job, { eager: true, onDelete: 'CASCADE' })
  job!: Job;

  @ManyToOne(() => Vendor, { eager: true, onDelete: 'CASCADE' })
  vendor!: Vendor;

  @Column({ type: 'text' })
  roundName!: string;

  @Column({ type: 'date' })
  interviewDate!: string;

  @Column({ type: 'text' })
  interviewTime!: string;

  @Column({ type: 'text', nullable: true })
  hmComment!: string | null;

  @Column({
    type: 'text',
    default: PartnerSlotStatus.PENDING_VENDOR,
  })
  status!: PartnerSlotStatus;

  @Column({ type: 'text', nullable: true })
  vendorJustification!: string | null;

  @Column({
    type: 'text',
    default: SlotAttendanceStatus.PENDING,
  })
  attendanceStatus!: SlotAttendanceStatus;

  @Column({ type: 'text', nullable: true })
  attendanceComment!: string | null;

  @Column({ type: 'boolean', default: false })
  hmFeedbackSubmitted!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
