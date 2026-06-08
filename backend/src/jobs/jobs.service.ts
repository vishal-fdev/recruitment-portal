import { Injectable, NotFoundException, Optional } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { CandidateDocument, CandidateDocumentModel } from '../mongodb/schemas/candidate.schema';
import { JobDocument, JobDocumentModel } from '../mongodb/schemas/job.schema';
import { VendorDocument, VendorDocumentModel } from '../mongodb/schemas/vendor.schema';
import { MailService } from '../common/mail.service';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/user.entity';
import { JobPosition, JobPositionStatus } from './job-position.entity';
import { JobStatus } from './job-status.enum';
import { Job } from './job.entity';

type StoredFileMeta = {
  path: string;
  fileName: string;
  mimeType: string;
};

@Injectable()
export class JobsService {
  constructor(
    @InjectModel(JobDocumentModel.name)
    private readonly jobMongoModel: Model<JobDocument>,
    @InjectModel(VendorDocumentModel.name)
    private readonly vendorMongoModel: Model<VendorDocument>,
    @InjectModel(CandidateDocumentModel.name)
    private readonly candidateMongoModel: Model<CandidateDocument>,
    private readonly usersService: UsersService,
    private readonly mailService: MailService,
  ) {}

  private normalizeEmail(email?: string | null) {
    return (email || '').trim().toLowerCase();
  }

  private serializeForMongo<T>(value: T): T {
    return JSON.parse(JSON.stringify(value));
  }

