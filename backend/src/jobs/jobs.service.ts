// src/jobs/jobs.service.ts

import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial, In, ILike } from 'typeorm';

import { Job } from './job.entity';
import { JobVendor } from './job-vendor.entity';
import { Vendor } from '../vendors/vendors.entity';
import { Candidate } from '../candidates/candidate.entity';
import { InterviewRound } from './interview-round.entity';
import { InterviewPanel } from './interview-panel.entity';
import { JobStatus } from './job-status.enum';
import {
  JobPosition,
  JobPositionStatus,
} from './job-position.entity';
import { MailService } from '../common/mail.service';

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

    @InjectRepository(JobPosition)
    private readonly positionRepo: Repository<JobPosition>,

    private readonly mailService: MailService, // ✅ ADD THIS
  ) {}

  /* ======================================================
     ROLE BASED JOB LIST
  ====================================================== */

  async getJobsForUser(user: any): Promise<any[]> {
    if (user.role === 'VENDOR') {
      const mappings = await this.jobVendorRepo.find({
        where: {
          vendor: { id: user.vendor?.id || user.vendorId },
          isEnabled: true,
        },
        relations: ['job'],
      });

      const allowedIds = mappings.map((m) => m.job.id);
      if (!allowedIds.length) return [];

      const jobs = await this.jobRepo.find({
        where: {
          id: In(allowedIds),
          status: JobStatus.APPROVED,
          isActive: true,
        },
        relations: ['positions'],
        order: { createdAt: 'DESC' },
      });

      return jobs
        .map((job) => {
          const openPositions =
            job.positions?.filter(
              (p) =>
                p.status === JobPositionStatus.OPEN &&
                p.openings > 0,
            ) || [];

          return {
            ...job,
            positions: openPositions,
          };
        })
        .filter((job) => job.positions.length > 0);
    }

    const jobs = await this.jobRepo.find({
      relations: ['positions'],
      order: { createdAt: 'DESC' },
    });

    return jobs;
  }

  /* ======================================================
     CREATE JOB (UPDATED)
  ====================================================== */

  async createJob(data: any): Promise<Job> {
    const { interviewRounds, positions, ...jobData } = data;

    const jobEntity = this.jobRepo.create(
      jobData as DeepPartial<Job>,
    );

    jobEntity.status = JobStatus.PENDING_APPROVAL;
    jobEntity.isActive = true;

    const savedJob = await this.jobRepo.save(jobEntity);
    await this.mailService.sendApprovalEmail(savedJob);

  

    /* ================= POSITIONS ================= */

    if (Array.isArray(positions) && positions.length) {
      for (const pos of positions) {
        const positionEntity =
          this.positionRepo.create({
            level: pos.level,
            openings: Number(pos.openings || 0),
            status: JobPositionStatus.OPEN,

            // ✅ NEW FIELDS (SAFE ADDITION)
            requestType: pos.requestType || 'NEW',
            backfillEmployeeId: pos.backfillEmployeeId || null,
            backfillEmployeeName: pos.backfillEmployeeName || null,

            job: savedJob,
          });

        await this.positionRepo.save(positionEntity);
      }
    }

    /* ================= INTERVIEW ================= */

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
          for (const panel of round.panels) {
            const panelEntity =
              this.panelRepo.create({
                name: panel.name,   // ✅ FIXED
                email: panel.email, // ✅ NEW
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
   UPDATE JOB (EDIT & RESUBMIT)
====================================================== */

async updateJob(jobId: number, data: any): Promise<Job> {
  const job = await this.jobRepo.findOne({
    where: { id: jobId },
    relations: ['positions', 'interviewRounds', 'interviewRounds.panels'],
  });

  if (!job) {
    throw new NotFoundException('Job not found');
  }

  const { interviewRounds, positions, ...jobData } = data;

  // ✅ UPDATE MAIN JOB FIELDS
  Object.assign(job, jobData);

  // 🔥 CRITICAL: RESET STATUS FOR APPROVAL
  job.status = JobStatus.PENDING_APPROVAL;

  await this.jobRepo.save(job);
  await this.mailService.sendApprovalEmail(job);

  /* ================= RESET POSITIONS ================= */

  await this.positionRepo.delete({ job: { id: jobId } });

  if (Array.isArray(positions)) {
    for (const pos of positions) {
      const newPos = this.positionRepo.create({
        level: pos.level,
        openings: Number(pos.openings || 0),
        status: JobPositionStatus.OPEN,
        requestType: pos.requestType || 'NEW',
        backfillEmployeeId: pos.backfillEmployeeId || null,
        backfillEmployeeName: pos.backfillEmployeeName || null,
        job,
      });

      await this.positionRepo.save(newPos);
    }
  }

  /* ================= RESET INTERVIEW ROUNDS ================= */

  await this.roundRepo.delete({ job: { id: jobId } });

  if (Array.isArray(interviewRounds)) {
    for (const round of interviewRounds) {
      const roundEntity = this.roundRepo.create({
        roundName: round.roundName,
        mode: round.mode,
        job,
      });

      const savedRound = await this.roundRepo.save(roundEntity);

      if (Array.isArray(round.panels)) {
        for (const panel of round.panels) {
          const panelEntity = this.panelRepo.create({
            name: panel.name,
            email: panel.email,
            round: savedRound,
          });

          await this.panelRepo.save(panelEntity);
        }
      }
    }
  }

  return this.getJobById(jobId);
}

  /* ======================================================
     TEMPLATE FETCH (UPDATED)
  ====================================================== */

  async getTemplateByTitle(title: string) {
    if (!title) return null;

    const job = await this.jobRepo.findOne({
      where: { title: ILike(title) },
      relations: [
        'positions',
        'interviewRounds',
        'interviewRounds.panels',
      ],
      order: { createdAt: 'DESC' },
    });

    if (!job) return null;

    return {
      title: job.title,
      location: job.location,
      experience: job.experience,
      department: job.department,
      budget: job.budget,
      description: job.description,
      positions: job.positions?.map((p) => ({
        level: p.level,
        openings: p.openings,
        requestType: p.requestType,
        backfillEmployeeId: p.backfillEmployeeId,
        backfillEmployeeName: p.backfillEmployeeName,
      })),
      interviewRounds: job.interviewRounds?.map((r) => ({
        roundName: r.roundName,
        mode: r.mode,
        panels: r.panels?.map((p) => ({
          name: p.name,
          email: p.email,
        })),
      })),
    };
  }

  /* ======================================================
     GET JOB BY ID
  ====================================================== */

  async getJobById(jobId: number): Promise<any> {
    const job = await this.jobRepo.findOne({
      where: { id: jobId },
      relations: [
        'jobVendors',
        'jobVendors.vendor',
        'interviewRounds',
        'interviewRounds.panels',
        'candidates',
        'positions',
      ],
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    const allVendors = await this.vendorRepo.find({
      where: { isActive: true },
    });

    const vendors = allVendors.map((vendor) => {
      const mapping = job.jobVendors.find(
        (jv) => jv.vendor.id === vendor.id,
      );

      return {
        id: vendor.id,
        email: vendor.email,
        isEnabled: mapping ? mapping.isEnabled : false,
      };
    });

    return {
      ...job,
      vendors,
    };
  }

  /* ======================================================
     OTHER METHODS (UNCHANGED)
  ====================================================== */

  async toggleVendor(jobId: number, vendorId: string, isEnabled: boolean) {
    let mapping = await this.jobVendorRepo.findOne({
      where: {
        job: { id: jobId },
        vendor: { id: vendorId },
      },
      relations: ['job', 'vendor'],
    });

    if (!mapping) {
      const job = await this.jobRepo.findOne({ where: { id: jobId } });
      const vendor = await this.vendorRepo.findOne({ where: { id: vendorId } });

      if (!job || !vendor) {
        throw new NotFoundException('Job or Vendor not found');
      }

      mapping = this.jobVendorRepo.create({
        job,
        vendor,
        isEnabled,
      });
    } else {
      mapping.isEnabled = isEnabled;
    }

    await this.jobVendorRepo.save(mapping);
    return { success: true };
  }

  async closePosition(positionId: number) {
    const position = await this.positionRepo.findOne({
      where: { id: positionId },
    });

    if (!position)
      throw new NotFoundException('Position not found');

    position.status = JobPositionStatus.CLOSED;
    await this.positionRepo.save(position);
    return { success: true };
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

  async attachJD(jobId: number, file: Express.Multer.File) {
    const job = await this.jobRepo.findOne({ where: { id: jobId } });
    if (!job) throw new NotFoundException('Job not found');

    job.jdPath = file.path;
    job.jdFileName = file.originalname;
    job.jdMimeType = file.mimetype;

    return this.jobRepo.save(job);
  }

  async getJD(jobId: number) {
    const job = await this.jobRepo.findOne({ where: { id: jobId } });
    if (!job || !job.jdPath)
      throw new NotFoundException('JD not found');

    return job;
  }

  /* ======================================================
   PSQ HANDLING (ADD BELOW getJD)
====================================================== */

async attachPSQ(jobId: number, file: Express.Multer.File) {
  const job = await this.jobRepo.findOne({ where: { id: jobId } });
  if (!job) throw new NotFoundException('Job not found');

  job.psqPath = file.path;
  job.psqFileName = file.originalname;
  job.psqMimeType = file.mimetype;

  return this.jobRepo.save(job);
}

async getPSQ(jobId: number) {
  const job = await this.jobRepo.findOne({ where: { id: jobId } });
  if (!job || !job.psqPath)
    throw new NotFoundException('PSQ not found');

  return job;
}

/* ======================================================
   POSITION FILE HANDLING (NEW)
====================================================== */

async attachPositionJD(positionId: number, file: Express.Multer.File) {
  const pos = await this.positionRepo.findOne({ where: { id: positionId } });
  if (!pos) throw new NotFoundException('Position not found');

  pos.jdPath = file.path;
  pos.jdFileName = file.originalname;
  pos.jdMimeType = file.mimetype;

  return this.positionRepo.save(pos);
}

async attachPositionPSQ(positionId: number, file: Express.Multer.File) {
  const pos = await this.positionRepo.findOne({ where: { id: positionId } });
  if (!pos) throw new NotFoundException('Position not found');

  pos.psqPath = file.path;
  pos.psqFileName = file.originalname;
  pos.psqMimeType = file.mimetype;

  return this.positionRepo.save(pos);
}

async getPositionJD(positionId: number) {
  const pos = await this.positionRepo.findOne({ where: { id: positionId } });
  if (!pos || !pos.jdPath)
    throw new NotFoundException('JD not found');

  return pos;
}

async getPositionPSQ(positionId: number) {
  const pos = await this.positionRepo.findOne({ where: { id: positionId } });
  if (!pos || !pos.psqPath)
    throw new NotFoundException('PSQ not found');

  return pos;
}
}
