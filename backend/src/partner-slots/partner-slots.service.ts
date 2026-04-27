import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Candidate } from '../candidates/candidate.entity';
import { CandidateStatus } from '../candidates/candidate-status.enum';
import { InterviewRound } from '../jobs/interview-round.entity';
import { Job } from '../jobs/job.entity';
import { Vendor } from '../vendors/vendors.entity';
import {
  PartnerSlot,
  PartnerSlotStatus,
  SlotAttendanceStatus,
} from './partner-slot.entity';

@Injectable()
export class PartnerSlotsService {
  constructor(
    @InjectRepository(PartnerSlot)
    private readonly slotRepo: Repository<PartnerSlot>,

    @InjectRepository(Candidate)
    private readonly candidateRepo: Repository<Candidate>,

    @InjectRepository(Job)
    private readonly jobRepo: Repository<Job>,

    @InjectRepository(Vendor)
    private readonly vendorRepo: Repository<Vendor>,

    @InjectRepository(InterviewRound)
    private readonly roundRepo: Repository<InterviewRound>,
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

    return new Set(
      [normalizedEmail, localPart, humanizedLocal].filter(Boolean),
    );
  }

  private isHiringManagerMatch(jobHiringManager?: string | null, userEmail?: string | null) {
    const normalizedHm = this.normalizeValue(jobHiringManager);
    if (!normalizedHm) {
      return true;
    }

    const variants = this.getEmailDisplayVariants(userEmail);
    return variants.has(normalizedHm);
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

    const vendor = await this.vendorRepo
      .createQueryBuilder('vendor')
      .where('LOWER(vendor.email) = LOWER(:email)', { email: normalizedEmail })
      .getOne();

    return vendor?.id || '';
  }

  private getSlotRelations() {
    return ['job.interviewRounds'] as const;
  }

  async getSlotsForUser(user: any) {
    if (user.role === 'VENDOR') {
      const vendorId = await this.getVendorId(user);
      if (!vendorId) {
        return [];
      }

      return this.slotRepo.find({
        where: { vendor: { id: vendorId } },
        relations: [...this.getSlotRelations()],
        order: { updatedAt: 'DESC' },
      });
    }

    if (user.role === 'HIRING_MANAGER') {
      const allSlots = await this.slotRepo.find({
        relations: [...this.getSlotRelations()],
        order: { updatedAt: 'DESC' },
      });

      return allSlots.filter(
        (slot) =>
          this.isHiringManagerMatch(slot.job?.hiringManager, user.email),
      );
    }

    return this.slotRepo.find({
      relations: [...this.getSlotRelations()],
      order: { updatedAt: 'DESC' },
    });
  }

  async getEligibleCandidates(user: any) {
    if (user.role !== 'HIRING_MANAGER') {
      throw new BadRequestException('Only hiring managers can view this list');
    }

    const candidates = await this.candidateRepo.find({
      relations: ['vendor', 'job', 'job.interviewRounds', 'interviews', 'interviews.round'],
      order: { createdAt: 'DESC' },
    });

    const hmEmail = (user.email || '').trim().toLowerCase();
    const slots = await this.slotRepo.find({
      relations: [...this.getSlotRelations()],
      order: { createdAt: 'DESC' },
    });
    const activeCandidateIds = new Set(
      slots
        .filter((slot) =>
          [PartnerSlotStatus.PENDING_VENDOR, PartnerSlotStatus.SCHEDULED].includes(slot.status),
        )
        .map((slot) => slot.candidate?.id),
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

    const candidate = await this.candidateRepo.findOne({
      where: { id: Number(body.candidateId) },
      relations: ['vendor', 'job', 'job.interviewRounds', 'interviews', 'interviews.round'],
    });

    if (!candidate || !candidate.job || !candidate.vendor) {
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

    const existingActiveSlot = await this.slotRepo.findOne({
      where: {
        candidate: { id: candidate.id },
      },
      order: { createdAt: 'DESC' },
    });

    if (
      existingActiveSlot &&
      [PartnerSlotStatus.PENDING_VENDOR, PartnerSlotStatus.SCHEDULED].includes(
        existingActiveSlot.status,
      )
    ) {
      throw new BadRequestException('An active slot already exists for this candidate');
    }

    const nextRound = this.getNextRound(candidate);

    const slot = this.slotRepo.create({
      candidate,
      job: candidate.job,
      vendor: candidate.vendor,
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

    return this.slotRepo.save(slot);
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

    const slot = await this.slotRepo.findOne({
      where: { id: slotId },
      relations: [...this.getSlotRelations()],
    });

    if (!slot) {
      throw new NotFoundException('Slot not found');
    }

    if (String(slot.vendor?.id || '').trim() !== vendorId) {
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

    return this.slotRepo.save(slot);
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

    const slot = await this.slotRepo.findOne({
      where: { id: slotId },
      relations: [...this.getSlotRelations()],
    });

    if (!slot) {
      throw new NotFoundException('Slot not found');
    }

    if (String(slot.vendor?.id || '').trim() !== vendorId) {
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
      slot.candidate.status = CandidateStatus.DROPPED;
      slot.candidate.dropJustification = body.comment?.trim() || null;
      await this.candidateRepo.save(slot.candidate);
    }

    return this.slotRepo.save(slot);
  }

  async getLatestAttendedSlotAwaitingHmFeedback(candidateId: number) {
    return this.slotRepo.findOne({
      where: {
        candidate: { id: candidateId },
        status: PartnerSlotStatus.CLOSED,
        attendanceStatus: SlotAttendanceStatus.ATTENDED,
        hmFeedbackSubmitted: false,
      },
      relations: [...this.getSlotRelations()],
      order: { updatedAt: 'DESC' },
    });
  }

  async markHmFeedbackSubmitted(candidateId: number) {
    const slot = await this.getLatestAttendedSlotAwaitingHmFeedback(candidateId);
    if (!slot) {
      return;
    }

    slot.hmFeedbackSubmitted = true;
    await this.slotRepo.save(slot);
  }

  private getNextRound(candidate: Candidate) {
    const orderedRounds = [...(candidate.job?.interviewRounds || [])].sort(
      (a, b) => a.id - b.id,
    );
    const completedRoundIds = new Set(
      (candidate.interviews || []).map((interview) => interview.round?.id),
    );

    return orderedRounds.find((round) => !completedRoundIds.has(round.id)) || orderedRounds[0];
  }
}
