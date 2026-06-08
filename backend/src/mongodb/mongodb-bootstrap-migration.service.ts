import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { Model } from 'mongoose';

import { Candidate } from '../candidates/candidate.entity';
import { Job } from '../jobs/job.entity';
import { JobPosition } from '../jobs/job-position.entity';
import { InterviewRound } from '../jobs/interview-round.entity';
import { InterviewPanel } from '../jobs/interview-panel.entity';
import { JobVendor } from '../jobs/job-vendor.entity';
import { PartnerSlot } from '../partner-slots/partner-slot.entity';
import { User } from '../users/user.entity';
import { Vendor } from '../vendors/vendors.entity';
import { VendorProfile } from '../vendors/vendor-profile.entity';
import { VendorEscalation } from '../vendors/vendor-escalation.entity';
import { VendorEngagement } from '../vendors/vendor-engagement.entity';
import { VendorSOW } from '../vendors/vendor-sow.entity';
import { CandidateInterview } from '../candidates/candidate-interview.entity';
import {
  CandidateDocument,
  CandidateDocumentModel,
} from './schemas/candidate.schema';
import { JobDocument, JobDocumentModel } from './schemas/job.schema';
import {
  PartnerSlotDocument,
  PartnerSlotDocumentModel,
} from './schemas/partner-slot.schema';
import { UserDocument, UserDocumentModel } from './schemas/user.schema';
import {
  VendorDocument,
  VendorDocumentModel,
} from './schemas/vendor.schema';

@Injectable()
export class MongoBootstrapMigrationService implements OnApplicationBootstrap {
  private readonly logger = new Logger(MongoBootstrapMigrationService.name);
  private migrationRan = false;

