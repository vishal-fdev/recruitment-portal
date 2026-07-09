import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as XLSX from 'xlsx';
import {
  HpeBadgedCandidateDocument,
  HpeBadgedCandidateDocumentModel,
} from '../mongodb/schemas/hpe-badged-candidate.schema';
import {
  HpeBadgedJobDocument,
  HpeBadgedJobDocumentModel,
} from '../mongodb/schemas/hpe-badged-job.schema';
import {
  HpeBadgedRecruiterDocument,
  HpeBadgedRecruiterDocumentModel,
} from '../mongodb/schemas/hpe-badged-recruiter.schema';
import {
  HpeBadgedSubmissionDocument,
  HpeBadgedSubmissionDocumentModel,
} from '../mongodb/schemas/hpe-badged-submission.schema';
import { UserRole } from '../users/user.entity';
import { UsersService } from '../users/users.service';

type ExcelRow = Record<string, unknown>;
type RequestUser = { email: string; role: UserRole };

type CreateJobBody = {
  title?: string;
  jobTitle?: string;
  category?: string;
  jobCategory?: string;
  businessUnit?: string;
  hiringManager?: string;
  level?: string;
  location?: string;
  workLocation?: string;
  workType?: string;
  requestType?: string;
  backfillEmployeeId?: string;
  backfillEmployeeName?: string;
  positions?: number | string;
  numberOfPositions?: number | string;
  currentPositions?: number | string;
  startDate?: string;
  endDate?: string;
  region?: string;
  dealName?: string;
  justification?: string;
  description?: string;
  primarySkills?: string;
  secondarySkills?: string;
  experience?: string;
  panelDetails?: unknown;
  positionsDetail?: unknown[] | string;
};

type CreateRecruiterBody = {
  name?: string;
  email?: string;
};

type CreateSubmissionBody = {
  jobId?: string;
  candidateId?: string;
  candidateName?: string;
  email?: string;
  contactNumber?: string;
  currentCompany?: string;
  noticePeriod?: string;
  primarySkills?: string;
  secondarySkills?: string;
  experience?: string;
  location?: string;
};

const STATUS_MAP: Record<string, string> = {
  submitted: 'SUBMITTED',
  techselect: 'TECH_SELECTED',
  techselected: 'TECH_SELECTED',
  techreject: 'TECH_REJECTED',
  techrejected: 'TECH_REJECTED',
  screenselect: 'SCREEN_SELECTED',
  screenselected: 'SCREEN_SELECTED',
  screenreject: 'SCREEN_REJECTED',
  screenrejected: 'SCREEN_REJECTED',
  opsselect: 'OPS_SELECTED',
  opsselected: 'OPS_SELECTED',
  opsreject: 'OPS_REJECTED',
  opsrejected: 'OPS_REJECTED',
};

@Injectable()
export class HpeBadgedHiringService {
  constructor(
    @InjectModel(HpeBadgedCandidateDocumentModel.name)
    private readonly hpeBadgedModel: Model<HpeBadgedCandidateDocument>,

    @InjectModel(HpeBadgedJobDocumentModel.name)
    private readonly jobModel: Model<HpeBadgedJobDocument>,

    @InjectModel(HpeBadgedRecruiterDocumentModel.name)
    private readonly recruiterModel: Model<HpeBadgedRecruiterDocument>,

    @InjectModel(HpeBadgedSubmissionDocumentModel.name)
    private readonly submissionModel: Model<HpeBadgedSubmissionDocument>,

    private readonly usersService: UsersService,
  ) {}

