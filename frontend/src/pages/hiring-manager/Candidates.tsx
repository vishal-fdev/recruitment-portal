import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api';
import ResumeModal from '../../components/ResumeModal';

export type CandidateStatus =
  | 'NEW'
  | 'SUBMITTED'
  | 'SCREENING'
  | 'SCREEN_SELECTED'
  | 'SCREEN_REJECTED'
  | 'TECH_SELECTED'
  | 'TECH_REJECTED'
  | 'IDENTIFIED'
  | 'YET_TO_JOIN'
  | 'OPS_SELECTED'
  | 'OPS_REJECTED'
  | 'ONBOARDED'
  | 'DROPPED'
  | 'REJECTED'
  | 'SELECTED';

interface Candidate {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  experience?: number;
  status: CandidateStatus;
  vendor?: {
    name?: string;
  };
  job?: {
    title?: string;
  };
}

const STATUS_LABELS: Record<CandidateStatus, string> = {
  NEW: 'New',
  SUBMITTED: 'Submitted',
  SCREENING: 'Screening',
  SCREEN_SELECTED: 'Screen Select',
  SCREEN_REJECTED: 'Screen Reject',
  TECH_SELECTED: 'Tech Select',
  TECH_REJECTED: 'Tech Reject',
  IDENTIFIED: 'Identified',
  YET_TO_JOIN: 'YTJ',
  OPS_SELECTED: 'Ops Select',
  OPS_REJECTED: 'Ops Reject',
  ONBOARDED: 'Onboarded',
  DROPPED: 'Drop',
  REJECTED: 'Rejected',
  SELECTED: 'Selected',
};

const HMCandidates = () => {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [resumeCandidateId, setResumeCandidateId] = useState<number | null>(null);

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const res = await api.get('/candidates');
      setCandidates(res.data || []);
    } catch {
      alert('Failed to load candidates');
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchCandidates();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-800">Candidate Pipeline</h1>
        <p className="mt-1 text-sm text-gray-500">Review submitted candidates and open profiles</p>
      </div>

      <div className="space-y-4">
        {loading && (
          <div className="rounded-[20px] bg-white p-8 shadow">Loading candidates...</div>
        )}

        {!loading &&
          candidates.map((candidate) => (
            <div
              key={candidate.id}
              onClick={() => navigate(`/hiring-manager/candidates/${candidate.id}`)}
              className="cursor-pointer rounded-[24px] border border-black/8 bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(15,23,42,0.08)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-semibold text-[#0F172A]">
                      {candidate.name}
                    </span>
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getStatusStyle(candidate.status)}`}
                    >
                      {STATUS_LABELS[candidate.status] || candidate.status}
                    </span>
                  </div>
                  <p className="text-sm text-[#64748B]">{candidate.email || '-'}</p>
                </div>

                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setResumeCandidateId(candidate.id);
                  }}
                  className="rounded-[12px] border border-[#D6DCE5] p-2 text-[#64748B]"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-[18px] w-[18px]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                </button>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
                <Info label="Contact" value={candidate.phone || '-'} />
                <Info label="Vendor" value={candidate.vendor?.name || '-'} />
                <Info label="Job" value={candidate.job?.title || '-'} />
                <Info
                  label="Experience"
                  value={
                    candidate.experience !== undefined && candidate.experience !== null
                      ? `${candidate.experience} yrs`
                      : '-'
                  }
                />
                <Info label="Status" value={STATUS_LABELS[candidate.status] || candidate.status} />
              </div>
            </div>
          ))}

        {!loading && candidates.length === 0 && (
          <div className="rounded-[20px] bg-white p-10 text-center text-sm text-gray-500 shadow">
            No candidates found.
          </div>
        )}
      </div>

      {resumeCandidateId && (
        <ResumeModal
          candidateId={resumeCandidateId}
          onClose={() => setResumeCandidateId(null)}
        />
      )}
    </div>
  );
};

const Info = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-[16px] bg-[#F8FAFC] px-4 py-3">
    <div className="text-xs font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
      {label}
    </div>
    <div className="mt-1 text-sm font-medium text-[#0F172A]">{value}</div>
  </div>
);

const getStatusStyle = (status: CandidateStatus) => {
  if (
    ['SCREEN_REJECTED', 'TECH_REJECTED', 'OPS_REJECTED', 'REJECTED', 'DROPPED'].includes(
      status,
    )
  ) {
    return 'bg-red-100 text-red-600';
  }
  if (
    ['SCREEN_SELECTED', 'TECH_SELECTED', 'IDENTIFIED', 'OPS_SELECTED', 'SELECTED', 'ONBOARDED'].includes(
      status,
    )
  ) {
    return 'bg-green-100 text-green-600';
  }
  if (status === 'YET_TO_JOIN') return 'bg-amber-100 text-amber-700';
  return 'bg-yellow-100 text-yellow-700';
};

export default HMCandidates;
