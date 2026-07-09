import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { JobPositionStatus } from '../jobs/job-position.entity';
import { JobStatus } from '../jobs/job-status.enum';
import {
  JobDocument,
  JobDocumentModel,
} from '../mongodb/schemas/job.schema';
import {
  PartnerSlotDocument,
  PartnerSlotDocumentModel,
} from '../mongodb/schemas/partner-slot.schema';
import {
  VendorDocument,
  VendorDocumentModel,
} from '../mongodb/schemas/vendor.schema';
import {
  CandidateDocument,
  CandidateDocumentModel,
} from '../mongodb/schemas/candidate.schema';
import {
  PartnerSlotStatus,
  SlotAttendanceStatus,
} from '../partner-slots/partner-slot.entity';
import { Candidate } from './candidate.entity';
import { CandidateStatus } from './candidate-status.enum';

@Injectable()
export class CandidatesService {
  constructor(
    @InjectModel(CandidateDocumentModel.name)
    private readonly candidateMongoModel: Model<CandidateDocument>,
    @InjectModel(VendorDocumentModel.name)
    private readonly vendorMongoModel: Model<VendorDocument>,
    @InjectModel(JobDocumentModel.name)
    private readonly jobMongoModel: Model<JobDocument>,
    @InjectModel(PartnerSlotDocumentModel.name)
    private readonly partnerSlotMongoModel: Model<PartnerSlotDocument>,
  ) {}

  private normalizeEmail(email?: string | null) {
    return (email || '').trim().toLowerCase();
  }

  private parseNumberField(value: unknown, fallback?: number) {
    if (value === null || value === undefined || value === '') {
      return fallback;
    }

    const direct = Number(value);
    if (Number.isFinite(direct)) {
      return direct;
    }

    const match = String(value).match(/\d+/);
    if (match) {
      return Number(match[0]);
    }

    return fallback;
  }

  private serializeForMongo<T>(value: T): T {
    return JSON.parse(JSON.stringify(value));
  }

  private async getAssignedScreeningJobIds(email?: string | null) {
    const panelEmail = this.normalizeEmail(email);
    if (!panelEmail) return [];

    const jobs = await this.jobMongoModel.find({}, { postgresId: 1, interviewRounds: 1 }).lean().exec();

    return jobs
      .filter((job) =>
        (job.interviewRounds || []).some(
          (round: any) =>
            (round.roundName || '').trim().toUpperCase() === 'SCREENING' &&
            (round.panels || []).some(
              (panel: any) => this.normalizeEmail(panel.email) === panelEmail,
            ),
        ),
      )
      .map((job) => Number(job.postgresId));
  }

  private async getNextCandidateId() {
    const docs = await this.candidateMongoModel
      .find({}, { postgresId: 1 })
      .sort({ postgresId: -1 })
      .limit(1)
      .lean()
      .exec();
    return Number(docs[0]?.postgresId || 0) + 1;
  }