  async dashboard(user: RequestUser) {
    const jobFilter = this.jobFilterFor(user);
    const submissionFilter = this.submissionFilterFor(user);
    const [jobsCreated, assignedJobs, candidatesSubmitted, recruiters, selected, rejected] =
      await Promise.all([
        this.jobModel.countDocuments({}).exec(),
        this.jobModel.countDocuments(jobFilter).exec(),
        this.submissionModel.countDocuments(submissionFilter).exec(),
        this.recruiterModel.countDocuments({ isActive: true }).exec(),
        this.submissionModel
          .countDocuments({ ...submissionFilter, status: /SELECTED$/ })
          .exec(),
        this.submissionModel
          .countDocuments({ ...submissionFilter, status: /REJECTED$/ })
          .exec(),
      ]);

    return {
      jobsCreated,
      assignedJobs,
      candidatesSubmitted,
      recruiters,
      selected,
      rejected,
    };
  }

  async findAll() {
    return this.hpeBadgedModel
      .find()
      .sort({ uploadedDate: -1, updatedAt: -1 })
      .lean()
      .exec();
  }

  async importExcel(file?: Express.Multer.File) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Excel file is required');
    }

    const rows = this.readExcelRows(file);
    if (!rows.length) {
      throw new BadRequestException('Excel file has no candidate rows');
    }

    let inserted = 0;
    let updated = 0;
    const uploadedDate = new Date();

    for (const row of rows) {
      const normalized = this.normalizeRow(row, uploadedDate);
      const existing = await this.hpeBadgedModel.findOne(
        this.matchCandidate(normalized),
      );

      if (existing) {
        existing.set(normalized);
        await existing.save();
        updated += 1;
      } else {
        await this.hpeBadgedModel.create({
          ...normalized,
          status: normalized.status || 'SUBMITTED',
        });
        inserted += 1;
      }
    }

    const records = await this.findAll();
    return {
      inserted,
      updated,
      total: records.length,
      records,
    };
  }

  async attachResume(id: string, file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Resume file is required');
    }

    const record = await this.hpeBadgedModel.findById(id);
    if (!record) {
      throw new NotFoundException('HPE badged candidate not found');
    }

    record.resumePath = `/uploads/hpe-badged-resumes/${file.filename}`;
    record.resumeFileName = file.originalname;
    await record.save();

    return record.toObject();
  }

  async listRecruiters() {
    return this.recruiterModel
      .find({ isActive: true })
      .sort({ createdAt: -1 })
      .lean()
      .exec();
  }

  async createRecruiter(body: CreateRecruiterBody, user: RequestUser) {
    const name = this.clean(body.name);
    const email = this.normalizeEmail(body.email);

    if (!name || !email) {
      throw new BadRequestException('Recruiter name and email are required');
    }

    const recruiter = await this.recruiterModel.findOneAndUpdate(
      { email: new RegExp(`^${this.escapeRegex(email)}$`, 'i') },
      {
        $set: {
          name,
          email,
          isActive: true,
          createdByEmail: user.email,
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );

    await this.usersService.ensureActiveUser(email, UserRole.BADGED_RECRUITER);
    return recruiter.toObject();
  }

  async listJobs(user: RequestUser) {
    return this.jobModel
      .find(this.jobFilterFor(user))
      .sort({ createdAt: -1 })
      .lean()
      .exec();
  }

  async createJob(
    body: CreateJobBody,
    user: RequestUser,
    files?: { jd?: Express.Multer.File[]; psq?: Express.Multer.File[] },
  ) {
    const title = this.clean(body.title || body.jobTitle);
    if (!title) {
      throw new BadRequestException('Job title is required');
    }

    const category = this.clean(body.category || body.jobCategory);
    const location = this.clean(body.location || body.workLocation);
    const jobId = await this.nextJobId();
    const positions = this.toPositiveNumber(body.positions ?? body.numberOfPositions, 1);
    const jdFile = files?.jd?.[0];
    const psqFile = files?.psq?.[0];
    const positionsDetail = this.parsePositionsDetail(body.positionsDetail);
    const panelDetails = this.parsePanelDetails(body.panelDetails);
    const job = await this.jobModel.create({
      jobId,
      title,
      category,
      businessUnit: this.clean(body.businessUnit),
      hiringManager: this.normalizeEmail(body.hiringManager),
      level: this.clean(body.level),
      location,
      workType: this.clean(body.workType) || 'Onsite',
      requestType: this.clean(body.requestType) || 'NEW',
      backfillEmployeeId: this.clean(body.backfillEmployeeId),
      backfillEmployeeName: this.clean(body.backfillEmployeeName),
      positions,
      currentPositions: this.toPositiveNumber(body.currentPositions ?? body.numberOfPositions, positions),
      startDate: this.toDate(body.startDate),
      endDate: this.toDate(body.endDate),
      region: this.clean(body.region),
      dealName: this.clean(body.dealName),
      justification: this.clean(body.justification),
      description: this.clean(body.description),
      primarySkills: this.clean(body.primarySkills),
      secondarySkills: this.clean(body.secondarySkills),
      experience: this.clean(body.experience),
      panelDetails,
      jdPath: jdFile ? `/uploads/hpe-badged-job-files/${jdFile.filename}` : '',
      jdFileName: jdFile?.originalname || '',
      jdMimeType: jdFile?.mimetype || '',
      psqPath: psqFile ? `/uploads/hpe-badged-job-files/${psqFile.filename}` : '',
      psqFileName: psqFile?.originalname || '',
      psqMimeType: psqFile?.mimetype || '',
      positionsDetail,
      status: 'OPEN',
      createdByEmail: user.email,
      assignedRecruiters: [],
    });

    return job.toObject();
  }

  async assignRecruiters(jobId: string, recruiterIds: string[]) {
    if (!Array.isArray(recruiterIds)) {
      throw new BadRequestException('Recruiter IDs are required');
    }

    const recruiters = await this.recruiterModel
      .find({ _id: { $in: recruiterIds }, isActive: true })
      .lean()
      .exec();

    const job = await this.jobModel.findById(jobId).exec();
    if (!job) {
      throw new NotFoundException('Badged hiring job not found');
    }

    job.assignedRecruiters = recruiters.map((recruiter: any) => ({
      id: recruiter._id.toString(),
      name: recruiter.name,
      email: recruiter.email,
    }));
    await job.save();

    return job.toObject();
  }

  async listSubmissions(user: RequestUser) {
    return this.submissionModel
      .find(this.submissionFilterFor(user))
      .sort({ submittedAt: -1, createdAt: -1 })
      .lean()
      .exec();
  }

  async createSubmission(
    body: CreateSubmissionBody,
    file: Express.Multer.File | undefined,
    user: RequestUser,
  ) {
    const jobId = this.clean(body.jobId);
    const candidateName = this.clean(body.candidateName);
    const email = this.normalizeEmail(body.email);
    const contactNumber = this.clean(body.contactNumber);

    if (!jobId || !candidateName || !email || !contactNumber) {
      throw new BadRequestException(
        'Job, candidate name, email, and contact number are required',
      );
    }

    await this.ensureAssignedJob(jobId, user);
    const candidateId = this.clean(body.candidateId) || (await this.nextCandidateId());

    const submission = await this.submissionModel.findOneAndUpdate(
      { jobId, candidateId },
      {
        $set: {
          jobId,
          candidateId,
          candidateName,
          email,
          contactNumber,
          currentCompany: this.clean(body.currentCompany),
          noticePeriod: this.clean(body.noticePeriod),
          primarySkills: this.clean(body.primarySkills),
          secondarySkills: this.clean(body.secondarySkills),
          experience: this.clean(body.experience),
          location: this.clean(body.location),
          recruiterEmail: this.normalizeEmail(user.email),
          status: 'SUBMITTED',
          submittedAt: new Date(),
          resumePath: file ? `/uploads/hpe-badged-submissions/${file.filename}` : null,
          resumeFileName: file?.originalname || null,
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );

    return submission.toObject();
  }

  async importSubmissionExcel(file: Express.Multer.File | undefined, user: RequestUser) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Excel file is required');
    }

    const rows = this.readExcelRows(file);
    if (!rows.length) {
      throw new BadRequestException('Excel file has no candidate rows');
    }

    let inserted = 0;
    let updated = 0;

    for (const row of rows) {
      const normalized = await this.normalizeSubmissionRow(row);
      await this.ensureAssignedJob(normalized.jobId, user);

      const existing = await this.submissionModel.findOne({
        jobId: normalized.jobId,
        $or: [
          { candidateId: normalized.candidateId },
          { email: normalized.email },
        ],
      });

      if (existing) {
        existing.set({
          ...normalized,
          candidateId: existing.candidateId || normalized.candidateId,
          recruiterEmail: this.normalizeEmail(user.email),
          submittedAt: existing.submittedAt || new Date(),
        });
        await existing.save();
        updated += 1;
      } else {
        await this.submissionModel.create({
          ...normalized,
          recruiterEmail: this.normalizeEmail(user.email),
          submittedAt: new Date(),
          resumePath: null,
          resumeFileName: null,
        });
        inserted += 1;
      }
    }

    return {
      inserted,
      updated,
      total: inserted + updated,
      records: await this.listSubmissions(user),
    };
  }

  private readExcelRows(file: Express.Multer.File) {
    const workbook = XLSX.read(file.buffer, { type: 'buffer', cellDates: true });
    const firstSheetName = workbook.SheetNames[0];

    if (!firstSheetName) {
      throw new BadRequestException('Excel file has no sheets');
    }

    const sheet = workbook.Sheets[firstSheetName];
    return XLSX.utils.sheet_to_json<ExcelRow>(sheet, {
      defval: '',
      raw: false,
    });
  }

  private async ensureAssignedJob(jobId: string, user: RequestUser) {
    const job = await this.jobModel.findOne({ jobId }).lean().exec();
    if (!job) {
      throw new NotFoundException('Badged hiring job not found');
    }

    if (user.role !== UserRole.BADGED_RECRUITER) {
      return job;
    }

    const assigned = (job.assignedRecruiters || []).some(
      (recruiter: any) =>
        this.normalizeEmail(recruiter.email) === this.normalizeEmail(user.email),
    );

    if (!assigned) {
      throw new ForbiddenException('This job is not assigned to this recruiter');
    }

    return job;
  }

  private normalizeRow(row: ExcelRow, uploadedDate: Date) {
    const jobId = this.pick(row, ['jobid', 'hrqid', 'job']);
    const candidateId = this.pick(row, [
      'candidateid',
      'candidatecode',
      'candidate',
    ]);
    const candidateName = this.pick(row, [
      'candidatename',
      'name',
      'fullname',
    ]);
    const email = this.pick(row, ['email', 'emailaddress', 'candidateemail']);
    const contactNumber = this.pick(row, [
      'contactnumber',
      'candidatecontact',
      'phone',
      'phonenumber',
      'mobile',
    ]);

    if (!jobId || !candidateId || !candidateName || !email || !contactNumber) {
      throw new BadRequestException(
        'Excel must include Job ID, Candidate ID, Candidate Name, Email, and Contact Number',
      );
    }

    return {
      jobId,
      candidateId,
      candidateName,
      email,
      contactNumber,
      currentCompany: this.pick(row, [
        'currentcompany',
        'currentorganisation',
        'currentorganization',
        'company',
      ]),
      noticePeriod: this.pick(row, ['noticeperiod', 'notice']),
      uploadedDate,
      status: this.normalizeStatus(this.pick(row, ['status', 'candidaturestatus'])),
    };
  }

  private async normalizeSubmissionRow(row: ExcelRow) {
    const jobId = this.pick(row, ['jobid', 'hrqid', 'job']);
    const candidateName = this.pick(row, ['candidatename', 'name', 'fullname']);
    const email = this.normalizeEmail(
      this.pick(row, ['email', 'emailaddress', 'candidateemail']),
    );
    const contactNumber = this.pick(row, [
      'contactnumber',
      'candidatecontact',
      'phone',
      'phonenumber',
      'mobile',
    ]);

    if (!jobId || !candidateName || !email || !contactNumber) {
      throw new BadRequestException(
        'Excel must include Job ID, Candidate Name, Email, and Contact Number',
      );
    }

    return {
      jobId,
      candidateId:
        this.pick(row, ['candidateid', 'candidatecode', 'candidate']) ||
        (await this.nextCandidateId()),
      candidateName,
      email,
      contactNumber,
      currentCompany: this.pick(row, [
        'currentcompany',
        'currentorganisation',
        'currentorganization',
        'company',
      ]),
      noticePeriod: this.pick(row, ['noticeperiod', 'notice']),
      primarySkills: this.pick(row, ['primaryskills', 'primaryskill', 'skills']),
      secondarySkills: this.pick(row, ['secondaryskills', 'secondaryskill']),
      experience: this.pick(row, ['experience', 'totalexperience', 'years']),
      location: this.pick(row, ['location', 'city', 'worklocation']),
      status: this.normalizeStatus(this.pick(row, ['status', 'candidaturestatus'])),
    };
  }

  private matchCandidate(candidate: {
    jobId: string;
    candidateId: string;
    email: string;
  }) {
    return {
      jobId: candidate.jobId,
      $or: [{ candidateId: candidate.candidateId }, { email: candidate.email }],
    };
  }

  private jobFilterFor(user: RequestUser) {
    if (user.role === UserRole.BADGED_RECRUITER) {
      return { 'assignedRecruiters.email': this.normalizeEmail(user.email) };
    }
    return {};
  }

  private submissionFilterFor(user: RequestUser) {
    if (user.role === UserRole.BADGED_RECRUITER) {
      return { recruiterEmail: this.normalizeEmail(user.email) };
    }
    return {};
  }

  private async nextJobId() {
    const latest = await this.jobModel
      .findOne({ jobId: /^BHJ-/ })
      .sort({ createdAt: -1 })
      .select({ jobId: 1 })
      .lean()
      .exec();

    const current = Number(String(latest?.jobId || '').replace('BHJ-', '')) || 0;
    return `BHJ-${String(current + 1).padStart(3, '0')}`;
  }

  private async nextCandidateId() {
    const count = await this.submissionModel.countDocuments().exec();
    return `BHC-${String(count + 1).padStart(3, '0')}`;
  }

  private pick(row: ExcelRow, keys: string[]) {
    const entries = Object.entries(row);
    for (const [header, value] of entries) {
      const normalizedHeader = this.normalizeKey(header);
      if (keys.includes(normalizedHeader)) {
        return String(value ?? '').trim();
      }
    }
    return '';
  }

  private normalizeKey(value: string) {
    return value.toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  private normalizeStatus(value: string) {
    const key = this.normalizeKey(value);
    return STATUS_MAP[key] || 'SUBMITTED';
  }

  private clean(value?: string | number | null) {
    return String(value ?? '').trim();
  }

  private normalizeEmail(email?: string | null) {
    return (email || '').trim().toLowerCase();
  }

  private escapeRegex(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private toPositiveNumber(value: string | number | undefined, fallback: number) {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  }

  private parsePanelDetails(value?: unknown): Record<string, unknown> {
    if (!value) return {};
    if (typeof value === 'object' && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }
    if (typeof value === 'string' && value.trim()) {
      try {
        const parsed = JSON.parse(value);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          return parsed as Record<string, unknown>;
        }
      } catch {
        return {};
      }
    }
    return {};
  }
  private parsePositionsDetail(value?: unknown[] | string) {
    if (Array.isArray(value)) {
      return value;
    }

    if (typeof value === 'string' && value.trim()) {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }

    return [];
  }
  private toDate(value?: string) {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
}





