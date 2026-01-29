import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from './job.entity';
import { JobVendor } from './job-vendor.entity';
import { Vendor } from '../vendors/vendors.entity';
import { Candidate } from '../candidates/candidate.entity';

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
  ) {}

  // ============================
  // ROLE-AWARE JOB LIST
  // ============================
  async getJobsForUser(user: any) {
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
        .filter((job) => job.isActive);
    }

    return this.jobRepo.find({
      order: { createdAt: 'DESC' },
    });
  }

  // ============================
  // JOB + VENDORS
  // ============================
  async getJobWithVendors(jobId: number) {
    const job = await this.jobRepo.findOne({
      where: { id: jobId },
      relations: ['jobVendors', 'jobVendors.vendor'],
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    return {
      id: job.id,
      title: job.title,
      isActive: job.isActive,
      vendors: job.jobVendors.map((jv) => ({
        id: jv.vendor.id,
        email: jv.vendor.email,
        isEnabled: jv.isEnabled,
      })),
    };
  }

  // ============================
  // 🔥 CANDIDATES PER JOB
  // ============================
  async getCandidatesForJob(jobId: number) {
    return this.candidateRepo.find({
      where: {
        job: { id: jobId },
      },
      relations: ['vendor'],
      order: { createdAt: 'DESC' },
    });
  }

  // ============================
  // DASHBOARD COUNTS
  // ============================
  async countAllJobs() {
    return this.jobRepo.count();
  }

  async countActiveJobs() {
    return this.jobRepo.count({
      where: { isActive: true },
    });
  }

  // ============================
  // CREATE JOB
  // ============================
  async createJob(data: any) {
    const job = this.jobRepo.create(data);
    return this.jobRepo.save(job);
  }

  // ============================
  // OPEN / CLOSE JOB
  // ============================
  async setJobStatus(jobId: number, isActive: boolean) {
    await this.jobRepo.update(jobId, { isActive });
    return { success: true };
  }

  // ============================
  // ENABLE / DISABLE VENDOR
  // ============================
  async setVendorStatusForJob(
    jobId: number,
    vendorId: string,
    isEnabled: boolean,
  ) {
    const vendor = await this.vendorRepo.findOne({
      where: { id: vendorId },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    let mapping = await this.jobVendorRepo.findOne({
      where: {
        job: { id: jobId },
        vendor: { id: vendorId },
      },
      relations: ['job', 'vendor'],
    });

    if (!mapping) {
      mapping = this.jobVendorRepo.create({
        job: { id: jobId } as Job,
        vendor,
        isEnabled,
      });
    } else {
      mapping.isEnabled = isEnabled;
    }

    await this.jobVendorRepo.save(mapping);
    return { success: true };
  }
}
