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
  ) {}

  // =========================
  // CREATE CANDIDATE (Vendor)
  // =========================
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

    const candidate = this.candidateRepo.create({
      ...data,
      experience: Number(data.experience),
      noticePeriod: Number(data.noticePeriod || 0),
      resumePath,
      status: CandidateStatus.NEW,
      vendor,
    });

    return this.candidateRepo.save(candidate);
  }

  // =========================
  // ROLE-AWARE FETCH
  // =========================
  async getCandidatesForUser(user: any) {
    if (user.role === 'VENDOR') {
      return this.candidateRepo.find({
        where: { vendor: { id: user.vendorId } },
        relations: ['job'],
        order: { createdAt: 'DESC' },
      });
    }

    return this.candidateRepo.find({
      relations: ['vendor', 'job'],
      order: { createdAt: 'DESC' },
    });
  }

  // =========================
  // SUBMIT → JOB (Vendor)
  // =========================
  async submitCandidateToJob(
    candidateId: number,
    jobId: number,
    vendorId: string,
  ) {
    const candidate = await this.candidateRepo.findOne({
      where: { id: candidateId },
      relations: ['vendor'],
    });

    if (!candidate) {
      throw new NotFoundException('Candidate not found');
    }

    if (candidate.vendor.id !== vendorId) {
      throw new BadRequestException('Access denied');
    }

    const jobVendor = await this.jobVendorRepo.findOne({
      where: {
        job: { id: jobId },
        vendor: { id: vendorId },
        isEnabled: true,
      },
      relations: ['job'],
    });

    if (!jobVendor) {
      throw new BadRequestException('Job not assigned');
    }

    candidate.job = jobVendor.job;
    candidate.status = CandidateStatus.SUBMITTED;

    return this.candidateRepo.save(candidate);
  }

  // =========================
  // UPDATE STAGE (Hiring Manager)
  // =========================
  async updateStage(
    candidateId: number,
    nextStatus: CandidateStatus,
  ) {
    // ✅ ENUM SAFETY (important for SQLite)
    if (!Object.values(CandidateStatus).includes(nextStatus)) {
      throw new BadRequestException(
        `Invalid candidate status: ${nextStatus}`,
      );
    }

    const candidate = await this.candidateRepo.findOne({
      where: { id: candidateId },
    });

    if (!candidate) {
      throw new NotFoundException('Candidate not found');
    }

    /**
     * ✅ Relaxed rules for Hiring Manager UI
     * HM can directly decide after submission
     */
    const allowedFromSubmitted = [
      CandidateStatus.SCREENING,
      CandidateStatus.TECH_SELECTED,
      CandidateStatus.TECH_REJECTED,
      CandidateStatus.OPS_SELECTED,
      CandidateStatus.OPS_REJECTED,
    ];

    if (
      candidate.status === CandidateStatus.SUBMITTED &&
      !allowedFromSubmitted.includes(nextStatus)
    ) {
      throw new BadRequestException(
        `Invalid transition from ${candidate.status} to ${nextStatus}`,
      );
    }

    candidate.status = nextStatus;
    return this.candidateRepo.save(candidate);
  }

  // =========================
  // RESUME ACCESS (SECURE)
  // =========================
  async getResumePathForUser(
    candidateId: number,
    user: any,
  ) {
    const candidate = await this.candidateRepo.findOne({
      where: { id: candidateId },
      relations: ['vendor'],
    });

    if (!candidate) {
      throw new NotFoundException('Candidate not found');
    }

    if (
      user.role === 'VENDOR' &&
      candidate.vendor.id !== user.vendorId
    ) {
      throw new BadRequestException('Unauthorized');
    }

    return candidate.resumePath;
  }
}
