import { useEffect, useState } from 'react';
import api from '../../api/api';
import ResumeModal from '../../components/ResumeModal';
import EyeIcon from '../../components/EyeIcon';

export type CandidateStatus =
  | 'NEW'
  | 'SUBMITTED'
  | 'SCREENING'
  | 'TECH_SELECTED'
  | 'TECH_REJECTED'
  | 'OPS_SELECTED'
  | 'OPS_REJECTED';

interface Candidate {
  id: number;
  name: string;
  experience: number;
  status: CandidateStatus;
  resumePath: string;
  vendor?: { name?: string };
  job?: { title?: string };
}

const STATUS_OPTIONS: CandidateStatus[] = [
  'SCREENING',
  'TECH_SELECTED',
  'TECH_REJECTED',
  'OPS_SELECTED',
  'OPS_REJECTED',
];

const STATUS_LABELS: Record<CandidateStatus, string> = {
  NEW: 'New',
  SUBMITTED: 'Submitted',
  SCREENING: 'Screening',
  TECH_SELECTED: 'Tech Selected',
  TECH_REJECTED: 'Tech Rejected',
  OPS_SELECTED: 'Ops Selected',
  OPS_REJECTED: 'Ops Rejected',
};

const STATUS_COLORS: Record<CandidateStatus, string> = {
  NEW: 'bg-gray-100 text-gray-700',
  SUBMITTED: 'bg-indigo-100 text-indigo-700',
  SCREENING: 'bg-blue-100 text-blue-700',
  TECH_SELECTED: 'bg-green-100 text-green-700',
  TECH_REJECTED: 'bg-red-100 text-red-700',
  OPS_SELECTED: 'bg-green-200 text-green-800',
  OPS_REJECTED: 'bg-red-200 text-red-800',
};

const HMCandidates = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [resumeCandidateId, setResumeCandidateId] = useState<number | null>(null);

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const res = await api.get('/candidates');
      setCandidates(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">
        Hiring Manager – Candidate Pipeline
      </h1>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Vendor</th>
              <th className="px-4 py-3 text-left">Job</th>
              <th className="px-4 py-3 text-left">Experience</th>
              <th className="px-4 py-3 text-left">Resume</th>
              <th className="px-4 py-3 text-left">Stage</th>
            </tr>
          </thead>

          <tbody>
            {candidates.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="px-4 py-3">{c.name}</td>
                <td className="px-4 py-3">{c.vendor?.name || '—'}</td>
                <td className="px-4 py-3">{c.job?.title || '—'}</td>
                <td className="px-4 py-3">{c.experience} yrs</td>

                <td className="px-4 py-3">
                  <button
                    onClick={() => setResumeCandidateId(c.id)}
                    className="text-gray-600 hover:text-black transition"
                    title="View Resume"
                  >
                    <EyeIcon />
                  </button>
                </td>

                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 text-xs rounded ${STATUS_COLORS[c.status]}`}
                  >
                    {STATUS_LABELS[c.status]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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

export default HMCandidates;
