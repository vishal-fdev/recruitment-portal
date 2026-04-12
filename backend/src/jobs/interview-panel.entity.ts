// src/jobs/interview-panel.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
} from 'typeorm';

import { InterviewRound } from './interview-round.entity';

@Entity()
export class InterviewPanel {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column()
  email!: string;

  @ManyToOne(
    () => InterviewRound,
    (round) => round.panels,
    { onDelete: 'CASCADE' },
  )
  round!: InterviewRound;
}