import api from '../api/api';

export type PartnerSlotStatus =
  | 'PENDING_VENDOR'
  | 'REJECTED'
  | 'SCHEDULED'
  | 'CLOSED';

export type SlotAttendanceStatus =
  | 'PENDING'
  | 'ATTENDED'
  | 'NO_SHOW'
  | 'RESCHEDULE_REQUESTED_BY_CANDIDATE'
  | 'RESCHEDULE_REQUESTED_BY_PANEL'
  | 'DROPPED';

export interface PartnerSlotCandidate {
  id: number;
  name: string;
  email: string;
  phone: string;
  experience: number;
  status: string;
}

export interface PartnerSlotJob {
  id: number;
  title: string;
  interviewRounds?: Array<{
    roundName: string;
    panels?: Array<{
      name: string;
      email?: string;
    }>;
  }>;
}

export interface PartnerSlotVendor {
  id: string;
  name: string;
}

export interface PartnerSlot {
  id: number;
  roundName: string;
  interviewDate: string;
  interviewTime: string;
  hmComment?: string | null;
  vendorJustification?: string | null;
  status: PartnerSlotStatus;
  attendanceStatus: SlotAttendanceStatus;
  attendanceComment?: string | null;
  hmFeedbackSubmitted: boolean;
  candidate: PartnerSlotCandidate;
  job: PartnerSlotJob;
  vendor: PartnerSlotVendor;
  createdAt: string;
  updatedAt: string;
}

export interface EligibleSlotCandidate {
  id: number;
  candidateName: string;
  candidateEmail: string;
  contactNumber: string;
  relevantExperience: number;
  vendorName: string;
  role: string;
  jobId: number;
  hrqId: string;
  status: string;
  nextRoundName: string;
  existingOpenSlot: boolean;
}

export const getPartnerSlots = async (): Promise<PartnerSlot[]> => {
  const res = await api.get('/partner-slots');
  return res.data;
};

export const getEligiblePartnerCandidates = async (): Promise<EligibleSlotCandidate[]> => {
  const res = await api.get('/partner-slots/eligible-candidates');
  return res.data;
};

export const createPartnerSlot = async (payload: {
  candidateId: number;
  interviewDate: string;
  interviewTime: string;
  hmComment?: string;
}) => {
  const res = await api.post('/partner-slots', payload);
  return res.data;
};

export const respondToPartnerSlot = async (
  slotId: number,
  payload: {
    action: 'ACCEPT' | 'REJECT';
    justification?: string;
  },
) => {
  const res = await api.patch(`/partner-slots/${slotId}/respond`, payload);
  return res.data;
};

export const updatePartnerSlotAttendance = async (
  slotId: number,
  payload: {
    attendanceStatus:
      | 'ATTENDED'
      | 'NO_SHOW'
      | 'RESCHEDULE_REQUESTED_BY_CANDIDATE'
      | 'RESCHEDULE_REQUESTED_BY_PANEL'
      | 'DROPPED';
    comment?: string;
  },
) => {
  const res = await api.patch(`/partner-slots/${slotId}/attendance`, payload);
  return res.data;
};
