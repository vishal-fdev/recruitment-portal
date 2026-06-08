import 'reflect-metadata';
import mongoose from 'mongoose';
import { DataSource } from 'typeorm';
import { Candidate } from '../../candidates/candidate.entity';
import { Job } from '../../jobs/job.entity';
import { PartnerSlot } from '../../partner-slots/partner-slot.entity';
import { User } from '../../users/user.entity';
import { Vendor } from '../../vendors/vendors.entity';
import { CandidateDocumentModel, CandidateSchema } from '../schemas/candidate.schema';
import { JobDocumentModel, JobSchema } from '../schemas/job.schema';
import {
  PartnerSlotDocumentModel,
  PartnerSlotSchema,
} from '../schemas/partner-slot.schema';
import { UserDocumentModel, UserSchema } from '../schemas/user.schema';
import { VendorDocumentModel, VendorSchema } from '../schemas/vendor.schema';

const postgres = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  entities: [User, Vendor, Job, Candidate, PartnerSlot],
});

const serialize = <T>(value: T): T => JSON.parse(JSON.stringify(value));

async function migrate() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('MONGODB_URI is required to run the MongoDB migration.');
  }

  const mongoDbName = process.env.MONGODB_DB_NAME || 'recruitment-portal';

  await postgres.initialize();
  await mongoose.connect(mongoUri, { dbName: mongoDbName });

  const VendorModel = mongoose.model(VendorDocumentModel.name, VendorSchema);
  const UserModel = mongoose.model(UserDocumentModel.name, UserSchema);
  const JobModel = mongoose.model(JobDocumentModel.name, JobSchema);
  const CandidateModel = mongoose.model(
    CandidateDocumentModel.name,
    CandidateSchema,
  );
  const PartnerSlotModel = mongoose.model(
    PartnerSlotDocumentModel.name,
    PartnerSlotSchema,
  );

  const vendors = await postgres.getRepository(Vendor).find({
    relations: ['profile', 'escalations', 'engagements', 'sows'],
  });
  for (const vendor of vendors) {
    await VendorModel.updateOne(
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
    await UserModel.updateOne(
      { postgresId: user.id },
      {
        $set: {
          postgresId: user.id,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          vendorPostgresId: user.vendor?.id || null,
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
    await JobModel.updateOne(
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
    relations: [
      'vendor',
      'job',
      'position',
      'interviews',
      'interviews.round',
    ],
  });
  for (const candidate of candidates) {
    await CandidateModel.updateOne(
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
    await PartnerSlotModel.updateOne(
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

  await mongoose.disconnect();
  await postgres.destroy();

  console.log('MongoDB migration completed successfully.');
}

migrate().catch(async (error) => {
  console.error('MongoDB migration failed:', error);
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (postgres.isInitialized) {
    await postgres.destroy();
  }
  process.exitCode = 1;
});
