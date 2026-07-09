import api from '../api/api';

export type HpeBadgedCandidate = {
  _id: string;
  jobId: string;
  candidateId: string;
  candidateName: string;
  email: string;
  contactNumber: string;
  currentCompany: string;
  noticePeriod: string;
  uploadedDate: string;
  status: string;
  resumePath?: string | null;
  resumeFileName?: string | null;
};

export type BadgedRecruiter = {
  _id: string;
  name: string;
  email: string;
  isActive: boolean;
};

export type BadgedJob = {
  _id: string;
  jobId: string;
  title: string;
  category: string;
  businessUnit: string;
  level: string;
  location: string;
  positions: number;
  currentPositions: number;
  startDate?: string | null;
  endDate?: string | null;
  description: string;
  status: string;
  assignedRecruiters: Array<{ id: string; name: string; email: string }>;
  jdPath?: string;
  jdFileName?: string;
  jdMimeType?: string;
  psqPath?: string;
  psqFileName?: string;
  psqMimeType?: string;
};

export type BadgedSubmission = {
  _id: string;
  jobId: string;
  candidateId: string;
  candidateName: string;
  email: string;
  contactNumber: string;
  currentCompany: string;
  noticePeriod: string;
  primarySkills: string;
  secondarySkills: string;
  experience: string;
  location: string;
  recruiterEmail: string;
  status: string;
  submittedAt: string;
  resumeFileName?: string | null;
};

export type HpeBadgedImportResult = {
  inserted: number;
  updated: number;
  total: number;
  records: HpeBadgedCandidate[];
};

export type BadgedSubmissionImportResult = {
  inserted: number;
  updated: number;
  total: number;
  records: BadgedSubmission[];
};

export const hpeBadgedHiringService = {
  async dashboard() {
    const response = await api.get('/hpe-badged-hiring/dashboard');
    return response.data as {
      jobsCreated: number;
      assignedJobs: number;
      candidatesSubmitted: number;
      recruiters: number;
      selected: number;
      rejected: number;
    };
  },

  async list() {
    const response = await api.get<HpeBadgedCandidate[]>('/hpe-badged-hiring');
    return response.data;
  },

  async uploadExcel(file: File) {
    const formData = new FormData();
    formData.append('excel', file);

    const response = await api.post<HpeBadgedImportResult>(
      '/hpe-badged-hiring/upload-excel',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );

    return response.data;
  },

  async uploadResume(id: string, file: File) {
    const formData = new FormData();
    formData.append('resume', file);

    const response = await api.post<HpeBadgedCandidate>(
      `/hpe-badged-hiring/${id}/resume`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );

    return response.data;
  },

  async listRecruiters() {
    const response = await api.get<BadgedRecruiter[]>('/hpe-badged-hiring/recruiters');
    return response.data;
  },

  async createRecruiter(payload: { name: string; email: string }) {
    const response = await api.post<BadgedRecruiter>('/hpe-badged-hiring/recruiters', payload);
    return response.data;
  },

  async listJobs() {
    const response = await api.get<BadgedJob[]>('/hpe-badged-hiring/jobs');
    return response.data;
  },

  async createJob(payload: Record<string, unknown>, files?: { jd?: File | null; psq?: File | null }) {
    if (files?.jd || files?.psq) {
      const formData = new FormData();
      Object.entries(payload).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      });
      if (files.jd) formData.append('jd', files.jd);
      if (files.psq) formData.append('psq', files.psq);

      const response = await api.post<BadgedJob>('/hpe-badged-hiring/jobs', formData);
      return response.data;
    }

    const response = await api.post<BadgedJob>('/hpe-badged-hiring/jobs', payload);
    return response.data;
  },

  async assignRecruiters(jobId: string, recruiterIds: string[]) {
    const response = await api.patch<BadgedJob>(`/hpe-badged-hiring/jobs/${jobId}/recruiters`, {
      recruiterIds,
    });
    return response.data;
  },

  async listSubmissions() {
    const response = await api.get<BadgedSubmission[]>('/hpe-badged-hiring/candidate-submissions');
    return response.data;
  },

  async uploadSubmissionExcel(file: File) {
    const formData = new FormData();
    formData.append('excel', file);

    const response = await api.post<BadgedSubmissionImportResult>(
      '/hpe-badged-hiring/candidate-submissions/upload-excel',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );

    return response.data;
  },

  async createSubmission(payload: Record<string, string>, resume?: File | null) {
    const formData = new FormData();
    Object.entries(payload).forEach(([key, value]) => formData.append(key, value));
    if (resume) formData.append('resume', resume);

    const response = await api.post<BadgedSubmission>(
      '/hpe-badged-hiring/candidate-submissions',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return response.data;
  },
};


