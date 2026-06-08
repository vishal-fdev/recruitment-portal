import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { CandidateStatus } from '../candidates/candidate-status.enum';
import {
  CandidateDocument,
  CandidateDocumentModel,
} from '../mongodb/schemas/candidate.schema';
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
  PartnerSlot,
  PartnerSlotStatus,
  SlotAttendanceStatus,
} from './partner-slot.entity';

@Injectable()
export class PartnerSlotsService {
  constructor(
    @InjectModel(PartnerSlotDocumentModel.name)
    private readonly partnerSlotMongoModel: Model<PartnerSlotDocument>,
    @InjectModel(CandidateDocumentModel.name)
    private readonly candidateMongoModel: Model<CandidateDocument>,
    @InjectModel(JobDocumentModel.name)
    private readonly jobMongoModel: Model<JobDocument>,
    @InjectModel(VendorDocumentModel.name)
    private readonly vendorMongoModel: Model<VendorDocument>,
  ) {}

  private normalizeValue(value?: string | null) {
    return (value || '').trim().toLowerCase();
  }

  private getEmailDisplayVariants(email?: string | null) {
    const normalizedEmail = this.normalizeValue(email);
    const localPart = normalizedEmail.split('@')[0] || '';
    const humanizedLocal = localPart
      .split(/[._-]/)
      .filter(Boolean)
      .join(' ')
      .trim();

    return new Set([normalizedEmail, localPart, humanizedLocal].filter(Boolean));
  }

  private isHiringManagerMatch(jobHiringManager?: string | null, userEmail?: string | null) {
    const normalizedHm = this.normalizeValue(jobHiringManager);
    if (!normalizedHm) {
      return true;
    }

    const variants = this.getEmailDisplayVariants(userEmail);
    return variants.has(normalizedHm);
  }

