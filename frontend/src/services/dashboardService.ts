// src/services/dashboardService.ts
import api from '../api/api';

export interface DashboardStats {
  totalJobs: number;
  activeJobs: number;
}

export const getDashboardStats = async (): Promise<DashboardStats> => {
  const res = await api.get('/dashboard/stats');
  return res.data;
};