  private escapeRegex(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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

  private queueJobNotifications(job: any) {
    void Promise.allSettled([
      this.mailService.sendApprovalEmail(job),
      this.notifyScreeningPanels(job),
    ]).then((results) => {
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          const label = index === 0 ? 'approval email' : 'panel notifications';
          console.error(`Failed background ${label}:`, result.reason);
        }
      });
    });
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

  private attachStoredFilesToJob<T extends Record<string, any>>(job: T) {
    const jdFiles = this.parseStoredFiles(job.jdFiles);
    const psqFiles = this.parseStoredFiles(job.psqFiles);

    return {
      ...job,
      jdFiles:
        jdFiles.length || !job.jdPath
          ? jdFiles
          : [
              {
                path: job.jdPath,
                fileName: job.jdFileName,
                mimeType: job.jdMimeType,
              },
            ],
      psqFiles:
        psqFiles.length || !job.psqPath
          ? psqFiles
          : [
              {
                path: job.psqPath,
                fileName: job.psqFileName,
                mimeType: job.psqMimeType,
              },
            ],
    };
  }

  private setPrimaryFileFields(
    job: Record<string, any>,
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

  private getPositionCurrentOpenings(position: Partial<JobPosition> & { openings?: number }) {
    return Number(position.currentOpenings ?? position.openings ?? 0);
  }

  private setPositionCurrentOpenings(
    position: Partial<JobPosition> & { openings?: number },
    value: number,
  ) {
    position.currentOpenings = value;
  }

  private async getNextJobId() {
    const docs = await this.jobMongoModel
      .find({}, { postgresId: 1 })
      .sort({ postgresId: -1 })
      .limit(1)
      .lean()
      .exec();
    return Number(docs[0]?.postgresId || 0) + 1;
  }

  private async getNextPositionId() {
    const docs = await this.jobMongoModel.find({}, { positions: 1 }).lean().exec();
    let maxId = 0;
    for (const doc of docs) {
      for (const position of doc.positions || []) {
        maxId = Math.max(maxId, Number((position as any)?.id || 0));
      }
    }
    return maxId + 1;
  }

  private async getNextRoundId() {
    const docs = await this.jobMongoModel.find({}, { interviewRounds: 1 }).lean().exec();
    let maxId = 0;
    for (const doc of docs) {
      for (const round of doc.interviewRounds || []) {
        maxId = Math.max(maxId, Number((round as any)?.id || 0));
      }
    }
    return maxId + 1;
  }

  private async getNextPanelId() {
    const docs = await this.jobMongoModel.find({}, { interviewRounds: 1 }).lean().exec();
    let maxId = 0;
    for (const doc of docs) {
      for (const round of doc.interviewRounds || []) {
        for (const panel of (round as any)?.panels || []) {
          maxId = Math.max(maxId, Number(panel?.id || 0));
        }
      }
    }
    return maxId + 1;
  }

  private async getNextJobVendorId() {
    const docs = await this.jobMongoModel.find({}, { jobVendors: 1 }).lean().exec();
    let maxId = 0;
    for (const doc of docs) {
      for (const mapping of doc.jobVendors || []) {
        maxId = Math.max(maxId, Number((mapping as any)?.id || 0));
      }
    }
    return maxId + 1;
  }

  private mapMongoVendor(doc: any) {
    if (!doc) return null;

    return {
      id: doc.postgresId,
      name: doc.name,
      email: doc.email,
      isActive: doc.isActive,
      createdAt: doc.createdAt ? new Date(doc.createdAt) : null,
      profile: doc.profile || null,
      escalations: Array.isArray(doc.escalations) ? doc.escalations : [],
      engagements: Array.isArray(doc.engagements) ? doc.engagements : [],
      sows: Array.isArray(doc.sows) ? doc.sows : [],
    };
  }

  private mapMongoCandidate(doc: any) {
    if (!doc) return null;

    return {
      id: Number(doc.postgresId),
      name: doc.name,
      email: doc.email,
      phone: doc.phone,
      aadharNo: doc.aadharNo ?? null,
      gender: doc.gender ?? null,
      education: doc.education ?? null,
      videoLink: doc.videoLink ?? null,
      primarySkills: doc.primarySkills ?? null,
      secondarySkills: doc.secondarySkills ?? null,
      country: doc.country ?? null,
      state: doc.state ?? null,
      city: doc.city ?? null,
      experience: doc.experience,
      noticePeriod: doc.noticePeriod,
      currentOrg: doc.currentOrg,
      resumePath: doc.resumePath,
      status: doc.status,
      dropJustification: doc.dropJustification ?? null,
      ytjJustification: doc.ytjJustification ?? null,
      dateOfJoining: doc.dateOfJoining ?? null,
      createdAt: doc.createdAt ? new Date(doc.createdAt) : null,
      vendor: doc.vendorSnapshot || null,
      job: doc.jobSnapshot || null,
      position: doc.positionSnapshot || null,
      interviews: Array.isArray(doc.interviews) ? doc.interviews : [],
    };
  }

  private mapMongoJob(doc: any): any {
    if (!doc) return null;

    return {
      id: Number(doc.postgresId),
      title: doc.title,
      location: doc.location,
      experience: doc.experience,
      department: doc.department ?? null,
      jobCategory: doc.jobCategory ?? null,
      workType: doc.workType ?? null,
      region: doc.region ?? null,
      dealName: doc.dealName ?? null,
      hiringManager: doc.hiringManager ?? null,
      justification: doc.justification ?? null,
      employmentType: doc.employmentType ?? null,
      budget: doc.budget ?? null,
      startDate: doc.startDate ?? null,
      endDate: doc.endDate ?? null,
      level: doc.level ?? null,
      numberOfPositions: doc.numberOfPositions ?? null,
      currentNumberOfPositions: doc.currentNumberOfPositions ?? null,
      requestType: doc.requestType ?? null,
      backfillEmployeeId: doc.backfillEmployeeId ?? null,
      backfillEmployeeName: doc.backfillEmployeeName ?? null,
      description: doc.description ?? null,
      status: doc.status,
      isActive: doc.isActive,
      jdPath: doc.jdPath ?? '',
      jdFileName: doc.jdFileName ?? '',
      jdMimeType: doc.jdMimeType ?? '',
      jdFiles: doc.jdFiles ?? '',
      psqPath: doc.psqPath ?? '',
      psqFileName: doc.psqFileName ?? '',
      psqMimeType: doc.psqMimeType ?? '',
      psqFiles: doc.psqFiles ?? '',
      createdAt: doc.createdAt ? new Date(doc.createdAt) : null,
      positions: Array.isArray(doc.positions) ? doc.positions : [],
      interviewRounds: Array.isArray(doc.interviewRounds) ? doc.interviewRounds : [],
      jobVendors: Array.isArray(doc.jobVendors) ? doc.jobVendors : [],
      candidates: Array.isArray(doc.candidates) ? doc.candidates : [],
    };
  }

  private async findJobDocById(jobId: number) {
    return this.jobMongoModel.findOne({ postgresId: jobId }).exec();
  }

  private async findLeanJobById(jobId: number) {
    const doc = await this.jobMongoModel.findOne({ postgresId: jobId }).lean().exec();
    return this.mapMongoJob(doc);
  }

  private async getActiveVendors() {
    const docs = await this.vendorMongoModel.find({ isActive: true }).lean().exec();
    return docs
      .map((doc) => this.mapMongoVendor(doc))
      .filter((vendor): vendor is NonNullable<ReturnType<JobsService['mapMongoVendor']>> => Boolean(vendor));
  }

  private async getCandidatesForJob(jobId: number) {
    const docs = await this.candidateMongoModel.find({ jobPostgresId: jobId }).lean().exec();
    return docs.map((doc) => this.mapMongoCandidate(doc));
  }

  private async buildPositionDocs(positions: any[] = []) {
    let nextPositionId = await this.getNextPositionId();

    return positions.map((pos) => {
      const position: Record<string, any> = {
        id: nextPositionId++,
        level: pos.level,
        openings: Number(pos.openings || 0),
        currentOpenings: Number(pos.openings || 0),
        status: JobPositionStatus.OPEN,
        requestType: pos.requestType || 'NEW',
        backfillEmployeeId: pos.backfillEmployeeId || null,
        backfillEmployeeName: pos.backfillEmployeeName || null,
        jdPath: pos.jdPath || null,
        jdFileName: pos.jdFileName || null,
        jdMimeType: pos.jdMimeType || null,
        psqPath: pos.psqPath || null,
        psqFileName: pos.psqFileName || null,
        psqMimeType: pos.psqMimeType || null,
        createdAt: new Date(),
      };

      return position;
    });
  }

  private async buildInterviewRounds(rounds: any[] = []) {
    let nextRoundId = await this.getNextRoundId();
    let nextPanelId = await this.getNextPanelId();

    return rounds.map((round) => ({
      id: nextRoundId++,
      roundName: round.roundName,
      mode: round.mode,
      panels: Array.isArray(round.panels)
        ? round.panels.map((panel: any) => ({
            id: nextPanelId++,
            name: panel.name,
            email: panel.email,
          }))
        : [],
    }));
  }

  async getJobsForUser(user: any): Promise<any[]> {
    const mongoJobs = (await this.jobMongoModel.find().lean().exec()).map((doc) =>
      this.mapMongoJob(doc),
    );

    if (user.role === 'VENDOR') {
      const vendorId = user.vendor?.id || user.vendorId;
      if (!vendorId) return [];

      const vendorDoc = await this.vendorMongoModel.findOne({ postgresId: vendorId }).lean().exec();
      if (!vendorDoc || !vendorDoc.isActive) {
        return [];
      }

      return mongoJobs
        .filter((job) =>
          [JobStatus.APPROVED, JobStatus.ON_HOLD, JobStatus.CLOSED].includes(job.status),
        )
        .filter((job) =>
          (job.jobVendors || []).some(
            (mapping: any) =>
              mapping?.vendor?.id === vendorId &&
              mapping?.isEnabled === true &&
              mapping?.status === 'ACTIVE',
          ),
        )
        .map((job) => {
          const openPositions =
            job.positions?.filter(
              (p: any) =>
                p.status === JobPositionStatus.OPEN &&
                Number(p.currentOpenings ?? p.openings ?? 0) > 0,
            ) || [];
          const hasMainOpenings =
            Number(job.currentNumberOfPositions ?? job.numberOfPositions ?? 0) > 0;

          return {
            ...this.attachStoredFilesToJob(job),
            positions: openPositions,
            hasMainOpenings,
          };
        })
        .filter((job) => job.positions.length > 0 || job.hasMainOpenings)
        .sort(
          (a, b) =>
            new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime(),
        );
    }

    if (user.role === 'PANEL') {
      const panelEmail = this.normalizeEmail(user.email);

      return mongoJobs
        .filter((job) =>
          (job.interviewRounds || []).some(
            (round: any) =>
              (round.roundName || '').trim().toUpperCase() === 'SCREENING' &&
              (round.panels || []).some(
                (panel: any) => this.normalizeEmail(panel.email) === panelEmail,
              ),
          ),
        )
        .map((job) => this.attachStoredFilesToJob(job))
        .sort(
          (a, b) =>
            new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime(),
        );
    }

    if (user.role === 'VENDOR_MANAGER') {
      return mongoJobs
        .filter((job) => job.isActive)
        .map((job) => ({
          ...this.attachStoredFilesToJob(job),
          positions: job.positions || [],
        }))
        .sort(
          (a, b) =>
            new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime(),
        );
    }

    return mongoJobs
      .map((job) => this.attachStoredFilesToJob(job))
      .sort(
        (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime(),
      );
  }

  async createJob(data: any): Promise<Job> {
    const { interviewRounds, positions, ...jobData } = data;

    const jobId = await this.getNextJobId();
    const positionDocs = await this.buildPositionDocs(Array.isArray(positions) ? positions : []);
    const roundDocs = await this.buildInterviewRounds(Array.isArray(interviewRounds) ? interviewRounds : []);

    await this.syncScreeningPanelUsers(roundDocs);

    const created = await this.jobMongoModel.create({
      postgresId: jobId,
      ...jobData,
      numberOfPositions: Number(jobData.numberOfPositions || 0),
      currentNumberOfPositions: Number(jobData.numberOfPositions || 0),
      status: JobStatus.PENDING_APPROVAL,
      isActive: true,
      positions: positionDocs,
      interviewRounds: roundDocs,
      jobVendors: [],
      candidates: [],
    });

    const hydratedJob = await this.getJobById(Number(created.postgresId));
    this.queueJobNotifications(hydratedJob);
    return hydratedJob as Job;
  }

  async holdJob(jobId: number) {
    const job = await this.findJobDocById(jobId);
    if (!job) throw new NotFoundException('Job not found');

    if (job.status === JobStatus.CLOSED) {
      throw new Error('Closed job cannot be put on hold');
    }

    job.status = JobStatus.ON_HOLD;
    await job.save();

    return { success: true };
  }

  async reopenJob(jobId: number) {
    const job = await this.findJobDocById(jobId);
    if (!job) throw new NotFoundException('Job not found');

    if (job.status === JobStatus.CLOSED) {
      throw new Error('Closed job cannot be reopened');
    }

    job.status = JobStatus.APPROVED;
    await job.save();

    return { success: true };
  }

  async updateJob(jobId: number, data: any): Promise<Job> {
    const job = await this.findJobDocById(jobId);
    if (!job) {
      throw new NotFoundException('Job not found');
    }

    const { interviewRounds, positions, ...jobData } = data;
    const positionDocs = await this.buildPositionDocs(Array.isArray(positions) ? positions : []);
    const roundDocs = await this.buildInterviewRounds(Array.isArray(interviewRounds) ? interviewRounds : []);

    await this.syncScreeningPanelUsers(roundDocs);

    Object.assign(job, {
      ...jobData,
      numberOfPositions: Number(jobData.numberOfPositions || 0),
      currentNumberOfPositions: Number(jobData.numberOfPositions || 0),
      status: JobStatus.PENDING_APPROVAL,
      positions: positionDocs,
      interviewRounds: roundDocs,
    });

    await job.save();

    const hydratedJob = await this.getJobById(jobId);
    this.queueJobNotifications(hydratedJob);
    return hydratedJob as Job;
  }

  async getTemplateByTitle(title: string) {
    if (!title) return null;

    const job = this.mapMongoJob(
      await this.jobMongoModel
        .findOne({
          title: {
            $regex: `^${this.escapeRegex(title)}$`,
            $options: 'i',
          },
        })
        .lean()
        .exec(),
    );

    if (!job) return null;

    return {
      title: job.title,
      location: job.location,
      experience: job.experience,
      department: job.department,
      budget: job.budget,
      description: job.description,
      positions: job.positions?.map((p: any) => ({
        level: p.level,
        openings: p.openings,
        requestType: p.requestType,
        backfillEmployeeId: p.backfillEmployeeId,
        backfillEmployeeName: p.backfillEmployeeName,
      })),
      interviewRounds: job.interviewRounds?.map((r: any) => ({
        roundName: r.roundName,
        mode: r.mode,
        panels: r.panels?.map((p: any) => ({
          name: p.name,
          email: p.email,
        })),
      })),
    };
  }

  async getJobById(jobId: number, user?: any): Promise<any> {
    const job = await this.findLeanJobById(jobId);
    if (!job) {
      throw new NotFoundException('Job not found');
    }

    if (user?.role === 'PANEL') {
      const panelEmail = this.normalizeEmail(user.email);
      const hasAccess = (job.interviewRounds || []).some(
        (round: any) =>
          (round.roundName || '').trim().toUpperCase() === 'SCREENING' &&
          (round.panels || []).some(
            (panel: any) => this.normalizeEmail(panel.email) === panelEmail,
          ),
      );

      if (!hasAccess) {
        throw new NotFoundException('Job not found');
      }
    }

    const allVendors = await this.getActiveVendors();
    const vendors = allVendors.map((vendor) => {
      const mapping = (job.jobVendors || []).find((jv: any) => jv?.vendor?.id === vendor.id);

      return {
        id: vendor.id,
        email: vendor.email,
        isEnabled: mapping ? mapping.isEnabled : false,
      };
    });

    const candidates = await this.getCandidatesForJob(jobId);

    return {
      ...this.attachStoredFilesToJob(job),
      vendors,
      candidates,
    };
  }

  async toggleVendor(jobId: number, vendorId: string, isEnabled: boolean) {
    const job = await this.findJobDocById(jobId);
    if (!job) {
      throw new NotFoundException('Job or Vendor not found');
    }

    const vendorDoc = await this.vendorMongoModel.findOne({ postgresId: vendorId }).lean().exec();
    if (!vendorDoc) {
      throw new NotFoundException('Job or Vendor not found');
    }

    const currentMappings = Array.isArray(job.jobVendors) ? [...job.jobVendors] : [];
    const existingIndex = currentMappings.findIndex(
      (mapping: any) => mapping?.vendor?.id === vendorId,
    );

    if (existingIndex >= 0) {
      (currentMappings[existingIndex] as any).isEnabled = isEnabled;
    } else {
      currentMappings.push({
        id: await this.getNextJobVendorId(),
        vendor: this.serializeForMongo(this.mapMongoVendor(vendorDoc)),
        isEnabled,
        status: 'ACTIVE',
      });
    }

    job.jobVendors = this.serializeForMongo(currentMappings) as any;
    await job.save();
    return { success: true };
  }

  async closePosition(positionId: number) {
    const job = await this.jobMongoModel.findOne({ 'positions.id': positionId }).exec();
    if (!job) throw new NotFoundException('Position not found');

    const positions = Array.isArray(job.positions) ? [...job.positions] : [];
    const positionIndex = positions.findIndex((position: any) => position?.id === positionId);
    if (positionIndex < 0) throw new NotFoundException('Position not found');

    const position = positions[positionIndex] as any;
    position.currentOpenings = 0;
    position.status = JobPositionStatus.CLOSED;
    positions[positionIndex] = position;
    job.positions = positions as any;
    await job.save();

    return { success: true };
  }

  async closeJob(jobId: number) {
    const job = await this.findJobDocById(jobId);
    if (!job) throw new NotFoundException('Job not found');

    job.isActive = false;
    job.status = JobStatus.CLOSED;
    await job.save();
    return { success: true };
  }

  async approveJob(jobId: number) {
    const job = await this.findJobDocById(jobId);
    if (!job) throw new NotFoundException('Job not found');

    job.status = JobStatus.APPROVED;
    await job.save();
    return { success: true };
  }

  async rejectJob(jobId: number) {
    const job = await this.findJobDocById(jobId);
    if (!job) throw new NotFoundException('Job not found');

    job.status = JobStatus.REJECTED;
    await job.save();
    return { success: true };
  }

  async attachJD(jobId: number, files: Express.Multer.File[]) {
    const job = await this.findJobDocById(jobId);
    if (!job) throw new NotFoundException('Job not found');

    const existingFiles = this.parseStoredFiles(job.jdFiles);
    const mergedFiles = [...existingFiles, ...this.buildStoredFiles(files)];
    this.setPrimaryFileFields(job as any, 'jd', mergedFiles);

    await job.save();
    return this.getJobById(jobId);
  }

  async getJD(jobId: number, index = 0) {
    const job = await this.findLeanJobById(jobId);
    const files = job ? this.parseStoredFiles(job.jdFiles) : [];
    const effectiveFiles =
      files.length || !job?.jdPath
        ? files
        : [
            {
              path: job.jdPath,
              fileName: job.jdFileName,
              mimeType: job.jdMimeType,
            },
          ];
    const selectedFile = effectiveFiles[index] || effectiveFiles[0];

    if (!job || !selectedFile) throw new NotFoundException('JD not found');
    return selectedFile;
  }

  async updateVendorJobStatus(
    jobId: number,
    vendorId: string,
    status: 'ACTIVE' | 'ON_HOLD' | 'CLOSED',
  ) {
    const job = await this.findJobDocById(jobId);
    if (!job) throw new NotFoundException('Vendor not assigned to this job');

    const mappings = Array.isArray(job.jobVendors) ? [...job.jobVendors] : [];
    const mappingIndex = mappings.findIndex((mapping: any) => mapping?.vendor?.id === vendorId);
    if (mappingIndex < 0) {
      throw new NotFoundException('Vendor not assigned to this job');
    }

    (mappings[mappingIndex] as any).status = status;
    job.jobVendors = this.serializeForMongo(mappings) as any;
    await job.save();

    return { success: true };
  }

  async attachPSQ(jobId: number, files: Express.Multer.File[]) {
    const job = await this.findJobDocById(jobId);
    if (!job) throw new NotFoundException('Job not found');

    const existingFiles = this.parseStoredFiles(job.psqFiles);
    const mergedFiles = [...existingFiles, ...this.buildStoredFiles(files)];
    this.setPrimaryFileFields(job as any, 'psq', mergedFiles);

    await job.save();
    return this.getJobById(jobId);
  }

  async getPSQ(jobId: number, index = 0) {
    const job = await this.findLeanJobById(jobId);
    const files = job ? this.parseStoredFiles(job.psqFiles) : [];
    const effectiveFiles =
      files.length || !job?.psqPath
        ? files
        : [
            {
              path: job.psqPath,
              fileName: job.psqFileName,
              mimeType: job.psqMimeType,
            },
          ];
    const selectedFile = effectiveFiles[index] || effectiveFiles[0];

    if (!job || !selectedFile) throw new NotFoundException('PSQ not found');
    return selectedFile;
  }

  async attachPositionJD(positionId: number, file: Express.Multer.File) {
    const job = await this.jobMongoModel.findOne({ 'positions.id': positionId }).exec();
    if (!job) throw new NotFoundException('Position not found');

    const positions = Array.isArray(job.positions) ? [...job.positions] : [];
    const positionIndex = positions.findIndex((position: any) => position?.id === positionId);
    if (positionIndex < 0) throw new NotFoundException('Position not found');

    const position = positions[positionIndex] as any;
    position.jdPath = file.path;
    position.jdFileName = file.originalname;
    position.jdMimeType = file.mimetype;
    positions[positionIndex] = position;
    job.positions = positions as any;
    await job.save();

    return position;
  }

  async attachPositionPSQ(positionId: number, file: Express.Multer.File) {
    const job = await this.jobMongoModel.findOne({ 'positions.id': positionId }).exec();
    if (!job) throw new NotFoundException('Position not found');

    const positions = Array.isArray(job.positions) ? [...job.positions] : [];
    const positionIndex = positions.findIndex((position: any) => position?.id === positionId);
    if (positionIndex < 0) throw new NotFoundException('Position not found');

    const position = positions[positionIndex] as any;
    position.psqPath = file.path;
    position.psqFileName = file.originalname;
    position.psqMimeType = file.mimetype;
    positions[positionIndex] = position;
    job.positions = positions as any;
    await job.save();

    return position;
  }

  async getPositionJD(positionId: number) {
    const job = await this.jobMongoModel.findOne({ 'positions.id': positionId }).lean().exec();
    const position = (job?.positions || []).find((entry: any) => entry?.id === positionId) as any;
    if (!position || !position.jdPath) throw new NotFoundException('JD not found');
    return position;
  }

  async getPositionPSQ(positionId: number) {
    const job = await this.jobMongoModel.findOne({ 'positions.id': positionId }).lean().exec();
    const position = (job?.positions || []).find((entry: any) => entry?.id === positionId) as any;
    if (!position || !position.psqPath) throw new NotFoundException('PSQ not found');
    return position;
  }
}
