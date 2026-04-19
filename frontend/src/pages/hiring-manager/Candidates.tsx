// src/pages/hiring-manager/Candidates.tsx

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
  experience: number;
  status: CandidateStatus;
  resumePath: string;

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
  TECH_SELECTED: 'Tech Selected',
  TECH_REJECTED: 'Tech Rejected',
  OPS_SELECTED: 'Ops Selected',
  OPS_REJECTED: 'Ops Rejected',
  ONBOARDED: 'Onboarded',
  DROPPED: 'Drop',
  REJECTED: 'Rejected',
  SELECTED: 'Selected',
};

const STATUS_COLORS: Record<CandidateStatus, string> = {
  NEW: 'bg-gray-100 text-gray-700',
  SUBMITTED: 'bg-indigo-100 text-indigo-700',
  SCREENING: 'bg-blue-100 text-blue-700',
  SCREEN_SELECTED: 'bg-blue-100 text-blue-700',
  SCREEN_REJECTED: 'bg-red-100 text-red-700',
  TECH_SELECTED: 'bg-green-100 text-green-700',
  TECH_REJECTED: 'bg-red-100 text-red-700',
  OPS_SELECTED: 'bg-green-200 text-green-800',
  OPS_REJECTED: 'bg-red-200 text-red-800',
  ONBOARDED: 'bg-green-100 text-green-700',
  DROPPED: 'bg-red-100 text-red-700',
  REJECTED: 'bg-red-100 text-red-700',
  SELECTED: 'bg-green-100 text-green-700',
};

const EyeIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="w-5 h-5 text-gray-600 hover:text-emerald-600 transition"
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
      d="M2.458 12C3.732 7.943 7.523 5 12 5
         c4.477 0 8.268 2.943 9.542 7
         -1.274 4.057-5.065 7-9.542 7
         -4.477 0-8.268-2.943-9.542-7z"
    />
  </svg>
);

const HMCandidates = () => {
  const navigate = useNavigate();

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [resumeCandidateId, setResumeCandidateId] = useState<number | null>(null);

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const res = await api.get('/candidates');
      setCandidates(res.data);
    } catch {
      alert('Failed to load candidates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-800">
        Candidate Pipeline
      </h1>

      <div className="bg-white rounded-lg shadow overflow-x-auto border border-gray-200">
        <table className="w-full text-sm text-center">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Vendor</th>
              <th className="px-4 py-3">Job</th>
              <th className="px-4 py-3">Experience</th>
              <th className="px-4 py-3">Resume</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td colSpan={8} className="py-6 text-gray-500">
                  Loading…
                </td>
              </tr>
            )}

            {!loading &&
              candidates.map((c) => (
                <tr
                  key={c.id}
                  className="border-t hover:bg-gray-50 transition"
                >
                  {/* NAME CLICKABLE */}
                  <td
                    className="px-4 py-3 text-emerald-600 cursor-pointer hover:underline font-medium"
                    onClick={() => navigate(`../candidates/${c.id}`)}
                  >
                    {c.name}
                  </td>

                  <td className="px-4 py-3 text-gray-700">
                    {c.email || '—'}
                  </td>

                  <td className="px-4 py-3 text-gray-700">
                    {c.phone || '—'}
                  </td>

                  <td className="px-4 py-3 text-gray-700">
                    {c.vendor?.name || '—'}
                  </td>

                  <td className="px-4 py-3 text-gray-700">
                    {c.job?.title || '—'}
                  </td>

                  <td className="px-4 py-3 text-gray-700">
                    {c.experience} yrs
                  </td>

                  {/* RESUME ICON CENTERED */}
                  <td className="px-4 py-3">
                    <div className="flex justify-center">
                      <button
                        onClick={() => setResumeCandidateId(c.id)}
                        title="View Resume"
                      >
                        <EyeIcon />
                      </button>
                    </div>
                  </td>

                  {/* STATUS BADGE CENTERED */}
                  <td className="px-4 py-3">
                    <div className="flex justify-center">
                      <span
                        className={`px-3 py-1 text-xs rounded-full font-medium ${STATUS_COLORS[c.status]}`}
                      >
                        {STATUS_LABELS[c.status]}
                      </span>
                    </div>
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
