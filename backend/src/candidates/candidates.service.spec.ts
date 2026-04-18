import { Test, TestingModule } from '@nestjs/testing';
import { CandidatesService } from './candidates.service';
import { getRepositoryToken } from '@nestjs/typeorm';

// ✅ IMPORT ENTITIES (VERY IMPORTANT)
import { Candidate } from './candidate.entity';
import { Vendor } from '../vendors/vendors.entity';
import { Job } from '../jobs/job.entity';
import { JobVendor } from '../jobs/job-vendor.entity';
import { CandidateInterview } from './candidate-interview.entity';
import { InterviewRound } from '../jobs/interview-round.entity';
import { JobPosition } from '../jobs/job-position.entity';

describe('CandidatesService', () => {
  let service: CandidatesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CandidatesService,

        // ✅ CORRECT MOCKS (USE ENTITY CLASSES)
        { provide: getRepositoryToken(Candidate), useValue: {} },
        { provide: getRepositoryToken(Vendor), useValue: {} },
        { provide: getRepositoryToken(Job), useValue: {} },
        { provide: getRepositoryToken(JobVendor), useValue: {} },
        { provide: getRepositoryToken(CandidateInterview), useValue: {} },
        { provide: getRepositoryToken(InterviewRound), useValue: {} },
        { provide: getRepositoryToken(JobPosition), useValue: {} },
      ],
    }).compile();

    service = module.get<CandidatesService>(CandidatesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});