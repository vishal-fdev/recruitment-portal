// src/candidates/candidates.service.ts

import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Candidate } from './candidate.entity';
import { Vendor } from '../vendors/vendors.entity';
import { Job } from '../jobs/job.entity';
import { JobVendor } from '../jobs/job-vendor.entity';
import { CandidateStatus } from './candidate-status.enum';
import { CandidateInterview } from './candidate-interview.entity';
import { InterviewRound } from '../jobs/interview-round.entity';
import {
  JobPosition,
  JobPositionStatus,
} from '../jobs/job-position.entity';

@Injectable()
export class CandidatesService {
  constructor(
    @InjectRepository(Candidate)
    private readonly candidateRepo: Repository<Candidate>,

    @InjectRepository(Vendor)
    private readonly vendorRepo: Repository<Vendor>,

    @InjectRepository(Job)
    private readonly jobRepo: Repository<Job>,

    @InjectRepository(JobVendor)
    private readonly jobVendorRepo: Repository<JobVendor>,

    @InjectRepository(CandidateInterview)
    private readonly interviewRepo: Repository<CandidateInterview>,

    @InjectRepository(InterviewRound)
    private readonly roundRepo: Repository<InterviewRound>,

    @InjectRepository(JobPosition)
    private readonly positionRepo: Repository<JobPosition>,
  ) {}

  /* =====================================================
     CREATE CANDIDATE
  ===================================================== */

