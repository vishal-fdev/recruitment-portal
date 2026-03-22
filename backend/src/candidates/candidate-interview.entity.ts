// src/candidates/candidate-interview.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';

import { Candidate } from './candidate.entity';
import { InterviewRound } from '../jobs/interview-round.entity';

@Entity()
export class CandidateInterview {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Candidate, { onDelete: 'CASCADE' })
  candidate: Candidate;

  @ManyToOne(() => InterviewRound, { eager: true })
  round: InterviewRound;

  @Column({ type: 'text', nullable: true })
  panelMembers: string;

  @Column({ type: 'text', nullable: true })
  feedback: string;

  @Column({ type: 'text' })
  decision: 'SELECT' | 'REJECT';

  @CreateDateColumn()
  feedbackDate: Date;
}
