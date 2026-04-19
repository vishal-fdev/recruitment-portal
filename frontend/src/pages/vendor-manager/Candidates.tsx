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

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedResumeUrl, setSelectedResumeUrl] =
    useState<string | null>(null);
  const [dropCandidate, setDropCandidate] = useState<Candidate | null>(null);
  const [dropJustification, setDropJustification] = useState('');
  const [updatingId, setUpdatingId] = useState<number | null>(null);

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

  const openResume = async (
    candidateId: number,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();

    try {
      const response = await api.get(
        `/candidates/${candidateId}/resume`,
        { responseType: 'blob' },
      );

      const blob = new Blob([response.data], {
        type: response.headers['content-type'],
      });

      const fileUrl = URL.createObjectURL(blob);
      setSelectedResumeUrl(fileUrl);
    } catch (error) {
      console.error('Failed to load resume', error);
    }
  };

  const closeModal = () => {
    if (selectedResumeUrl) {
      URL.revokeObjectURL(selectedResumeUrl);
    }
    setSelectedResumeUrl(null);
  };

  const updateCandidateStatus = async (
    candidateId: number,
    status: 'ONBOARDED' | 'DROPPED',
    justification?: string,
  ) => {
    try {
      setUpdatingId(candidateId);
      await api.patch(`/candidates/${candidateId}/status`, {
        status,
        dropJustification: justification,
      });
      await loadCandidates();
    } catch (error) {
      console.error('Failed to update candidate status', error);
      alert(`Failed to mark candidate as ${status.toLowerCase()}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusStyle = (status: CandidateStatus) => {
    if (
      ['SCREEN_REJECTED', 'TECH_REJECTED', 'OPS_REJECTED', 'REJECTED', 'DROPPED'].includes(
        status,
      )
    ) {
      return 'bg-red-100 text-red-600';
    }

    if (
      ['SCREEN_SELECTED', 'TECH_SELECTED', 'OPS_SELECTED', 'SELECTED', 'ONBOARDED'].includes(
        status,
      )
    ) {
      return 'bg-green-100 text-green-600';
    }

    return 'bg-yellow-100 text-yellow-700';
  };

  const canFinalize = (status: CandidateStatus) =>
    status === 'OPS_SELECTED' ||
    status === 'ONBOARDED' ||
    status === 'SELECTED';

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-800">
        Candidate Pipeline
      </h1>

      <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="px-6 py-3 text-center text-gray-600 font-medium">
                Name
              </th>
              <th className="px-6 py-3 text-center text-gray-600 font-medium">
                Email
              </th>
              <th className="px-6 py-3 text-center text-gray-600 font-medium">
                Contact
              </th>
              <th className="px-6 py-3 text-center text-gray-600 font-medium">
                Vendor
              </th>
              <th className="px-6 py-3 text-center text-gray-600 font-medium">
                Job
              </th>
              <th className="px-6 py-3 text-center text-gray-600 font-medium">
                Experience
              </th>
              <th className="px-6 py-3 text-center text-gray-600 font-medium">
                Resume
              </th>
              <th className="px-6 py-3 text-center text-gray-600 font-medium">
                Status
              </th>
              <th className="px-6 py-3 text-center text-gray-600 font-medium">
                Action
              </th>
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td colSpan={9} className="py-6 text-center">
                  Loading candidates...
                </td>
              </tr>
            )}

            {!loading &&
              candidates.map((candidate) => (
                <tr
                  key={candidate.id}
                  onClick={() =>
                    navigate(`/vendor-manager/candidates/${candidate.id}`)
                  }
                  className="border-t hover:bg-gray-50 cursor-pointer transition"
                >
                  <td className="px-6 py-4 text-center font-medium text-emerald-600">
                    {candidate.name}
                  </td>

                  <td className="px-6 py-4 text-center">
                    {candidate.email}
                  </td>

                  <td className="px-6 py-4 text-center">
                    {candidate.phone || '-'}
                  </td>

                  <td className="px-6 py-4 text-center">
                    {candidate.vendor?.name || '-'}
                  </td>

                  <td className="px-6 py-4 text-center">
                    {candidate.job?.title || '-'}
                  </td>

                  <td className="px-6 py-4 text-center">
                    {candidate.experience
                      ? `${candidate.experience} yrs`
                      : '-'}
                  </td>

                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={(event) =>
                        openResume(candidate.id, event)
                      }
                      className="text-gray-600 hover:text-black"
                    >
                      <Eye size={18} />
                    </button>
                  </td>

                  <td className="px-6 py-4 text-center">
                    <span
                      className={`px-3 py-1 text-xs rounded-full font-medium ${getStatusStyle(
                        candidate.status,
                      )}`}
                    >
                      {STATUS_LABELS[candidate.status] || candidate.status}
                    </span>
                  </td>

                  <td
                    className="px-6 py-4 text-center"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <div className="flex justify-center gap-2">
                      <button
                        disabled={
                          !canFinalize(candidate.status) ||
                          updatingId === candidate.id
                        }
                        onClick={() =>
                          updateCandidateStatus(candidate.id, 'ONBOARDED')
                        }
                        className="px-3 py-1 text-xs rounded bg-emerald-600 text-white disabled:opacity-50"
                      >
                        Onboarded
                      </button>
                      <button
                        disabled={
                          !canFinalize(candidate.status) ||
                          updatingId === candidate.id
                        }
                        onClick={() => {
                          setDropCandidate(candidate);
                          setDropJustification('');
                        }}
                        className="px-3 py-1 text-xs rounded border border-red-300 text-red-600 disabled:opacity-50"
                      >
                        Drop
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {selectedResumeUrl && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white w-[85%] h-[85%] rounded-xl shadow-lg relative">
            <button
              onClick={closeModal}
              className="absolute top-3 right-4 text-gray-600 hover:text-black text-xl"
            >
              ×
            </button>

            <iframe
              src={selectedResumeUrl}
              title="Resume Viewer"
              className="w-full h-full rounded-xl"
            />
          </div>
        </div>
      )}

      {dropCandidate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-[460px] p-6 space-y-4 shadow-lg">
            <h2 className="text-lg font-semibold">Drop Candidate</h2>
            <p className="text-sm text-gray-600">
              Enter the justification for dropping {dropCandidate.name}.
            </p>
            <textarea
              rows={5}
              value={dropJustification}
              onChange={(event) => setDropJustification(event.target.value)}
              className="w-full border rounded p-3 text-sm"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setDropCandidate(null);
                  setDropJustification('');
                }}
                className="px-4 py-2 border rounded text-sm"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!dropJustification.trim()) {
                    alert('Drop justification is required');
                    return;
                  }

                  await updateCandidateStatus(
                    dropCandidate.id,
                    'DROPPED',
                    dropJustification,
                  );
                  setDropCandidate(null);
                  setDropJustification('');
                }}
                className="px-4 py-2 bg-red-600 text-white rounded text-sm"
              >
                Confirm Drop
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Candidates;
