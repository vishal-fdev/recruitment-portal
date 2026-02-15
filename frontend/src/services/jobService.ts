// src/services/jobService.ts
import api from '../api/api';

/* ===================== STATUS ===================== */

export type JobStatus =
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'CLOSED';

/* ===================== INTERVIEW TYPES ===================== */

export interface InterviewRoundPayload {
  roundName: string;
  mode?: string;
  panels: string[];
}

/* ===================== JOB RESPONSE TYPE ===================== */

export interface Job {
  id: number;
  title: string;
  location: string;
  experience: string;
  department?: string;
  employmentType?: string;
  budget?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  status: JobStatus;
  isActive: boolean;
  createdAt: string;
  jdFileName?: string;

  interviewRounds?: {
    id: number;
    roundName: string;
    mode?: string;
    panels: {
      id: number;
      name: string;
    }[];
  }[];
}

/* ===================== CREATE PAYLOAD ===================== */

export interface CreateJobPayload {
  title: string;
  location: string;
  experience: string;
  department?: string;
  employmentType?: string;
  budget?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  interviewRounds?: InterviewRoundPayload[];
}

/* ===================== JOB LIST ===================== */

export const getJobs = async (): Promise<Job[]> => {
  const res = await api.get('/jobs');
  return res.data;
};

/* ===================== JOB CREATE ===================== */

export const createJob = async (
  data: CreateJobPayload,
): Promise<Job> => {
  const res = await api.post('/jobs', data);
  return res.data;
};

/* ===================== JOB DETAILS ===================== */

export const getJobDetails = async (
  jobId: number,
): Promise<Job> => {
  const res = await api.get(`/jobs/${jobId}`);
  return res.data;
};

/* ===================== APPROVAL ===================== */

export const approveJob = async (jobId: number) => {
  const res = await api.patch(`/jobs/${jobId}/approve`);
  return res.data;
};

export const rejectJob = async (jobId: number) => {
  const res = await api.patch(`/jobs/${jobId}/reject`);
  return res.data;
};

export const closeJob = async (jobId: number) => {
  const res = await api.patch(`/jobs/${jobId}/close`);
  return res.data;
};

/* ===================== JD FILE HANDLING ===================== */

export const uploadJD = async (
  jobId: number,
  file: File,
) => {
  const formData = new FormData();
  formData.append('jd', file);

  const res = await api.post(`/jobs/${jobId}/jd`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return res.data;
};

export const viewJD = (jobId: number) =>
  `${import.meta.env.VITE_API_URL}/jobs/${jobId}/jd/view`;

export const downloadJD = (jobId: number) =>
  `${import.meta.env.VITE_API_URL}/jobs/${jobId}/jd/download`;