  constructor(
    private readonly configService: ConfigService,
    @InjectModel(UserDocumentModel.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(VendorDocumentModel.name)
    private readonly vendorModel: Model<VendorDocument>,
    @InjectModel(JobDocumentModel.name)
    private readonly jobModel: Model<JobDocument>,
    @InjectModel(CandidateDocumentModel.name)
    private readonly candidateModel: Model<CandidateDocument>,
    @InjectModel(PartnerSlotDocumentModel.name)
    private readonly partnerSlotModel: Model<PartnerSlotDocument>,
  ) {}

  async onApplicationBootstrap() {
    if (this.migrationRan) return;
    this.migrationRan = true;

    const [userCount, vendorCount, jobCount, candidateCount, slotCount] =
      await Promise.all([
        this.userModel.countDocuments().exec(),
        this.vendorModel.countDocuments().exec(),
        this.jobModel.countDocuments().exec(),
        this.candidateModel.countDocuments().exec(),
        this.partnerSlotModel.countDocuments().exec(),
      ]);

    if (userCount || vendorCount || jobCount || candidateCount || slotCount) {
      return;
    }

    const databaseUrl = this.configService.get<string>('DATABASE_URL');
    if (!databaseUrl) {
      this.logger.warn(
        'Mongo collections are empty and DATABASE_URL is not set, so no bootstrap import can be performed.',
      );
      return;
    }

    this.logger.log(
      'Mongo collections are empty. Importing existing PostgreSQL data into Mongo for local startup...',
    );

    const postgres = new DataSource({
      type: 'postgres',
      url: databaseUrl,
      ssl: { rejectUnauthorized: false },
      entities: [
        User,
        Vendor,
        VendorProfile,
        VendorEscalation,
        VendorEngagement,
        VendorSOW,
        Job,
        JobPosition,
        InterviewRound,
        InterviewPanel,
        JobVendor,
        Candidate,
        CandidateInterview,
        PartnerSlot,
      ],
    });

    const serialize = <T>(value: T): T => JSON.parse(JSON.stringify(value));

    try {
      await postgres.initialize();

      const vendors = await postgres.getRepository(Vendor).find({
        relations: ['profile', 'escalations', 'engagements', 'sows'],
      });
      for (const vendor of vendors) {
        await this.vendorModel.updateOne(
          { postgresId: vendor.id },
          {
            $set: {
              postgresId: vendor.id,
              name: vendor.name,
              email: vendor.email,
              isActive: vendor.isActive,
              profile: serialize(vendor.profile || null),
              escalations: serialize(vendor.escalations || []),
              engagements: serialize(vendor.engagements || []),
              sows: serialize(vendor.sows || []),
            },
          },
          { upsert: true },
        );
      }

      const users = await postgres.getRepository(User).find({
        relations: ['vendor'],
      });
      for (const user of users) {
        await this.userModel.updateOne(
          { postgresId: user.id },
          {
            $set: {
              postgresId: user.id,
              email: user.email,
              role: user.role,
              isActive: user.isActive,
              vendorPostgresId: user.vendor?.id || null,
              vendorRef: user.vendor?.id || null,
              vendorSnapshot: serialize(user.vendor || null),
            },
          },
          { upsert: true },
        );
      }

      const jobs = await postgres.getRepository(Job).find({
        relations: [
          'positions',
          'interviewRounds',
          'interviewRounds.panels',
          'jobVendors',
          'jobVendors.vendor',
          'candidates',
          'candidates.vendor',
          'candidates.position',
          'candidates.interviews',
          'candidates.interviews.round',
        ],
      });
      for (const job of jobs) {
        await this.jobModel.updateOne(
          { postgresId: job.id },
          {
            $set: {
              postgresId: job.id,
              title: job.title,
              location: job.location,
              experience: job.experience,
              department: job.department,
              jobCategory: job.jobCategory,
              workType: job.workType,
              region: job.region,
              dealName: job.dealName,
              hiringManager: job.hiringManager,
              justification: job.justification,
              employmentType: job.employmentType,
              budget: job.budget,
              startDate: job.startDate,
              endDate: job.endDate,
              level: job.level,
              numberOfPositions: job.numberOfPositions,
              currentNumberOfPositions: job.currentNumberOfPositions,
              requestType: job.requestType,
              backfillEmployeeId: job.backfillEmployeeId,
              backfillEmployeeName: job.backfillEmployeeName,
              description: job.description,
              status: job.status,
              isActive: job.isActive,
              jdPath: job.jdPath,
              jdFileName: job.jdFileName,
              jdMimeType: job.jdMimeType,
              jdFiles: job.jdFiles,
              psqPath: job.psqPath,
              psqFileName: job.psqFileName,
              psqMimeType: job.psqMimeType,
              psqFiles: job.psqFiles,
              positions: serialize(job.positions || []),
              interviewRounds: serialize(job.interviewRounds || []),
              jobVendors: serialize(job.jobVendors || []),
              candidates: serialize(job.candidates || []),
            },
          },
          { upsert: true },
        );
      }

      const candidates = await postgres.getRepository(Candidate).find({
        relations: ['vendor', 'job', 'position', 'interviews', 'interviews.round'],
      });
      for (const candidate of candidates) {
        await this.candidateModel.updateOne(
          { postgresId: candidate.id },
          {
            $set: {
              postgresId: candidate.id,
              name: candidate.name,
              email: candidate.email,
              phone: candidate.phone,
              aadharNo: candidate.aadharNo,
              gender: candidate.gender,
              education: candidate.education,
              videoLink: candidate.videoLink,
              primarySkills: candidate.primarySkills,
              secondarySkills: candidate.secondarySkills,
              country: candidate.country,
              state: candidate.state,
              city: candidate.city,
              experience: candidate.experience,
              noticePeriod: candidate.noticePeriod,
              currentOrg: candidate.currentOrg,
              resumePath: candidate.resumePath,
              status: candidate.status,
              dropJustification: candidate.dropJustification,
              ytjJustification: candidate.ytjJustification,
              dateOfJoining: candidate.dateOfJoining,
              vendorPostgresId: candidate.vendor?.id || null,
              jobPostgresId: candidate.job?.id || null,
              positionPostgresId: candidate.position?.id || null,
              vendorSnapshot: serialize(candidate.vendor || null),
              jobSnapshot: serialize(candidate.job || null),
              positionSnapshot: serialize(candidate.position || null),
              interviews: serialize(candidate.interviews || []),
            },
          },
          { upsert: true },
        );
      }

      const partnerSlots = await postgres.getRepository(PartnerSlot).find({
        relations: ['candidate', 'job', 'vendor'],
      });
      for (const slot of partnerSlots) {
        await this.partnerSlotModel.updateOne(
          { postgresId: slot.id },
          {
            $set: {
              postgresId: slot.id,
              candidatePostgresId: slot.candidate?.id || null,
              jobPostgresId: slot.job?.id || null,
              vendorPostgresId: slot.vendor?.id || null,
              candidateSnapshot: serialize(slot.candidate || null),
              jobSnapshot: serialize(slot.job || null),
              vendorSnapshot: serialize(slot.vendor || null),
              roundName: slot.roundName,
              interviewDate: slot.interviewDate,
              interviewTime: slot.interviewTime,
              hmComment: slot.hmComment,
              status: slot.status,
              vendorJustification: slot.vendorJustification,
              attendanceStatus: slot.attendanceStatus,
              attendanceComment: slot.attendanceComment,
              hmFeedbackSubmitted: slot.hmFeedbackSubmitted,
              createdAt: slot.createdAt,
              updatedAt: slot.updatedAt,
            },
          },
          { upsert: true },
        );
      }

      this.logger.log('Initial PostgreSQL -> Mongo bootstrap import completed.');
    } catch (error) {
      this.logger.error('Bootstrap import from PostgreSQL to Mongo failed.', error as any);
    } finally {
      if (postgres.isInitialized) {
        await postgres.destroy();
      }
    }
  }
}