  private serializeForMongo<T>(value: T): T {
    return JSON.parse(JSON.stringify(value));
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
      positions: Array.isArray(doc.positions) ? doc.positions : [],
      interviewRounds: Array.isArray(doc.interviewRounds) ? doc.interviewRounds : [],
      jobVendors: Array.isArray(doc.jobVendors) ? doc.jobVendors : [],
      candidates: Array.isArray(doc.candidates) ? doc.candidates : [],
      createdAt: doc.createdAt ? new Date(doc.createdAt) : new Date(),
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
      experience: Number(doc.experience ?? 0),
      noticePeriod: Number(doc.noticePeriod ?? 0),
      currentOrg: doc.currentOrg,
      resumePath: doc.resumePath,
      status: doc.status,
      dropJustification: doc.dropJustification ?? null,
      ytjJustification: doc.ytjJustification ?? null,
      dateOfJoining: doc.dateOfJoining ?? null,
      createdAt: doc.createdAt ? new Date(doc.createdAt) : new Date(),
      vendor: doc.vendorSnapshot || null,
      job: doc.jobSnapshot || null,
      position: doc.positionSnapshot || null,
      interviews: Array.isArray(doc.interviews) ? doc.interviews : [],
    };
  }

  private mapMongoSlots(slots: any[]) {
    return slots.map((slot) => ({
      id: Number(slot.postgresId),
      roundName: slot.roundName,
      interviewDate: slot.interviewDate,
      interviewTime: slot.interviewTime,
      hmComment: slot.hmComment,
      status: slot.status,
      vendorJustification: slot.vendorJustification,
      attendanceStatus: slot.attendanceStatus,
      attendanceComment: slot.attendanceComment,
      hmFeedbackSubmitted: slot.hmFeedbackSubmitted,
      createdAt: slot.createdAt ? new Date(slot.createdAt) : undefined,
      updatedAt: slot.updatedAt ? new Date(slot.updatedAt) : undefined,
      candidate: slot.candidateSnapshot || null,
      job: slot.jobSnapshot || null,
      vendor: slot.vendorSnapshot || null,
    })) as unknown as PartnerSlot[];
  }

  private async getVendorId(user: any) {
    const directVendorId = String(user?.vendorId || user?.vendor?.id || '').trim();
    if (directVendorId) {
      return directVendorId;
    }

    const normalizedEmail = this.normalizeValue(user?.email);
    if (!normalizedEmail) {
      return '';
    }

    const vendor = await this.vendorMongoModel
      .findOne({ email: { $regex: `^${normalizedEmail}$`, $options: 'i' } })
      .lean()
      .exec();

    return vendor?.postgresId || '';
  }

  private async getNextSlotId() {
    const docs = await this.partnerSlotMongoModel
      .find({}, { postgresId: 1 })
      .sort({ postgresId: -1 })
      .limit(1)
      .lean()
      .exec();
    return Number(docs[0]?.postgresId || 0) + 1;
  }

  private getNextRound(candidate: any) {
    const orderedRounds = [...(candidate.job?.interviewRounds || [])].sort(
      (a: any, b: any) => Number(a.id) - Number(b.id),
    );
    const completedRoundIds = new Set(
      (candidate.interviews || []).map((interview: any) => Number(interview.round?.id)),
    );

    return (
      orderedRounds.find((round: any) => !completedRoundIds.has(Number(round.id))) ||
      orderedRounds[0]
    );
  }

  async getSlotsForUser(user: any) {
    if (user.role === 'VENDOR') {
      const vendorId = await this.getVendorId(user);
      if (!vendorId) {
        return [];
      }

      const slots = await this.partnerSlotMongoModel
        .find({ vendorPostgresId: vendorId })
        .sort({ updatedAt: -1 })
        .lean()
        .exec();
      return this.mapMongoSlots(slots);
    }

    const slots = this.mapMongoSlots(
      await this.partnerSlotMongoModel.find().sort({ updatedAt: -1 }).lean().exec(),
    );

    if (user.role === 'HIRING_MANAGER') {
      return slots.filter((slot) =>
        this.isHiringManagerMatch((slot.job as any)?.hiringManager, user.email),
      );
    }

    return slots;
  }

  async getEligibleCandidates(user: any) {
    if (user.role !== 'HIRING_MANAGER') {
      throw new BadRequestException('Only hiring managers can view this list');
    }

    const candidates = (await this.candidateMongoModel.find().sort({ createdAt: -1 }).lean().exec())
      .map((doc) => this.mapMongoCandidate(doc))
      .filter(Boolean) as any[];

    const hmEmail = (user.email || '').trim().toLowerCase();
    const slots = await this.partnerSlotMongoModel.find().sort({ createdAt: -1 }).lean().exec();
    const activeCandidateIds = new Set(
      slots
        .filter((slot) =>
          [PartnerSlotStatus.PENDING_VENDOR, PartnerSlotStatus.SCHEDULED].includes(
            slot.status as PartnerSlotStatus,
          ),
        )
        .map((slot) => Number(slot.candidatePostgresId)),
    );

    return candidates
      .filter(
        (candidate) =>
          candidate.job &&
          candidate.vendor &&
          this.isHiringManagerMatch(candidate.job.hiringManager, hmEmail) &&
          ![
            CandidateStatus.REJECTED,
            CandidateStatus.DROPPED,
            CandidateStatus.ONBOARDED,
          ].includes(candidate.status),
      )
      .map((candidate) => {
        const nextRound = this.getNextRound(candidate);
        return {
          id: candidate.id,
          candidateName: candidate.name,
          candidateEmail: candidate.email,
          contactNumber: candidate.phone,
          relevantExperience: candidate.experience,
          vendorName: candidate.vendor?.name || '-',
          role: candidate.job?.title || '-',
          jobId: candidate.job?.id,
          hrqId: candidate.job?.id ? `HRQ${candidate.job.id}` : '-',
          status: candidate.status,
          nextRoundName: nextRound?.roundName || 'Screening',
          existingOpenSlot: activeCandidateIds.has(candidate.id),
        };
      });
  }

  async createSlot(
    user: any,
    body: {
      candidateId: number;
      interviewDate: string;
      interviewTime: string;
      hmComment?: string;
    },
  ) {
    if (user.role !== 'HIRING_MANAGER') {
      throw new BadRequestException('Only hiring managers can create slots');
    }

    const candidateDoc = await this.candidateMongoModel
      .findOne({ postgresId: Number(body.candidateId) })
      .exec();
    const candidate = this.mapMongoCandidate(candidateDoc?.toObject());

    if (!candidateDoc || !candidate || !candidate.job || !candidate.vendor) {
      throw new NotFoundException('Candidate not found');
    }

    if (!this.isHiringManagerMatch(candidate.job.hiringManager, user.email)) {
      throw new BadRequestException('Candidate is not assigned to this hiring manager');
    }

    const scheduleableStatuses = new Set<CandidateStatus>([
      CandidateStatus.SCREEN_SELECTED,
      CandidateStatus.TECH_SELECTED,
    ]);

    if (!scheduleableStatuses.has(candidate.status)) {
      throw new BadRequestException(
        'Interview scheduling is only allowed while the candidate is in Screen Select or Tech Select',
      );
    }

    const existingActiveSlot = await this.partnerSlotMongoModel
      .findOne({ candidatePostgresId: candidate.id })
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    if (
      existingActiveSlot &&
      [PartnerSlotStatus.PENDING_VENDOR, PartnerSlotStatus.SCHEDULED].includes(
        existingActiveSlot.status as PartnerSlotStatus,
      )
    ) {
      throw new BadRequestException('An active slot already exists for this candidate');
    }

    const nextRound = this.getNextRound(candidate);
    const slotId = await this.getNextSlotId();

    await this.partnerSlotMongoModel.create({
      postgresId: slotId,
      candidatePostgresId: candidate.id,
      jobPostgresId: candidate.job.id,
      vendorPostgresId: candidate.vendor.id,
      candidateSnapshot: this.serializeForMongo(candidate),
      jobSnapshot: this.serializeForMongo(candidate.job),
      vendorSnapshot: this.serializeForMongo(candidate.vendor),
      roundName: nextRound?.roundName || 'SCREENING',
      interviewDate: body.interviewDate,
      interviewTime: body.interviewTime,
      hmComment: body.hmComment?.trim() || null,
      status: PartnerSlotStatus.PENDING_VENDOR,
      attendanceStatus: SlotAttendanceStatus.PENDING,
      attendanceComment: null,
      vendorJustification: null,
      hmFeedbackSubmitted: false,
    });

    const saved = await this.partnerSlotMongoModel.findOne({ postgresId: slotId }).lean().exec();
    return this.mapMongoSlots(saved ? [saved] : [])[0];
  }

  async respondToSlot(
    slotId: number,
    user: any,
    body: {
      action: 'ACCEPT' | 'REJECT';
      justification?: string;
    },
  ) {
    if (user.role !== 'VENDOR') {
      throw new BadRequestException('Only vendors can respond to slots');
    }

    const vendorId = await this.getVendorId(user);
    if (!vendorId) {
      throw new BadRequestException('Vendor account is not linked correctly');
    }

    const slot = await this.partnerSlotMongoModel.findOne({ postgresId: slotId }).exec();

    if (!slot) {
      throw new NotFoundException('Slot not found');
    }

    if (String(slot.vendorPostgresId || '').trim() !== vendorId) {
      throw new BadRequestException('Unauthorized slot access');
    }

    if (slot.status !== PartnerSlotStatus.PENDING_VENDOR) {
      throw new BadRequestException('This slot is no longer awaiting vendor response');
    }

    if (body.action === 'REJECT') {
      if (!body.justification?.trim()) {
        throw new BadRequestException('Justification is required when rejecting a slot');
      }

      slot.status = PartnerSlotStatus.REJECTED;
      slot.vendorJustification = body.justification.trim();
      slot.attendanceStatus = SlotAttendanceStatus.PENDING;
    } else {
      slot.status = PartnerSlotStatus.SCHEDULED;
      slot.vendorJustification = null;
    }

    await slot.save();
    return this.mapMongoSlots([slot.toObject()])[0];
  }

  async submitAttendance(
    slotId: number,
    user: any,
    body: {
      attendanceStatus:
        | SlotAttendanceStatus.ATTENDED
        | SlotAttendanceStatus.NO_SHOW
        | SlotAttendanceStatus.RESCHEDULE_REQUESTED_BY_CANDIDATE
        | SlotAttendanceStatus.RESCHEDULE_REQUESTED_BY_PANEL
        | SlotAttendanceStatus.DROPPED;
      comment?: string;
    },
  ) {
    if (user.role !== 'VENDOR') {
      throw new BadRequestException('Only vendors can confirm interview attendance');
    }

    const vendorId = await this.getVendorId(user);
    if (!vendorId) {
      throw new BadRequestException('Vendor account is not linked correctly');
    }

    const slot = await this.partnerSlotMongoModel.findOne({ postgresId: slotId }).exec();

    if (!slot) {
      throw new NotFoundException('Slot not found');
    }

    if (String(slot.vendorPostgresId || '').trim() !== vendorId) {
      throw new BadRequestException('Unauthorized slot access');
    }

    if (slot.status !== PartnerSlotStatus.SCHEDULED) {
      throw new BadRequestException('Attendance can only be updated for scheduled interviews');
    }

    if (
      [
        SlotAttendanceStatus.NO_SHOW,
        SlotAttendanceStatus.RESCHEDULE_REQUESTED_BY_CANDIDATE,
        SlotAttendanceStatus.RESCHEDULE_REQUESTED_BY_PANEL,
        SlotAttendanceStatus.DROPPED,
      ].includes(body.attendanceStatus) &&
      !body.comment?.trim()
    ) {
      throw new BadRequestException('Comments are required for this interview outcome');
    }

    slot.attendanceStatus = body.attendanceStatus;
    slot.attendanceComment = body.comment?.trim() || null;
    slot.status = PartnerSlotStatus.CLOSED;
    slot.hmFeedbackSubmitted = false;

    if (body.attendanceStatus === SlotAttendanceStatus.DROPPED) {
      const candidate = await this.candidateMongoModel
        .findOne({ postgresId: slot.candidatePostgresId })
        .exec();
      if (candidate) {
        candidate.status = CandidateStatus.DROPPED;
        candidate.dropJustification = body.comment?.trim() || null;
        await candidate.save();
        slot.candidateSnapshot = this.serializeForMongo(this.mapMongoCandidate(candidate.toObject()));
      }
    }

    await slot.save();
    return this.mapMongoSlots([slot.toObject()])[0];
  }

  async getLatestAttendedSlotAwaitingHmFeedback(candidateId: number) {
    const slot = await this.partnerSlotMongoModel
      .findOne({
        candidatePostgresId: candidateId,
        status: PartnerSlotStatus.CLOSED,
        attendanceStatus: SlotAttendanceStatus.ATTENDED,
        hmFeedbackSubmitted: false,
      })
      .sort({ updatedAt: -1 })
      .lean()
      .exec();

    return slot ? this.mapMongoSlots([slot])[0] : null;
  }

  async markHmFeedbackSubmitted(candidateId: number) {
    const slot = await this.partnerSlotMongoModel
      .findOne({
        candidatePostgresId: candidateId,
        status: PartnerSlotStatus.CLOSED,
        attendanceStatus: SlotAttendanceStatus.ATTENDED,
        hmFeedbackSubmitted: false,
      })
      .sort({ updatedAt: -1 })
      .exec();

    if (!slot) {
      return;
    }

    slot.hmFeedbackSubmitted = true;
    await slot.save();
  }
}
