// src/jobs/jobs.service.ts

import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial } from 'typeorm';

import { Job } from './job.entity';
import { JobVendor } from './job-vendor.entity';
import { Vendor } from '../vendors/vendors.entity';
import { Candidate } from '../candidates/candidate.entity';
import { InterviewRound } from './interview-round.entity';
import { InterviewPanel } from './interview-panel.entity';
import { JobStatus } from './job-status.enum';

@Injectable()
export class JobsService {
  constructor(
    @InjectRepository(Job)
    private readonly jobRepo: Repository<Job>,

    @InjectRepository(JobVendor)
    private readonly jobVendorRepo: Repository<JobVendor>,

    @InjectRepository(Vendor)
    private readonly vendorRepo: Repository<Vendor>,

    @InjectRepository(Candidate)
    private readonly candidateRepo: Repository<Candidate>,

    @InjectRepository(InterviewRound)
    private readonly roundRepo: Repository<InterviewRound>,

    @InjectRepository(InterviewPanel)
    private readonly panelRepo: Repository<InterviewPanel>,
  ) {}

  /* ======================================================
     ROLE-AWARE JOB LIST
  ====================================================== */

  async getJobsForUser(user: any): Promise<Job[]> {
    // 🔹 Vendor → assigned + approved
    if (user.role === 'VENDOR') {
      const mappings = await this.jobVendorRepo.find({
        where: {
          vendor: { id: user.vendorId },
          isEnabled: true,
        },
        relations: ['job'],
      });

      return mappings
        .map((m) => m.job)
        .filter(
          (j) =>
            j &&
            j.isActive &&
            j.status === JobStatus.APPROVED,
        );
    }

    // 🔹 Vendor Manager → approved only
    if (user.role === 'VENDOR_MANAGER') {
      return this.jobRepo.find({
        where: { status: JobStatus.APPROVED },
        order: { createdAt: 'DESC' },
      });
    }

    // 🔥 Vendor Manager Head → SEE ALL JOBS
    if (user.role === 'VENDOR_MANAGER_HEAD') {
      return this.jobRepo.find({
        order: { createdAt: 'DESC' },
      });
    }

    // 🔹 Hiring Manager → all jobs
    return this.jobRepo.find({
      order: { createdAt: 'DESC' },
    });
  }

  /* ======================================================
     CREATE JOB + INTERVIEW ROUNDS
  ====================================================== */

  async createJob(data: any): Promise<Job> {
    const { interviewRounds, ...jobData } = data;

    const jobEntity = this.jobRepo.create(
      jobData as DeepPartial<Job>,
    );

    jobEntity.status = JobStatus.PENDING_APPROVAL;
    jobEntity.isActive = true;

    const savedJob = await this.jobRepo.save(jobEntity);

    if (Array.isArray(interviewRounds)) {
      for (const round of interviewRounds) {
        const roundEntity = this.roundRepo.create({
          roundName: round.roundName,
          mode: round.mode,
          job: savedJob,
        });

        const savedRound =
          await this.roundRepo.save(roundEntity);

        if (Array.isArray(round.panels)) {
          for (const panelName of round.panels) {
            const panelEntity =
              this.panelRepo.create({
                name: panelName,
                round: savedRound,
              });

            await this.panelRepo.save(panelEntity);
          }
        }
      }
    }

    return this.getJobById(savedJob.id);
  }

  /* ======================================================
     GET JOB BY ID
  ====================================================== */

  async getJobById(jobId: number): Promise<Job> {
    const job = await this.jobRepo.findOne({
      where: { id: jobId },
      relations: [
        'interviewRounds',
        'interviewRounds.panels',
        'jobVendors',
        'candidates',
      ],
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    return job;
  }

  async closeJob(jobId: number) {
    await this.jobRepo.update(jobId, {
      isActive: false,
      status: JobStatus.CLOSED,
    });

    return { success: true };
  }

  async approveJob(jobId: number) {
    await this.jobRepo.update(jobId, {
      status: JobStatus.APPROVED,
    });

    return { success: true };
  }

  async rejectJob(jobId: number) {
    await this.jobRepo.update(jobId, {
      status: JobStatus.REJECTED,
    });

    return { success: true };
  }

  async attachJD(
    jobId: number,
    file: Express.Multer.File,
  ) {
    const job = await this.jobRepo.findOne({
      where: { id: jobId },
    });

    if (!job)
      throw new NotFoundException('Job not found');

    job.jdPath = file.path;
    job.jdFileName = file.originalname;
    job.jdMimeType = file.mimetype;

    return this.jobRepo.save(job);
  }

  async getJD(jobId: number) {
    const job = await this.jobRepo.findOne({
      where: { id: jobId },
    });

    if (!job || !job.jdPath)
      throw new NotFoundException('JD not found');

    return job;
  }

  async getCandidatesForJob(jobId: number) {
    return this.candidateRepo.find({
      where: { job: { id: jobId } },
      relations: ['vendor'],
      order: { createdAt: 'DESC' },
    });
  }
}