  async createCandidate(
    data: any,
    resumePath: string,
    vendorId: string,
  ) {
    const vendor = await this.vendorRepo.findOne({
      where: { id: vendorId },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    let job: Job | null = null;
    let position: JobPosition | null = null;

    if (data.jobId) {
      job = await this.jobRepo.findOne({
        where: { id: Number(data.jobId) },
        relations: ['positions'],
      });

      if (!job) {
        throw new NotFoundException('Job not found');
      }

      // 🔥 BLOCK BASED ON JOB STATUS
if (job.status === 'ON_HOLD') {
  throw new BadRequestException(
    'This job is currently on hold',
  );
}

if (job.status === 'CLOSED') {
  throw new BadRequestException(
    'This job is closed',
  );
}

      const mapping =
        await this.jobVendorRepo.findOne({
          where: {
            job: { id: job.id },
            vendor: { id: vendorId },
            isEnabled: true,
          },
        });

      if (!mapping) {
  throw new BadRequestException(
    'Vendor not assigned to this job',
  );
}

// 🔥 NEW VALIDATION
if (mapping.status !== 'ACTIVE') {
  throw new BadRequestException(
    'This job is not active for your vendor',
  );
}
      // 🔥 PREVENT DUPLICATE SUBMISSION (SAME JOB + SAME EMAIL)
const existing = await this.candidateRepo.findOne({
  where: {
    email: data.email,
    job: { id: job.id },
  },
});

if (existing) {
  throw new BadRequestException(
    'Candidate already submitted for this job',
  );
}

      if (data.positionId) {
        position = await this.positionRepo.findOne({
          where: { id: Number(data.positionId) },
          relations: ['job'],
        });

        if (!position) {
          throw new NotFoundException(
            'Position not found',
          );
        }

        if (position.job.id !== job.id) {
          throw new BadRequestException(
            'Invalid position for this job',
          );
        }

        if (position.status === JobPositionStatus.CLOSED) {
          throw new BadRequestException(
            'This position is closed',
          );
        }
        // 🔥 EXTRA SAFETY (prevents invalid submissions)
if (position.openings <= 0) {
  throw new BadRequestException(
    'No openings available for this position',
  );
}
      }
    }

    const candidate = this.candidateRepo.create({
      ...data,
      experience: Number(data.experience),
      noticePeriod: Number(data.noticePeriod || 0),
      resumePath,
      status: CandidateStatus.SCREENING,
      vendor,
      job: job || null,
      position: position || null,
    });

    return this.candidateRepo.save(candidate);
  }

  /* =====================================================
     MANUAL STATUS UPDATE (REQUIRED BY CONTROLLER)
  ===================================================== */

  async updateStage(
    candidateId: number,
    nextStatus: CandidateStatus,
  ) {
    const candidate = await this.candidateRepo.findOne({
      where: { id: candidateId },
    });

    if (!candidate) {
      throw new NotFoundException(
        'Candidate not found',
      );
    }

    candidate.status = nextStatus;

    return this.candidateRepo.save(candidate);
  }

  /* =====================================================
     ROLE-AWARE FETCH
  ===================================================== */

  async getCandidatesForUser(user: any) {
    if (user.role === 'VENDOR') {
      return this.candidateRepo.find({
        where: {
          vendor: { id: user.vendorId },
        },
        relations: ['job', 'position'],
        order: { createdAt: 'DESC' },
      });
    }

    return this.candidateRepo.find({
      relations: ['vendor', 'job', 'position'],
      order: { createdAt: 'DESC' },
    });
  }

  /* =====================================================
     GET SINGLE CANDIDATE
  ===================================================== */

  async getCandidateById(id: number, user: any) {
    const candidate = await this.candidateRepo.findOne({
      where: { id },
      relations: [
        'vendor',
        'job',
        'job.interviewRounds',
        'job.interviewRounds.panels',
        'position',
        'interviews',
        'interviews.round',
      ],
    });

    if (!candidate) {
      throw new NotFoundException(
        'Candidate not found',
      );
    }

    if (
      user.role === 'VENDOR' &&
      candidate.vendor.id !== user.vendorId
    ) {
      throw new BadRequestException(
        'Unauthorized',
      );
    }

    return candidate;
  }

  /* =====================================================
     SUBMIT INTERVIEW FEEDBACK
  ===================================================== */

  async submitInterviewFeedback(
    candidateId: number,
    roundId: number,
    feedback: string,
    decision: 'SELECT' | 'REJECT',
  ) {
    const candidate = await this.candidateRepo.findOne({
      where: { id: candidateId },
      relations: [
        'job',
        'job.interviewRounds',
        'interviews',
        'interviews.round',
      ],
    });

    if (!candidate) {
      throw new NotFoundException(
        'Candidate not found',
      );
    }

    if (!candidate.job) {
      throw new BadRequestException(
        'Candidate has no associated job',
      );
    }

    if (
      candidate.status === CandidateStatus.REJECTED ||
      candidate.status === CandidateStatus.SELECTED
    ) {
      throw new BadRequestException(
        'Candidate decision already finalized',
      );
    }

    const round = await this.roundRepo.findOne({
      where: { id: roundId },
      relations: ['panels'],
    });

    if (!round) {
      throw new NotFoundException(
        'Round not found',
      );
    }

    const alreadySubmitted = candidate.interviews.find(
      (i) => i.round.id === roundId,
    );

    if (alreadySubmitted) {
      throw new BadRequestException(
        'Feedback already submitted for this round',
      );
    }

    const interviewsCount = candidate.interviews.length;
    const expectedRound =
      candidate.job.interviewRounds[interviewsCount];

    if (!expectedRound || expectedRound.id !== roundId) {
      throw new BadRequestException(
        'Invalid round sequence',
      );
    }

    const interview = this.interviewRepo.create({
      candidate,
      round,
      panelMembers: round.panels
        .map((p) => p.name)
        .join(', '),
      feedback,
      decision,
    });

    await this.interviewRepo.save(interview);

    if (decision === 'REJECT') {
      candidate.status = CandidateStatus.REJECTED;
    } else {
      const totalRounds =
        candidate.job.interviewRounds.length;

      if (interviewsCount === totalRounds - 1) {
        candidate.status = CandidateStatus.SELECTED;
      } else {
        candidate.status = CandidateStatus.SCREENING;
      }
    }

    await this.candidateRepo.save(candidate);

    return { success: true };
  }

  

  /* =====================================================
     RESUME ACCESS
  ===================================================== */

  async getResumePathForUser(
    candidateId: number,
    user: any,
  ) {
    const candidate = await this.candidateRepo.findOne({
      where: { id: candidateId },
      relations: ['vendor'],
    });

    if (!candidate) {
      throw new NotFoundException(
        'Candidate not found',
      );
    }

    if (
      user.role === 'VENDOR' &&
      candidate.vendor.id !== user.vendorId
    ) {
      throw new BadRequestException(
        'Unauthorized',
      );
    }

    return candidate.resumePath;
  }
}