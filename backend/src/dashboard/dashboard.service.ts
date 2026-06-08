import { Injectable } from '@nestjs/common';
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
  VendorDocument,
  VendorDocumentModel,
} from '../mongodb/schemas/vendor.schema';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(CandidateDocumentModel.name)
    private readonly candidateMongoModel: Model<CandidateDocument>,
    @InjectModel(JobDocumentModel.name)
    private readonly jobMongoModel: Model<JobDocument>,
    @InjectModel(VendorDocumentModel.name)
    private readonly vendorMongoModel: Model<VendorDocument>,
  ) {}

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

    if (user.role === 'PANEL') {
      return this.getPanelDashboard(user);
    }

    return {};
  }

  private normalizeEmail(email?: string | null) {
    return (email || '').trim().toLowerCase();
  }

  private async findMongoCandidates(filter: Record<string, any> = {}) {
    return this.candidateMongoModel.find(filter).lean().exec();
  }

  private async findMongoJobs(filter: Record<string, any> = {}) {
    return this.jobMongoModel.find(filter).lean().exec();
  }

  private async findMongoVendors(filter: Record<string, any> = {}) {
    return this.vendorMongoModel.find(filter).lean().exec();
  }

  private mapMongoDashboardCandidates(candidates: any[]) {
    return candidates.map((candidate) => ({
      ...candidate,
      status: candidate.status,
      createdAt: candidate.createdAt ? new Date(candidate.createdAt) : undefined,
      interviews: Array.isArray(candidate.interviews) ? candidate.interviews : [],
    })) as any[];
  }

  private async getVendorDashboard(user: any) {
    const vendorId = String(user.vendorId || '');
    const rawCandidates = await this.findMongoCandidates({
      vendorPostgresId: vendorId,
    });
    const candidates = this.mapMongoDashboardCandidates(rawCandidates);
    const jobs = await this.findMongoJobs();
    const assignedJobs = jobs.filter((job) =>
      ((job as any).jobVendors || []).some(
        (jv: any) => String(jv?.vendor?.id || '') === vendorId,
      ),
    );

    return {
      kpis: {
        totalCandidates: candidates.length,
        openJobs: assignedJobs.filter((j) => j.isActive).length,
        screening: candidates.filter((c) => c.status === CandidateStatus.SCREENING).length,
        selected: candidates.filter((c) =>
          [
            CandidateStatus.SELECTED,
            CandidateStatus.IDENTIFIED,
            CandidateStatus.YET_TO_JOIN,
            CandidateStatus.ONBOARDED,
          ].includes(c.status as CandidateStatus),
        ).length,
        rejected: candidates.filter((c) => c.status === CandidateStatus.REJECTED).length,
      },
      stageSummary: this.buildStageSummary(candidates),
      submissionsByDate: this.buildDailySubmissions(candidates),
    };
  }

  private async getVendorManagerDashboard() {
    const [vendors, jobs, rawCandidates] = await Promise.all([
      this.findMongoVendors(),
      this.findMongoJobs(),
      this.findMongoCandidates(),
    ]);
    const candidates = this.mapMongoDashboardCandidates(rawCandidates);

    return {
      kpis: {
        activeVendors: vendors.filter((v) => v.isActive).length,
        activeJobs: jobs.filter((j) => j.isActive).length,
        totalCandidates: candidates.length,
        screening: candidates.filter((c) => c.status === CandidateStatus.SCREENING).length,
        selected: candidates.filter((c) =>
          [
            CandidateStatus.SELECTED,
            CandidateStatus.IDENTIFIED,
            CandidateStatus.YET_TO_JOIN,
            CandidateStatus.ONBOARDED,
          ].includes(c.status as CandidateStatus),
        ).length,
        rejected: candidates.filter((c) => c.status === CandidateStatus.REJECTED).length,
      },
      stageSummary: this.buildStageSummary(candidates),
      submissionsByDate: this.buildWeeklySubmissions(candidates),
    };
  }

  private async getHiringManagerDashboard(_user: any) {
    const [jobs, rawCandidates] = await Promise.all([
      this.findMongoJobs(),
      this.findMongoCandidates(),
    ]);
    const candidates = this.mapMongoDashboardCandidates(rawCandidates);

    const interviews = candidates.reduce(
      (total, candidate) => total + ((candidate.interviews || []).length || 0),
      0,
    );

    return {
      kpis: {
        openJobs: jobs.filter((j) => j.isActive).length,
        totalCandidates: candidates.length,
        interviews,
        screening: candidates.filter((c) => c.status === CandidateStatus.SCREENING).length,
        selected: candidates.filter((c) =>
          [
            CandidateStatus.SELECTED,
            CandidateStatus.IDENTIFIED,
            CandidateStatus.YET_TO_JOIN,
            CandidateStatus.ONBOARDED,
          ].includes(c.status as CandidateStatus),
        ).length,
        rejected: candidates.filter((c) => c.status === CandidateStatus.REJECTED).length,
      },
      stageSummary: this.buildStageSummary(candidates),
      submissionsByDate: this.buildWeeklySubmissions(candidates),
    };
  }

  private async getPanelDashboard(user: any) {
    const panelEmail = this.normalizeEmail(user.email);
    const jobs = await this.findMongoJobs();

    const assignedJobs = jobs.filter((job) =>
      ((job as any).interviewRounds || []).some(
        (round: any) =>
          String(round?.roundName || '').trim().toUpperCase() === 'SCREENING' &&
          (Array.isArray(round?.panels) ? round.panels : []).some(
            (panel: any) => this.normalizeEmail(panel?.email) === panelEmail,
          ),
      ),
    );

    const jobIds = assignedJobs.map((job) => Number((job as any).postgresId ?? job.id));
    const rawCandidates = jobIds.length
      ? await this.findMongoCandidates({
          jobPostgresId: { $in: jobIds },
        })
      : [];
    const candidates = this.mapMongoDashboardCandidates(rawCandidates);

    return {
      kpis: {
        openJobs: assignedJobs.length,
        totalCandidates: candidates.length,
        interviews: candidates.filter((candidate) =>
          ['SCREEN_SELECTED', 'TECH_SELECTED', 'IDENTIFIED'].includes(candidate.status),
        ).length,
      },
      stageSummary: this.buildStageSummary(candidates),
      submissionsByDate: this.buildWeeklySubmissions(candidates),
    };
  }

  private buildStageSummary(candidates: any[]) {
    const summary: Record<string, number> = {};

    Object.values(CandidateStatus).forEach((status) => {
      summary[status] = 0;
    });

    for (const candidate of candidates) {
      summary[candidate.status] = (summary[candidate.status] || 0) + 1;
    }

    return summary;
  }

  private buildDailySubmissions(candidates: any[]) {
    const map: Record<string, number> = {};

    candidates.forEach((candidate) => {
      if (!candidate.createdAt) return;

      const date = candidate.createdAt.toISOString().split('T')[0];
      map[date] = (map[date] || 0) + 1;
    });

    return Object.keys(map)
      .sort()
      .map((date) => ({
        label: date,
        count: map[date],
      }));
  }

  private buildWeeklySubmissions(candidates: any[]) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const counts: Record<string, number> = {};

    days.forEach((day) => {
      counts[day] = 0;
    });

    candidates.forEach((candidate) => {
      if (!candidate.createdAt) return;

      const day = days[candidate.createdAt.getDay()];
      counts[day]++;
    });

    return days.map((day) => ({
      label: day,
      count: counts[day],
    }));
  }
}