  private async getNextInterviewId() {
    const docs = await this.candidateMongoModel.find({}, { interviews: 1 }).lean().exec();
    let maxId = 0;
    for (const doc of docs) {
      for (const interview of doc.interviews || []) {
        maxId = Math.max(maxId, Number((interview as any)?.id || 0));
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

  private mapMongoJob(doc: any) {
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
      createdAt: doc.createdAt ? new Date(doc.createdAt) : new Date(),
      positions: Array.isArray(doc.positions) ? doc.positions : [],
      interviewRounds: Array.isArray(doc.interviewRounds) ? doc.interviewRounds : [],
      jobVendors: Array.isArray(doc.jobVendors) ? doc.jobVendors : [],
      candidates: Array.isArray(doc.candidates) ? doc.candidates : [],
    };
  }

  private mapMongoCandidate(doc: any): Candidate | null {
    if (!doc) return null;

    const candidate = new Candidate();

    candidate.id = Number(doc.postgresId);
    candidate.name = doc.name;
    candidate.email = doc.email;
    candidate.phone = doc.phone;
    candidate.aadharNo = doc.aadharNo ?? null;
    candidate.gender = doc.gender ?? null;
    candidate.education = doc.education ?? null;
    candidate.videoLink = doc.videoLink ?? null;
    candidate.primarySkills = doc.primarySkills ?? null;
    candidate.secondarySkills = doc.secondarySkills ?? null;
    candidate.country = doc.country ?? null;
    candidate.state = doc.state ?? null;
    candidate.city = doc.city ?? null;
    candidate.experience = Number(doc.experience ?? 0);
    candidate.noticePeriod = Number(doc.noticePeriod ?? 0);
    candidate.currentOrg = doc.currentOrg;
    candidate.resumePath = doc.resumePath;
    candidate.status = doc.status;
    candidate.dropJustification = doc.dropJustification ?? null;
    candidate.ytjJustification = doc.ytjJustification ?? null;
    candidate.dateOfJoining = doc.dateOfJoining ?? null;
    candidate.createdAt = doc.createdAt ? new Date(doc.createdAt) : new Date();
    candidate.vendor = (doc.vendorSnapshot || null) as any;
    candidate.job = (doc.jobSnapshot || null) as any;
    candidate.position = (doc.positionSnapshot || null) as any;
    candidate.interviews = Array.isArray(doc.interviews) ? (doc.interviews as any) : [];

    return candidate;
  }

  private async getCandidateDocById(candidateId: number) {
    return this.candidateMongoModel.findOne({ postgresId: candidateId }).exec();
  }

  private async getLeanCandidateById(candidateId: number) {
    const doc = await this.candidateMongoModel.findOne({ postgresId: candidateId }).lean().exec();
    return this.mapMongoCandidate(doc);
  }

  private async refreshCandidateSnapshots(candidateDoc: CandidateDocument) {
    if (candidateDoc.vendorPostgresId) {
      const vendorDoc = await this.vendorMongoModel
        .findOne({ postgresId: candidateDoc.vendorPostgresId })
        .lean()
        .exec();
      candidateDoc.vendorSnapshot = this.serializeForMongo(this.mapMongoVendor(vendorDoc));
    }

    if (candidateDoc.jobPostgresId) {
      const jobDoc = await this.jobMongoModel
        .findOne({ postgresId: candidateDoc.jobPostgresId })
        .lean()
        .exec();
      const mappedJob = this.mapMongoJob(jobDoc);
      candidateDoc.jobSnapshot = this.serializeForMongo(mappedJob);

      if (mappedJob && candidateDoc.positionPostgresId) {
        const position = (mappedJob.positions || []).find(
          (entry: any) => Number(entry?.id) === Number(candidateDoc.positionPostgresId),
        );
        candidateDoc.positionSnapshot = this.serializeForMongo(position || null);
      }
    }
  }

  async createCandidate(
    data: any,
    resumePath: string,
    vendorId: string,
  ) {
    const normalizedVendorId = String(vendorId || '');
    const vendorDoc = await this.vendorMongoModel.findOne({ postgresId: normalizedVendorId }).lean().exec();
    const vendor = this.mapMongoVendor(vendorDoc);

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    if (!vendor.isActive) {
      throw new BadRequestException(
        'This vendor is inactive and cannot submit candidates',
      );
    }

    if (data.aadharNo?.trim()) {
      const duplicateByAadhar = await this.candidateMongoModel.findOne({
        aadharNo: data.aadharNo.trim(),
      }).lean().exec();

      if (duplicateByAadhar) {
        throw new BadRequestException(
          'Candidate with this Aadhaar number already exists',
        );
      }
    }

    let job: any = null;
    let position: any = null;

    if (data.jobId) {
      const jobDoc = await this.jobMongoModel
        .findOne({ postgresId: Number(data.jobId) })
        .lean()
        .exec();
      job = this.mapMongoJob(jobDoc);

      if (!job) {
        throw new NotFoundException('Job not found');
      }

      if (job.status === JobStatus.ON_HOLD) {
        throw new BadRequestException('This job is currently on hold');
      }

      if (job.status === JobStatus.CLOSED) {
        throw new BadRequestException('This job is closed');
      }

      const mapping = (job.jobVendors || []).find(
        (entry: any) =>
          String(entry?.vendor?.id || '') === normalizedVendorId && entry?.isEnabled === true,
      );

      if (!mapping) {
        throw new BadRequestException('Vendor not assigned to this job');
      }

      if (mapping.status !== 'ACTIVE') {
        throw new BadRequestException('This job is not active for your vendor');
      }

      const existing = await this.candidateMongoModel.findOne({
        email: data.email,
        jobPostgresId: job.id,
      }).lean().exec();

      if (existing) {
        throw new BadRequestException('Candidate already submitted for this job');
      }

      if (data.positionId) {
        position = (job.positions || []).find(
          (entry: any) => Number(entry?.id) === Number(data.positionId),
        );

        if (!position) {
          throw new NotFoundException('Position not found');
        }

        if (position.status === JobPositionStatus.CLOSED) {
          throw new BadRequestException('This position is closed');
        }

        if ((position.currentOpenings ?? position.openings) <= 0) {
          throw new BadRequestException('No openings available for this position');
        }
      } else if (
        Number(job.currentNumberOfPositions ?? job.numberOfPositions ?? 0) <= 0
      ) {
        throw new BadRequestException('No openings available for this job');
      }
    }

    const experience = this.parseNumberField(data.experience);
    if (experience === undefined) {
      throw new BadRequestException('Total experience is required');
    }

    const noticePeriod = this.parseNumberField(data.noticePeriod, 0) ?? 0;
    const candidateId = await this.getNextCandidateId();
    const created = await this.candidateMongoModel.create({
      postgresId: candidateId,
      ...data,
      aadharNo: data.aadharNo?.trim() || null,
      gender: data.gender?.trim() || null,
      education: data.education?.trim() || null,
      videoLink: data.videoLink?.trim() || null,
      experience,
      noticePeriod,
      resumePath,
      status: CandidateStatus.SUBMITTED,
      vendorPostgresId: String(vendor.id),
      jobPostgresId: job?.id || null,
      positionPostgresId: position?.id || null,
      vendorSnapshot: this.serializeForMongo(vendor),
      jobSnapshot: this.serializeForMongo(job),
      positionSnapshot: this.serializeForMongo(position),
      interviews: [],
    });

    return this.mapMongoCandidate(created.toObject());
  }

  async updateStage(
    candidateId: number,
    nextStatus: CandidateStatus,
    user: any,
    feedback?: string,
    dropJustification?: string,
    dateOfJoining?: string,
    ytjJustification?: string,
  ) {
    const candidate = await this.getCandidateDocById(candidateId);

    if (!candidate) {
      throw new NotFoundException('Candidate not found');
    }

    await this.assertStatusChangeAllowed(
      candidate.postgresId,
      candidate.status,
      nextStatus,
      user,
      feedback,
      dropJustification,
      dateOfJoining,
      ytjJustification,
    );

    await this.syncPositionAvailability(candidate, candidate.status, nextStatus);

    candidate.status = nextStatus;

    if (nextStatus === CandidateStatus.DROPPED) {
      candidate.dropJustification = dropJustification?.trim() || null;
    } else {
      candidate.dropJustification = null;
    }

    if (nextStatus === CandidateStatus.YET_TO_JOIN) {
      candidate.dateOfJoining = dateOfJoining || null;
      candidate.ytjJustification = ytjJustification?.trim() || null;
    }

    if (nextStatus !== CandidateStatus.YET_TO_JOIN) {
      candidate.ytjJustification = candidate.ytjJustification || null;
    }

    await this.refreshCandidateSnapshots(candidate);
    await candidate.save();
    await this.syncHmFeedbackSubmission(candidate.postgresId, user, nextStatus, feedback);

    return this.getLeanCandidateById(candidateId);
  }

  async getCandidatesForUser(user: any) {
    if (user.role === 'VENDOR') {
      const docs = await this.candidateMongoModel.find({
        vendorPostgresId: user.vendorId,
      }).lean().exec();

      return docs
        .map((doc) => this.mapMongoCandidate(doc))
        .filter((candidate): candidate is Candidate => Boolean(candidate))
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }

    if (user.role === 'PANEL') {
      const jobIds = await this.getAssignedScreeningJobIds(user.email);

      if (!jobIds.length) {
        return [];
      }

      const docs = await this.candidateMongoModel.find({
        jobPostgresId: { $in: jobIds },
      }).lean().exec();

      return docs
        .map((doc) => this.mapMongoCandidate(doc))
        .filter((candidate): candidate is Candidate => Boolean(candidate))
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }

    if (user.role === 'HIRING_MANAGER') {
      const hiringManagerEmail = this.normalizeEmail(user.email);
      const jobs = await this.jobMongoModel
        .find({}, { postgresId: 1, hiringManager: 1 })
        .lean()
        .exec();
      const jobIds = jobs
        .filter((job) => this.normalizeEmail((job as any).hiringManager) === hiringManagerEmail)
        .map((job) => Number(job.postgresId));

      if (!jobIds.length) {
        return [];
      }

      const docs = await this.candidateMongoModel.find({
        jobPostgresId: { $in: jobIds },
      }).lean().exec();

      return docs
        .map((doc) => this.mapMongoCandidate(doc))
        .filter((candidate): candidate is Candidate => Boolean(candidate))
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }

    const docs = await this.candidateMongoModel.find().lean().exec();

    return docs
      .map((doc) => this.mapMongoCandidate(doc))
      .filter((candidate): candidate is Candidate => Boolean(candidate))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getCandidateById(id: number, user: any) {
    const candidate = await this.getLeanCandidateById(id);

    if (!candidate) {
      throw new NotFoundException('Candidate not found');
    }

    if (user.role === 'VENDOR' && candidate.vendor?.id !== user.vendorId) {
      throw new BadRequestException('Unauthorized');
    }

    if (user.role === 'PANEL') {
      const jobIds = await this.getAssignedScreeningJobIds(user.email);
      if (!candidate.job || !jobIds.includes(candidate.job.id)) {
        throw new BadRequestException('Unauthorized');
      }
    }

    if (
      user.role === 'HIRING_MANAGER' &&
      this.normalizeEmail(candidate.job?.hiringManager) !== this.normalizeEmail(user.email)
    ) {
      throw new BadRequestException('Unauthorized');
    }

    return candidate;
  }

  async submitInterviewFeedback(
    candidateId: number,
    roundId: number,
    feedback: string,
    decision: 'SELECT' | 'REJECT',
  ) {
    const candidate = await this.getCandidateDocById(candidateId);

    if (!candidate) {
      throw new NotFoundException('Candidate not found');
    }

    const job = candidate.jobSnapshot as any;
    if (!job) {
      throw new BadRequestException('Candidate has no associated job');
    }

    if (
      candidate.status === CandidateStatus.REJECTED ||
      candidate.status === CandidateStatus.SELECTED
    ) {
      throw new BadRequestException('Candidate decision already finalized');
    }

    const round = (job.interviewRounds || []).find(
      (entry: any) => Number(entry?.id) === Number(roundId),
    );

    if (!round) {
      throw new NotFoundException('Round not found');
    }

    const alreadySubmitted = (candidate.interviews || []).find(
      (interview: any) => Number(interview?.round?.id) === Number(roundId),
    );

    if (alreadySubmitted) {
      throw new BadRequestException('Feedback already submitted for this round');
    }

    const interviewsCount = (candidate.interviews || []).length;
    const expectedRound = (job.interviewRounds || [])[interviewsCount];

    if (!expectedRound || Number(expectedRound.id) !== Number(roundId)) {
      throw new BadRequestException('Invalid round sequence');
    }

    const interview = {
      id: await this.getNextInterviewId(),
      round: this.serializeForMongo(round),
      panelMembers: (round.panels || []).map((p: any) => p.name).join(', '),
      feedback,
      decision,
      feedbackDate: new Date(),
    };

    candidate.interviews = this.serializeForMongo([...(candidate.interviews || []), interview]) as any;

    if (decision === 'REJECT') {
      candidate.status = CandidateStatus.REJECTED;
    } else {
      const totalRounds = (job.interviewRounds || []).length;
      candidate.status =
        interviewsCount === totalRounds - 1
          ? CandidateStatus.IDENTIFIED
          : CandidateStatus.SCREENING;
    }

    await candidate.save();
    return { success: true };
  }

  async getResumePathForUser(candidateId: number, user: any) {
    const candidate = await this.getLeanCandidateById(candidateId);

    if (!candidate) {
      throw new NotFoundException('Candidate not found');
    }

    if (user.role === 'VENDOR' && candidate.vendor?.id !== user.vendorId) {
      throw new BadRequestException('Unauthorized');
    }

    if (user.role === 'PANEL') {
      const jobIds = await this.getAssignedScreeningJobIds(user.email);
      if (!candidate.job || !jobIds.includes(candidate.job.id)) {
        throw new BadRequestException('Unauthorized');
      }
    }

    return candidate.resumePath;
  }

  async checkDuplicate(email?: string, phone?: string, aadharNo?: string) {
    if (aadharNo?.trim()) {
      const aadharMatch = await this.candidateMongoModel.findOne({
        aadharNo: aadharNo.trim(),
      }).lean().exec();

      if (aadharMatch) {
        return {
          exists: true,
          field: 'aadharNo',
        };
      }
    }

    if (email?.trim()) {
      const emailMatch = await this.candidateMongoModel.findOne({
        email: email.trim(),
      }).lean().exec();

      if (emailMatch) {
        return {
          exists: true,
          field: 'email',
        };
      }
    }

    if (phone?.trim()) {
      const phoneMatch = await this.candidateMongoModel.findOne({
        phone: phone.trim(),
      }).lean().exec();

      if (phoneMatch) {
        return {
          exists: true,
          field: 'phone',
        };
      }
    }

    return {
      exists: false,
    };
  }

  private async assertStatusChangeAllowed(
    candidateId: number,
    currentStatus: CandidateStatus,
    nextStatus: CandidateStatus,
    user: any,
    feedback?: string,
    dropJustification?: string,
    dateOfJoining?: string,
    ytjJustification?: string,
  ) {
    if (user.role === 'HIRING_MANAGER') {
      const allowedTransitions: Partial<Record<CandidateStatus, CandidateStatus[]>> = {
        [CandidateStatus.SUBMITTED]: [
          CandidateStatus.SCREEN_SELECTED,
          CandidateStatus.SCREEN_REJECTED,
        ],
        [CandidateStatus.SCREENING]: [
          CandidateStatus.SCREEN_SELECTED,
          CandidateStatus.SCREEN_REJECTED,
        ],
        [CandidateStatus.SCREEN_SELECTED]: [
          CandidateStatus.TECH_SELECTED,
          CandidateStatus.TECH_REJECTED,
        ],
        [CandidateStatus.TECH]: [
          CandidateStatus.TECH_SELECTED,
          CandidateStatus.TECH_REJECTED,
        ],
        [CandidateStatus.TECH_SELECTED]: [
          CandidateStatus.OPS_SELECTED,
          CandidateStatus.OPS_REJECTED,
        ],
        [CandidateStatus.OPS]: [
          CandidateStatus.OPS_SELECTED,
          CandidateStatus.OPS_REJECTED,
        ],
      };

      if (!allowedTransitions[currentStatus]?.includes(nextStatus)) {
        throw new BadRequestException('Invalid hiring manager status transition');
      }

      if (!feedback?.trim()) {
        throw new BadRequestException('Feedback is mandatory for this decision');
      }

      return;
    }

    if (user.role === 'VENDOR_MANAGER') {
      if (
        ![
          CandidateStatus.IDENTIFIED,
          CandidateStatus.OPS_SELECTED,
          CandidateStatus.SELECTED,
          CandidateStatus.YET_TO_JOIN,
          CandidateStatus.ONBOARDED,
        ].includes(currentStatus)
      ) {
        throw new BadRequestException(
          'Only Identified, Yet to Join, or Onboarded candidates can be finalized',
        );
      }

      if (
        [CandidateStatus.IDENTIFIED, CandidateStatus.OPS_SELECTED, CandidateStatus.SELECTED].includes(
          currentStatus,
        )
      ) {
        if (nextStatus !== CandidateStatus.YET_TO_JOIN) {
          throw new BadRequestException(
            'Identified candidates can only be moved to Yet to Join',
          );
        }

        if (!dateOfJoining) {
          throw new BadRequestException('Date of joining is mandatory');
        }

        if (!ytjJustification?.trim()) {
          throw new BadRequestException('YTJ justification is mandatory');
        }

        return;
      }

      if (currentStatus === CandidateStatus.YET_TO_JOIN) {
        if (![CandidateStatus.ONBOARDED, CandidateStatus.DROPPED].includes(nextStatus)) {
          throw new BadRequestException(
            'YTJ candidates can only be moved to Onboarded or Drop',
          );
        }

        return;
      }

      if (
        currentStatus === CandidateStatus.ONBOARDED &&
        nextStatus === CandidateStatus.DROPPED &&
        !dropJustification?.trim()
      ) {
        throw new BadRequestException('Drop justification is mandatory');
      }

      return;
    }

    throw new BadRequestException('Unauthorized');
  }

  private async syncPositionAvailability(
    candidate: CandidateDocument,
    currentStatus: CandidateStatus,
    nextStatus: CandidateStatus,
  ) {
    const occupiedStatuses = new Set<CandidateStatus>([CandidateStatus.ONBOARDED]);

    const wasOccupied = occupiedStatuses.has(currentStatus);
    const willBeOccupied = occupiedStatuses.has(nextStatus);

    if (wasOccupied === willBeOccupied || !candidate.jobPostgresId) {
      return;
    }

    const delta = willBeOccupied ? -1 : 1;
    const job = await this.jobMongoModel.findOne({ postgresId: candidate.jobPostgresId }).exec();

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    if (candidate.positionPostgresId) {
      const positions = Array.isArray(job.positions) ? [...job.positions] : [];
      const positionIndex = positions.findIndex(
        (entry: any) => Number(entry?.id) === Number(candidate.positionPostgresId),
      );

      if (positionIndex < 0) {
        throw new NotFoundException('Position not found');
      }

      const position = positions[positionIndex] as any;
      position.currentOpenings = Math.max(
        0,
        Number(position.currentOpenings ?? position.openings ?? 0) + delta,
      );
      position.status =
        position.currentOpenings > 0
          ? JobPositionStatus.OPEN
          : JobPositionStatus.CLOSED;
      positions[positionIndex] = position;
      job.positions = positions as any;
      await job.save();
      return;
    }

    job.currentNumberOfPositions = Math.max(
      0,
      Number(job.currentNumberOfPositions ?? job.numberOfPositions ?? 0) + delta,
    );

    await job.save();
  }

  private async syncHmFeedbackSubmission(
    candidateId: number,
    user: any,
    nextStatus: CandidateStatus,
    feedback?: string,
  ) {
    if (user.role !== 'HIRING_MANAGER') {
      return;
    }

    if (
      ![
        CandidateStatus.SCREEN_SELECTED,
        CandidateStatus.SCREEN_REJECTED,
        CandidateStatus.TECH_SELECTED,
        CandidateStatus.TECH_REJECTED,
        CandidateStatus.OPS_SELECTED,
        CandidateStatus.OPS_REJECTED,
      ].includes(nextStatus)
    ) {
      return;
    }

    const candidate = await this.getCandidateDocById(candidateId);
    if (!candidate || !candidate.jobSnapshot) {
      return;
    }

    const orderedRounds = [...(((candidate.jobSnapshot as any)?.interviewRounds || []))].sort(
      (a: any, b: any) => Number(a.id) - Number(b.id),
    );

    const decisionRoundIndex: Partial<Record<CandidateStatus, number>> = {
      [CandidateStatus.SCREEN_SELECTED]: 0,
      [CandidateStatus.SCREEN_REJECTED]: 0,
      [CandidateStatus.TECH_SELECTED]: 1,
      [CandidateStatus.TECH_REJECTED]: 1,
      [CandidateStatus.OPS_SELECTED]: 2,
      [CandidateStatus.OPS_REJECTED]: 2,
    };

    const roundIndex = decisionRoundIndex[nextStatus];
    const round = typeof roundIndex === 'number' ? orderedRounds[roundIndex] : null;

    if (!round) {
      return;
    }

    const attendedSlot = await this.partnerSlotMongoModel
      .findOne({
        candidatePostgresId: candidateId,
        attendanceStatus: SlotAttendanceStatus.ATTENDED,
        hmFeedbackSubmitted: false,
      })
      .sort({ updatedAt: -1 })
      .exec();

    const existingInterview = (candidate.interviews || []).find(
      (interview: any) => Number(interview?.round?.id) === Number(round.id),
    );

    if (!existingInterview) {
      const decision = [
        CandidateStatus.SCREEN_SELECTED,
        CandidateStatus.TECH_SELECTED,
        CandidateStatus.OPS_SELECTED,
      ].includes(nextStatus)
        ? 'SELECT'
        : 'REJECT';

      const interview = {
        id: await this.getNextInterviewId(),
        round: this.serializeForMongo(round),
        panelMembers: (round.panels || [])
          .map((panel: any) => panel.name)
          .filter(Boolean)
          .join(', '),
        feedback: feedback?.trim() || attendedSlot?.hmComment || '',
        decision,
        feedbackDate: new Date(),
      };

      candidate.interviews = this.serializeForMongo([
        ...(candidate.interviews || []),
        interview,
      ]) as any;
      await candidate.save();
    }

    if (attendedSlot) {
      attendedSlot.hmFeedbackSubmitted = true;
      await attendedSlot.save();
    }
  }
}


