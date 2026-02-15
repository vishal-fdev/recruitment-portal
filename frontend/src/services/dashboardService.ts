// src/services/dashboardService.ts
import api from '../api/api';

/* =======================
   DASHBOARD TYPES
   ======================= */

export interface KPIStats {
  // Vendor KPIs
  activeCandidates?: number;
  openJobs?: number;
  submissions?: number;

  // Vendor Manager KPIs
  activeVendors?: number;
  activeJobs?: number;
  totalCandidates?: number;

  // Hiring Manager KPIs
  interviews?: number;
}

export interface SubmissionStat {
  label: string; // day or date label
  count: number;
}

export interface DashboardStats {
  kpis: KPIStats;
  stageSummary: Record<string, number>;
  submissionsByDate: SubmissionStat[];
}

/* =======================
   API CALL
   ======================= */

export const getDashboardStats = async (): Promise<DashboardStats> => {
  const res = await api.get('/dashboard/stats');
  return res.data;
};
