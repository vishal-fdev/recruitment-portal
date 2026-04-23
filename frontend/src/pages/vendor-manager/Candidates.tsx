import { useEffect, useState } from 'react';
import { Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api';

type CandidateStatus =
  | 'SUBMITTED'
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
  | 'NEW'
  | 'SCREENING'
  | 'TECH'
  | 'OPS'
  | 'SELECTED'
  | 'REJECTED';

interface Candidate {
  id: number;
  name: string;
  email: string;
  phone?: string;
  experience?: number;
  dateOfJoining?: string;
  ytjJustification?: string;
  vendor?: {
    name: string;
  };
  job?: {
    title: string;
  };
  status: CandidateStatus;
}

const STATUS_LABELS: Record<CandidateStatus, string> = {
  SUBMITTED: 'Submitted',
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
  NEW: 'New',
  SCREENING: 'Screening',
  TECH: 'Tech',
  OPS: 'Ops',
  SELECTED: 'Selected',
  REJECTED: 'Rejected',
};

const Candidates = () => {
  const navigate = useNavigate();
  const today = new Date().toLocaleDateString('en-CA');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedResumeUrl, setSelectedResumeUrl] = useState<string | null>(null);
  const [dropCandidate, setDropCandidate] = useState<Candidate | null>(null);
  const [dropJustification, setDropJustification] = useState('');
  const [ytjCandidate, setYtjCandidate] = useState<Candidate | null>(null);
  const [ytjDateOfJoining, setYtjDateOfJoining] = useState('');
  const [ytjJustification, setYtjJustification] = useState('');
  const [finalizeCandidate, setFinalizeCandidate] = useState<Candidate | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [autoPromptedCandidateIds, setAutoPromptedCandidateIds] = useState<number[]>([]);

  const loadCandidates = async () => {
    try {
      const res = await api.get('/candidates');
      setCandidates(res.data || []);
    } catch {
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCandidates();
  }, []);

  useEffect(() => {
    const dueCandidate = candidates.find(
      (candidate) =>
        candidate.status === 'YET_TO_JOIN' &&
        candidate.dateOfJoining === today &&
        !autoPromptedCandidateIds.includes(candidate.id),
    );

    if (dueCandidate && !finalizeCandidate) {
      setFinalizeCandidate(dueCandidate);
      setAutoPromptedCandidateIds((prev) => [...prev, dueCandidate.id]);
    }
  }, [autoPromptedCandidateIds, candidates, finalizeCandidate, today]);

  const openResume = async (candidateId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await api.get(`/candidates/${candidateId}/resume`, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      const fileUrl = URL.createObjectURL(blob);
      setSelectedResumeUrl(fileUrl);
    } catch (error) {
      console.error('Failed to load resume', error);
    }
  };

  const closeModal = () => {
    if (selectedResumeUrl) URL.revokeObjectURL(selectedResumeUrl);
    setSelectedResumeUrl(null);
  };

  const updateCandidateStatus = async (
    candidateId: number,
    status: 'YET_TO_JOIN' | 'ONBOARDED' | 'DROPPED',
    options?: { dropJustification?: string; dateOfJoining?: string; ytjJustification?: string },
  ) => {
    try {
      setUpdatingId(candidateId);
      await api.patch(`/candidates/${candidateId}/status`, {
        status,
        dropJustification: options?.dropJustification,
        dateOfJoining: options?.dateOfJoining,
        ytjJustification: options?.ytjJustification,
      });
      await loadCandidates();
    } catch (error) {
      console.error('Failed to update candidate status', error);
      alert(`Failed to mark candidate as ${status.toLowerCase()}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const canMarkYtj = (status: CandidateStatus) => ['IDENTIFIED', 'OPS_SELECTED', 'SELECTED'].includes(status);
  const canFinalize = (candidate: Candidate) => candidate.status === 'YET_TO_JOIN' && candidate.dateOfJoining === today;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-800">Candidate Pipeline</h1>

      <div className="space-y-4">
        {loading && <div className="rounded-[20px] bg-white p-8 shadow">Loading candidates...</div>}

        {!loading &&
          candidates.map((candidate) => (
            <div
              key={candidate.id}
              onClick={() => navigate(`/vendor-manager/candidates/${candidate.id}`)}
              className="rounded-[24px] border border-black/8 bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(15,23,42,0.08)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-semibold text-[#0F172A]">{candidate.name}</span>
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getStatusStyle(candidate.status)}`}>
                      {STATUS_LABELS[candidate.status] || candidate.status}
                    </span>
                  </div>
                  <p className="text-sm text-[#64748B]">{candidate.email}</p>
                </div>

                <button
                  type="button"
                  onClick={(event) => void openResume(candidate.id, event)}
                  className="rounded-[12px] border border-[#D6DCE5] p-2 text-[#64748B]"
                >
                  <Eye size={18} />
                </button>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-5">
                <Info label="Contact" value={candidate.phone || '-'} />
                <Info label="Vendor" value={candidate.vendor?.name || '-'} />
                <Info label="Job" value={candidate.job?.title || '-'} />
                <Info label="Experience" value={candidate.experience ? `${candidate.experience} yrs` : '-'} />
                <Info label="DOJ" value={candidate.dateOfJoining || '-'} />
              </div>

              {candidate.status === 'YET_TO_JOIN' && candidate.ytjJustification && (
                <p className="mt-4 text-sm text-slate-500">{candidate.ytjJustification}</p>
              )}

              <div className="mt-5 flex flex-wrap gap-2" onClick={(event) => event.stopPropagation()}>
                <ActionButton
                  disabled={!canMarkYtj(candidate.status) || updatingId === candidate.id}
                  onClick={() => {
                    setYtjCandidate(candidate);
                    setYtjDateOfJoining(candidate.dateOfJoining || '');
                    setYtjJustification(candidate.ytjJustification || '');
                  }}
                >
                  YTJ
                </ActionButton>
                <ActionButton
                  disabled={!canFinalize(candidate) || updatingId === candidate.id}
                  onClick={async () => {
                    await updateCandidateStatus(candidate.id, 'ONBOARDED');
                  }}
                >
                  Onboarded
                </ActionButton>
                <ActionButton
                  danger
                  disabled={(updatingId === candidate.id) || (!canMarkYtj(candidate.status) && !canFinalize(candidate) && candidate.status !== 'YET_TO_JOIN')}
                  onClick={() => {
                    setDropCandidate(candidate);
                    setDropJustification('');
                  }}
                >
                  Drop
                </ActionButton>
              </div>
            </div>
          ))}
      </div>

      {selectedResumeUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="relative h-[85%] w-[85%] rounded-xl bg-white shadow-lg">
            <button onClick={closeModal} className="absolute right-4 top-3 text-xl text-gray-600 hover:text-black">×</button>
            <iframe src={selectedResumeUrl} title="Resume Viewer" className="h-full w-full rounded-xl" />
          </div>
        </div>
      )}

      {dropCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-[460px] space-y-4 rounded-xl bg-white p-6 shadow-lg">
            <h2 className="text-lg font-semibold">Drop Candidate</h2>
            <p className="text-sm text-gray-600">Enter the justification for dropping {dropCandidate.name}.</p>
            <textarea rows={5} value={dropJustification} onChange={(event) => setDropJustification(event.target.value)} className="w-full rounded border p-3 text-sm" />
            <div className="flex justify-end gap-2">
              <button onClick={() => { setDropCandidate(null); setDropJustification(''); }} className="rounded border px-4 py-2 text-sm">Cancel</button>
              <button
                onClick={async () => {
                  if (dropCandidate.status !== 'YET_TO_JOIN' && !dropJustification.trim()) {
                    alert('Drop justification is required');
                    return;
                  }
                  await updateCandidateStatus(dropCandidate.id, 'DROPPED', { dropJustification });
                  setDropCandidate(null);
                  setDropJustification('');
                }}
                className="rounded bg-red-600 px-4 py-2 text-sm text-white"
              >
                Confirm Drop
              </button>
            </div>
          </div>
        </div>
      )}

      {ytjCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-[480px] space-y-4 rounded-xl bg-white p-6 shadow-lg">
            <h2 className="text-lg font-semibold">Mark Candidate as Yet to Join</h2>
            <p className="text-sm text-gray-600">Add DOJ and justification for {ytjCandidate.name}.</p>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">DOJ</label>
              <input type="date" value={ytjDateOfJoining} onChange={(event) => setYtjDateOfJoining(event.target.value)} className="w-full rounded border px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Justification</label>
              <textarea rows={4} value={ytjJustification} onChange={(event) => setYtjJustification(event.target.value)} className="w-full rounded border p-3 text-sm" />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => { setYtjCandidate(null); setYtjDateOfJoining(''); setYtjJustification(''); }} className="rounded border px-4 py-2 text-sm">Cancel</button>
              <button
                onClick={async () => {
                  if (!ytjDateOfJoining) return alert('DOJ is required');
                  if (!ytjJustification.trim()) return alert('Justification is required');
                  await updateCandidateStatus(ytjCandidate.id, 'YET_TO_JOIN', { dateOfJoining: ytjDateOfJoining, ytjJustification });
                  setYtjCandidate(null);
                  setYtjDateOfJoining('');
                  setYtjJustification('');
                }}
                className="rounded bg-emerald-600 px-4 py-2 text-sm text-white"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {finalizeCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-[460px] space-y-4 rounded-xl bg-white p-6 shadow-lg">
            <h2 className="text-lg font-semibold">Finalize Candidate</h2>
            <p className="text-sm text-gray-600">DOJ matched for {finalizeCandidate.name}. Mark the final outcome.</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setFinalizeCandidate(null)} className="rounded border px-4 py-2 text-sm">Close</button>
              <button
                onClick={async () => {
                  await updateCandidateStatus(finalizeCandidate.id, 'ONBOARDED');
                  setFinalizeCandidate(null);
                }}
                className="rounded bg-emerald-600 px-4 py-2 text-sm text-white"
              >
                Onboarded
              </button>
              <button
                onClick={() => {
                  setDropCandidate(finalizeCandidate);
                  setDropJustification('');
                  setFinalizeCandidate(null);
                }}
                className="rounded bg-red-600 px-4 py-2 text-sm text-white"
              >
                Drop
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Info = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-[16px] bg-[#F8FAFC] px-4 py-3">
    <div className="text-xs font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">{label}</div>
    <div className="mt-1 text-sm font-medium text-[#0F172A]">{value}</div>
  </div>
);

const ActionButton = ({
  children,
  onClick,
  disabled,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) => (
  <button
    type="button"
    disabled={disabled}
    onClick={onClick}
    className={`rounded-[12px] px-4 py-2 text-sm font-medium disabled:opacity-50 ${
      danger ? 'border border-red-300 text-red-600' : 'bg-[#01A982] text-white'
    }`}
  >
    {children}
  </button>
);

const getStatusStyle = (status: CandidateStatus) => {
  if (['SCREEN_REJECTED', 'TECH_REJECTED', 'OPS_REJECTED', 'REJECTED', 'DROPPED'].includes(status)) {
    return 'bg-red-100 text-red-600';
  }
  if (['SCREEN_SELECTED', 'TECH_SELECTED', 'IDENTIFIED', 'OPS_SELECTED', 'SELECTED', 'ONBOARDED'].includes(status)) {
    return 'bg-green-100 text-green-600';
  }
  if (status === 'YET_TO_JOIN') return 'bg-amber-100 text-amber-700';
  return 'bg-yellow-100 text-yellow-700';
};

export default Candidates;
