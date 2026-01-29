// src/dashboard/dashboard.service.ts
import { Injectable } from '@nestjs/common';
import { JobsService } from '../jobs/jobs.service';

@Injectable()
export class DashboardService {
  constructor(
    private readonly jobsService: JobsService,
  ) {}

  async getSummary(user: any) {
    // 🔹 Vendor → only their jobs
    if (user.role === 'VENDOR') {
      const jobs = await this.jobsService.getJobsForUser(user);

      return {
        totalJobs: jobs.length,
        activeJobs: jobs.filter((j) => j.isActive).length,
        submissions: 0, // placeholder (can wire later)
        activeCandidates: 0, // placeholder
      };
    }

    // 🔹 Vendor Manager / Hiring Manager → all jobs
    const totalJobs = await this.jobsService.countAllJobs();
    const activeJobs = await this.jobsService.countActiveJobs();

    return {
      totalJobs,
      activeJobs,
      submissions: 0,
      activeCandidates: 0,
    };
  }
}
