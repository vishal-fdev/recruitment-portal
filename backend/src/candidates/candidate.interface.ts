import { CandidateStatus } from './candidate-status.enum';

export interface Candidate {
  id: number;
  status: CandidateStatus;
  name: string;
  jobId: number;
  skills: string[];
}
