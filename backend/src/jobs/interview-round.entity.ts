// src/jobs/interview-round.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Job } from './job.entity';
import { InterviewPanel } from './interview-panel.entity';

@Entity()
export class InterviewRound {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  roundName: string; // Screening, Technical, HR etc

  @Column({ nullable: true })
  mode: string; // Virtual / F2F

  @ManyToOne(() => Job, (job) => job.interviewRounds, {
    onDelete: 'CASCADE',
  })
  job: Job;

  @OneToMany(
    () => InterviewPanel,
    (panel) => panel.round,
    { cascade: true, eager: true },
  )
  panels: InterviewPanel[];
}
