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
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/user.entity';
import { MailService } from '../common/mail.service';

type StoredFileMeta = {
  path: string;
  fileName: string;
  mimeType: string;
};

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
    private readonly usersService: UsersService,
    private readonly mailService: MailService,
  ) {}

  private normalizeEmail(email?: string | null) {
    return (email || '').trim().toLowerCase();
  }

  private getScreeningPanels(interviewRounds: any[] = []) {
    return interviewRounds
      .filter(
        (round) =>
          this.normalizeEmail(round?.roundName) === 'screening' ||
          (round?.roundName || '').trim().toUpperCase() === 'SCREENING',
      )
      .flatMap((round) => round.panels || [])
      .filter((panel) => this.normalizeEmail(panel?.email));
  }

  private async syncScreeningPanelUsers(interviewRounds: any[] = []) {
    const uniqueEmails = new Set<string>();

    for (const panel of this.getScreeningPanels(interviewRounds)) {
      const email = this.normalizeEmail(panel.email);
      if (!email || uniqueEmails.has(email)) continue;
      uniqueEmails.add(email);
      await this.usersService.ensureActiveUser(email, UserRole.PANEL);
    }
  }

  private async notifyScreeningPanels(job: any) {
    const notified = new Set<string>();

    for (const round of job.interviewRounds || []) {
      if ((round.roundName || '').trim().toUpperCase() !== 'SCREENING') {
        continue;
      }

      for (const panel of round.panels || []) {
        const email = this.normalizeEmail(panel.email);
        if (!email || notified.has(email)) continue;
        notified.add(email);
        await this.mailService.sendPanelAssignmentEmail(panel, job);
      }
    }
  }

  private parseStoredFiles(value?: string | null): StoredFileMeta[] {
    if (!value) return [];

    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private buildStoredFiles(files: Express.Multer.File[] = []): StoredFileMeta[] {
    return files.map((file) => ({
      path: file.path,
      fileName: file.originalname,
      mimeType: file.mimetype,
    }));
  }

  private attachStoredFilesToJob(job: Job) {
    return {
      ...job,
      jdFiles: this.parseStoredFiles(job.jdFiles),
      psqFiles: this.parseStoredFiles(job.psqFiles),
    };
  }

  private setPrimaryFileFields(
    job: Job,
    field: 'jd' | 'psq',
    files: StoredFileMeta[],
  ) {
    const firstFile = files[0];

    if (field === 'jd') {
      job.jdPath = firstFile?.path || '';
      job.jdFileName = firstFile?.fileName || '';
      job.jdMimeType = firstFile?.mimeType || '';
      job.jdFiles = files.length ? JSON.stringify(files) : '';
      return;
    }

    job.psqPath = firstFile?.path || '';
    job.psqFileName = firstFile?.fileName || '';
    job.psqMimeType = firstFile?.mimeType || '';
    job.psqFiles = files.length ? JSON.stringify(files) : '';
  }

  private getPositionCurrentOpenings(position: JobPosition) {
    const typedPosition = position as JobPosition & {
      currentOpenings?: number;
    };

    return Number(typedPosition.currentOpenings ?? position.openings ?? 0);
  }

  private setPositionCurrentOpenings(
    position: JobPosition,
    value: number,
  ) {
    const typedPosition = position as JobPosition & {
      currentOpenings?: number;
    };

    typedPosition.currentOpenings = value;
  }

  /* ======================================================
     ROLE BASED JOB LIST
  ====================================================== */

  async getJobsForUser(user: any): Promise<any[]> {

  /* ================= VENDOR ================= */

  if (user.role === 'VENDOR') {

    const mappings = await this.jobVendorRepo.find({
      where: {
        vendor: { id: user.vendor?.id || user.vendorId },
        isEnabled: true,
        status: 'ACTIVE',
      },
      relations: ['job'],
    });

    const allowedIds = mappings.map((m) => m.job.id);
    if (!allowedIds.length) return [];

    const jobs = await this.jobRepo.find({
     where: {
  id: In(allowedIds),
  status: In([
    JobStatus.APPROVED,
    JobStatus.ON_HOLD,
    JobStatus.CLOSED,
  ]),
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
              this.getPositionCurrentOpenings(p) > 0,
          ) || [];
        const hasMainOpenings =
          Number(
            job.currentNumberOfPositions ?? job.numberOfPositions ?? 0,
          ) > 0;

        return {
          ...this.attachStoredFilesToJob(job),
          positions: openPositions,
          hasMainOpenings,
        };
      })
      .filter(
        (job) => job.positions.length > 0 || job.hasMainOpenings,
      );
  }

  /* ================= PANEL ================= */

  if (user.role === 'PANEL') {
    const panelEmail = this.normalizeEmail(user.email);

    const jobs = await this.jobRepo.find({
      relations: ['positions', 'interviewRounds', 'interviewRounds.panels'],
      order: { createdAt: 'DESC' },
    });

    return jobs
      .filter((job) =>
        (job.interviewRounds || []).some(
          (round) =>
            (round.roundName || '').trim().toUpperCase() === 'SCREENING' &&
            (round.panels || []).some(
              (panel) => this.normalizeEmail(panel.email) === panelEmail,
            ),
        ),
      )
      .map((job) => this.attachStoredFilesToJob(job));
  }

  /* ================= VENDOR MANAGER ================= */

 if (user.role === 'VENDOR_MANAGER') {

  const jobs = await this.jobRepo.find({
    where: {
      isActive: true,
      status: In([
        JobStatus.APPROVED,
        JobStatus.ON_HOLD,
        JobStatus.CLOSED,
      ]),
    },
    relations: ['positions', 'jobVendors', 'jobVendors.vendor'],
    order: { createdAt: 'DESC' },
  });

   return jobs.map((job) => ({
    ...this.attachStoredFilesToJob(job),
    positions: job.positions || [],
  }));
}

  /* ================= OTHERS (HM, HEAD) ================= */

  const jobs = await this.jobRepo.find({
    relations: ['positions'],
    order: { createdAt: 'DESC' },
  });

  return jobs.map((job) => this.attachStoredFilesToJob(job));
}

  /* ======================================================
     CREATE JOB (UPDATED)
  ====================================================== */

  async createJob(data: any): Promise<Job> {
  console.log('🔥 CREATE JOB API HIT');

  const { interviewRounds, positions, ...jobData } = data;

  const jobEntity = this.jobRepo.create(
    jobData as DeepPartial<Job>,
  );

  jobEntity.status = JobStatus.PENDING_APPROVAL;
  jobEntity.isActive = true;
  jobEntity.currentNumberOfPositions = Number(
    jobData.numberOfPositions || 0,
  );

  let savedJob: Job;

  try {
    savedJob = await this.jobRepo.save(jobEntity);
    console.log('🔥 JOB SAVED:', savedJob.id);
  } catch (error) {
    console.error('❌ JOB SAVE ERROR:', error);
    throw error;
  }

  /* ================= POSITIONS ================= */

  if (Array.isArray(positions) && positions.length) {
    for (const pos of positions) {
      const positionEntity = new JobPosition();
      positionEntity.level = pos.level;
      positionEntity.openings = Number(pos.openings || 0);
      this.setPositionCurrentOpenings(
        positionEntity,
        Number(pos.openings || 0),
      );
      positionEntity.status = JobPositionStatus.OPEN;
      positionEntity.requestType = pos.requestType || 'NEW';
      positionEntity.backfillEmployeeId = pos.backfillEmployeeId || null;
      positionEntity.backfillEmployeeName = pos.backfillEmployeeName || null;
      positionEntity.job = savedJob;

      await this.positionRepo.save(positionEntity);
    }
  }

  /* ================= INTERVIEW ================= */

  if (Array.isArray(interviewRounds)) {
    await this.syncScreeningPanelUsers(interviewRounds);

    for (const round of interviewRounds) {
      const roundEntity = this.roundRepo.create({
        roundName: round.roundName,
        mode: round.mode,
        job: savedJob,
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
  const hydratedJob = await this.getJobById(savedJob.id);
  await this.notifyScreeningPanels(hydratedJob);
  return hydratedJob;
}


/*hold and close*/

async holdJob(jobId: number) {
  const job = await this.jobRepo.findOne({ where: { id: jobId } });
  if (!job) throw new NotFoundException('Job not found');

  if (job.status === JobStatus.CLOSED) {
    throw new Error('Closed job cannot be put on hold');
  }

  job.status = JobStatus.ON_HOLD;
  await this.jobRepo.save(job);

  return { success: true };
}

async reopenJob(jobId: number) {
  const job = await this.jobRepo.findOne({ where: { id: jobId } });
  if (!job) throw new NotFoundException('Job not found');

  if (job.status === JobStatus.CLOSED) {
    throw new Error('Closed job cannot be reopened');
  }

  job.status = JobStatus.APPROVED;
  await this.jobRepo.save(job);

  return { success: true };
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
  job.currentNumberOfPositions = Number(
    jobData.numberOfPositions || 0,
  );

  // 🔥 CRITICAL: RESET STATUS FOR APPROVAL
  job.status = JobStatus.PENDING_APPROVAL;

  await this.jobRepo.save(job);
 

  /* ================= RESET POSITIONS ================= */

  await this.positionRepo.delete({ job: { id: jobId } });

  if (Array.isArray(positions)) {
    for (const pos of positions) {
      const newPos = new JobPosition();
      newPos.level = pos.level;
      newPos.openings = Number(pos.openings || 0);
      this.setPositionCurrentOpenings(newPos, Number(pos.openings || 0));
      newPos.status = JobPositionStatus.OPEN;
      newPos.requestType = pos.requestType || 'NEW';
      newPos.backfillEmployeeId = pos.backfillEmployeeId || null;
      newPos.backfillEmployeeName = pos.backfillEmployeeName || null;
      newPos.job = job;

      await this.positionRepo.save(newPos);
    }
  }

  /* ================= RESET INTERVIEW ROUNDS ================= */

  await this.roundRepo.delete({ job: { id: jobId } });

  if (Array.isArray(interviewRounds)) {
    await this.syncScreeningPanelUsers(interviewRounds);

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
  const hydratedJob = await this.getJobById(jobId);
  await this.notifyScreeningPanels(hydratedJob);
  return hydratedJob;
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

  async getJobById(jobId: number, user?: any): Promise<any> {
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

    if (user?.role === 'PANEL') {
      const panelEmail = this.normalizeEmail(user.email);
      const hasAccess = (job.interviewRounds || []).some(
        (round) =>
          (round.roundName || '').trim().toUpperCase() === 'SCREENING' &&
          (round.panels || []).some(
            (panel) => this.normalizeEmail(panel.email) === panelEmail,
          ),
      );

      if (!hasAccess) {
        throw new NotFoundException('Job not found');
      }
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
      ...this.attachStoredFilesToJob(job),
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

    this.setPositionCurrentOpenings(position, 0);
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

  async attachJD(jobId: number, files: Express.Multer.File[]) {
    const job = await this.jobRepo.findOne({ where: { id: jobId } });
    if (!job) throw new NotFoundException('Job not found');

    const existingFiles = this.parseStoredFiles(job.jdFiles);
    const mergedFiles = [...existingFiles, ...this.buildStoredFiles(files)];
    this.setPrimaryFileFields(job, 'jd', mergedFiles);

    return this.jobRepo.save(job);
  }

  async getJD(jobId: number, index = 0) {
    const job = await this.jobRepo.findOne({ where: { id: jobId } });
    const files = job ? this.parseStoredFiles(job.jdFiles) : [];
    const selectedFile = files[index] || files[0];

    if (!job || !selectedFile)
      throw new NotFoundException('JD not found');

    return selectedFile;
  }

  /* ======================================================
   VENDOR LEVEL CONTROL (NEW)
====================================================== */

async updateVendorJobStatus(
  jobId: number,
  vendorId: string,
  status: 'ACTIVE' | 'ON_HOLD' | 'CLOSED',
) {
  const mapping = await this.jobVendorRepo.findOne({
    where: {
      job: { id: jobId },
      vendor: { id: vendorId },
    },
    relations: ['job', 'vendor'],
  });

  if (!mapping) {
    throw new NotFoundException('Vendor not assigned to this job');
  }

  mapping.status = status;

  await this.jobVendorRepo.save(mapping);

  return { success: true };
}

  /* ======================================================
   PSQ HANDLING (ADD BELOW getJD)
====================================================== */

async attachPSQ(jobId: number, files: Express.Multer.File[]) {
  const job = await this.jobRepo.findOne({ where: { id: jobId } });
  if (!job) throw new NotFoundException('Job not found');

  const existingFiles = this.parseStoredFiles(job.psqFiles);
  const mergedFiles = [...existingFiles, ...this.buildStoredFiles(files)];
  this.setPrimaryFileFields(job, 'psq', mergedFiles);

  return this.jobRepo.save(job);
}

async getPSQ(jobId: number, index = 0) {
  const job = await this.jobRepo.findOne({ where: { id: jobId } });
  const files = job ? this.parseStoredFiles(job.psqFiles) : [];
  const selectedFile = files[index] || files[0];

  if (!job || !selectedFile)
    throw new NotFoundException('PSQ not found');

  return selectedFile;
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
