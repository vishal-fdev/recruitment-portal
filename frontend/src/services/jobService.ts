// src/services/jobService.ts
import api from '../api/api';

export interface Job {
  id: number;
  title: string;
  location: string;
  experience: string;
  isActive: boolean;
}

// 🔹 Role-aware: backend filters automatically
export const getJobs = async (): Promise<Job[]> => {
  const res = await api.get('/jobs');
  return res.data;
};
