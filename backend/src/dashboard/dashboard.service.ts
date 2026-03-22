// src/dashboard/dashboard.service.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Candidate } from '../candidates/candidate.entity';
import { Job } from '../jobs/job.entity';
import { Vendor } from '../vendors/vendors.entity';
import { CandidateStatus } from '../candidates/candidate-status.enum';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Candidate)
    private readonly candidateRepo: Repository<Candidate>,

    @InjectRepository(Job)
    private readonly jobRepo: Repository<Job>,

    @InjectRepository(Vendor)
    private readonly vendorRepo: Repository<Vendor>,
  ) {}

  // ======================================================
  // MAIN DASHBOARD ENTRY (ROLE AWARE)
  // ======================================================

  async getSummary(user: any) {
    if (user.role === 'VENDOR') {
      return this.getVendorDashboard(user);
    }

    if (user.role === 'VENDOR_MANAGER') {
      return this.getVendorManagerDashboard();
    }

    if (user.role === 'HIRING_MANAGER') {
      return this.getHiringManagerDashboard(user);
    }

    return {};
  }

  // ======================================================
  // VENDOR DASHBOARD
  // ======================================================

  private async getVendorDashboard(user: any) {
    const candidates = await this.candidateRepo.find({
      where: { vendor: { id: user.vendorId } },
      relations: ['job'],
    });

    const jobs = await this.jobRepo
      .createQueryBuilder('job')
      .leftJoin('job.jobVendors', 'jv')
      .where('jv.vendorId = :vendorId', {
        vendorId: user.vendorId,
      })
      .getMany();

    return {
      kpis: {
        totalCandidates: candidates.length,
        openJobs: jobs.filter((j) => j.isActive).length,
        screening: candidates.filter(
          (c) => c.status === CandidateStatus.SCREENING,
        ).length,
        selected: candidates.filter(
          (c) => c.status === CandidateStatus.SELECTED,
        ).length,
        rejected: candidates.filter(
          (c) => c.status === CandidateStatus.REJECTED,
        ).length,
      },

      stageSummary: this.buildStageSummary(candidates),

      submissionsByDate: this.buildDailySubmissions(
        candidates,
      ),
    };
  }

  // ======================================================
  // VENDOR MANAGER DASHBOARD (GLOBAL)
  // ======================================================

  private async getVendorManagerDashboard() {
    const [vendors, jobs, candidates] = await Promise.all([
      this.vendorRepo.find(),
      this.jobRepo.find(),
      this.candidateRepo.find(),
    ]);

    return {
      kpis: {
        activeVendors: vendors.filter((v) => v.isActive)
          .length,
        activeJobs: jobs.filter((j) => j.isActive).length,
        totalCandidates: candidates.length,
        screening: candidates.filter(
          (c) => c.status === CandidateStatus.SCREENING,
        ).length,
        selected: candidates.filter(
          (c) => c.status === CandidateStatus.SELECTED,
        ).length,
        rejected: candidates.filter(
          (c) => c.status === CandidateStatus.REJECTED,
        ).length,
      },

      stageSummary: this.buildStageSummary(candidates),

      submissionsByDate: this.buildWeeklySubmissions(
        candidates,
      ),
    };
  }

  // ======================================================
  // HIRING MANAGER DASHBOARD
  // ======================================================

  private async getHiringManagerDashboard(_user: any) {
    const [jobs, candidates] = await Promise.all([
      this.jobRepo.find(),
      this.candidateRepo.find(),
    ]);

    return {
      kpis: {
        openJobs: jobs.filter((j) => j.isActive).length,
        totalCandidates: candidates.length,
        screening: candidates.filter(
          (c) => c.status === CandidateStatus.SCREENING,
        ).length,
        selected: candidates.filter(
          (c) => c.status === CandidateStatus.SELECTED,
        ).length,
        rejected: candidates.filter(
          (c) => c.status === CandidateStatus.REJECTED,
        ).length,
      },

      stageSummary: this.buildStageSummary(candidates),

      submissionsByDate: this.buildWeeklySubmissions(
        candidates,
      ),
    };
  }

  // ======================================================
  // HELPERS
  // ======================================================

  private buildStageSummary(candidates: Candidate[]) {
    const summary: Record<string, number> = {};

    Object.values(CandidateStatus).forEach((status) => {
      summary[status] = 0;
    });

    for (const c of candidates) {
      summary[c.status] =
        (summary[c.status] || 0) + 1;
    }

    return summary;
  }

  private buildDailySubmissions(
    candidates: Candidate[],
  ) {
    const map: Record<string, number> = {};

    candidates.forEach((c) => {
      if (!c.createdAt) return;

      const date = c.createdAt
        .toISOString()
        .split('T')[0];

      map[date] = (map[date] || 0) + 1;
    });

    return Object.keys(map)
      .sort()
      .map((d) => ({
        label: d,
        count: map[d],
      }));
  }

  private buildWeeklySubmissions(
    candidates: Candidate[],
  ) {
    const days = [
      'Sun',
      'Mon',
      'Tue',
      'Wed',
      'Thu',
      'Fri',
      'Sat',
    ];

    const counts: Record<string, number> = {};

    days.forEach((d) => (counts[d] = 0));

    candidates.forEach((c) => {
      if (!c.createdAt) return;

      const day = days[c.createdAt.getDay()];
      counts[day]++;
    });

    return days.map((d) => ({
      label: d,
      count: counts[d],
    }));
  }
}