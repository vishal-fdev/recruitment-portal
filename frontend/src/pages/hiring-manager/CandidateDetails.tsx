import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/api';
import StageBadge from '../../components/StageBadge';
import { authService } from '../../auth/authService';

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

const HM_FLOW: CandidateStatus[] = [
  'SUBMITTED',
  'SCREEN_SELECTED',
  'TECH_SELECTED',
  'OPS_SELECTED',
];

const LEGACY_FLOW_MAP: Partial<Record<CandidateStatus, CandidateStatus>> = {
  NEW: 'SUBMITTED',
  SCREENING: 'SUBMITTED',
  TECH: 'SCREEN_SELECTED',
  OPS: 'TECH_SELECTED',
  SELECTED: 'OPS_SELECTED',
};

const CandidateDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const role = authService.getRole();

  const [candidate, setCandidate] = useState<any>(null);
  const [feedback, setFeedback] = useState('');
  const [showRejectBox, setShowRejectBox] = useState(false);
  const [showDropBox, setShowDropBox] = useState(false);
  const [loading, setLoading] = useState(false);

  const backRoute = useMemo(() => {
    const pathname = window.location.pathname;

    if (pathname.startsWith('/vendor-manager/')) {
      return '/vendor-manager/candidates';
    }

    if (pathname.startsWith('/vendor/')) {
      return '/vendor/candidates';
    }

    if (pathname.startsWith('/vendor-manager-head/')) {
      return '/vendor-manager-head/jobs';
    }

    if (pathname.startsWith('/hiring-manager/')) {
      return '/hiring-manager/candidates';
    }

    switch (role) {
      case 'VENDOR':
        return '/vendor/candidates';
      case 'VENDOR_MANAGER':
        return '/vendor-manager/candidates';
      case 'VENDOR_MANAGER_HEAD':
        return '/vendor-manager-head/jobs';
      default:
        return '/hiring-manager/candidates';
    }
  }, [role]);

  useEffect(() => {
    if (id) {
      void loadCandidate(id);
    }
  }, [id]);

  const loadCandidate = async (candidateId: string | number) => {
    const res = await api.get(`/candidates/${candidateId}`);
    setCandidate(res.data);
  };

  if (!candidate) return <div className="p-6">Loading...</div>;

  const normalizedStatus =
    LEGACY_FLOW_MAP[candidate.status as CandidateStatus] ||
    candidate.status;

  const currentStageIndex = HM_FLOW.findIndex(
    (stage) => stage === normalizedStatus,
  );

  const nextStage =
    currentStageIndex >= 0 ? HM_FLOW[currentStageIndex + 1] : null;

  const hmFinalStatuses: CandidateStatus[] = [
    'SCREEN_REJECTED',
    'TECH_REJECTED',
    'OPS_REJECTED',
    'OPS_SELECTED',
    'ONBOARDED',
    'DROPPED',
    'REJECTED',
    'SELECTED',
  ];

  const isFinalForHm = hmFinalStatuses.includes(candidate.status);
  const canHmEdit = role === 'HIRING_MANAGER' && !isFinalForHm;
  const canVmFinalize =
    role === 'VENDOR_MANAGER' &&
    ['OPS_SELECTED', 'ONBOARDED'].includes(candidate.status);

  const formatDate = (date: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString();
  };

  const submitHmDecision = async (decision: 'SELECT' | 'REJECT') => {
    let status: CandidateStatus | null = null;

    if (decision === 'REJECT') {
      if (!feedback.trim()) {
        alert('Rejection justification is mandatory');
        return;
      }

      if (normalizedStatus === 'SUBMITTED') status = 'SCREEN_REJECTED';
      if (normalizedStatus === 'SCREEN_SELECTED') status = 'TECH_REJECTED';
      if (normalizedStatus === 'TECH_SELECTED') status = 'OPS_REJECTED';
    } else {
      status = nextStage;
    }

    if (!status) {
      alert('No further status update is available');
      return;
    }

    setLoading(true);

    await api.patch(`/candidates/${candidate.id}/status`, {
      status,
      feedback,
    });

    await loadCandidate(candidate.id);
    setFeedback('');
    setShowRejectBox(false);
    setLoading(false);
  };

  const submitVendorManagerDecision = async (
    status: 'ONBOARDED' | 'DROPPED',
  ) => {
    if (status === 'DROPPED' && !feedback.trim()) {
      alert('Drop justification is mandatory');
      return;
    }

    setLoading(true);

    await api.patch(`/candidates/${candidate.id}/status`, {
      status,
      dropJustification: feedback,
    });

    await loadCandidate(candidate.id);
    setFeedback('');
    setShowDropBox(false);
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(backRoute)}
          className="bg-emerald-600 text-white px-4 py-1 rounded text-sm hover:bg-emerald-700 transition"
        >
          ← Back
        </button>

        <h1 className="text-2xl font-semibold text-gray-800">
          Candidate Details
        </h1>
      </div>

      <div className="bg-white rounded-xl shadow border border-gray-200 p-8 space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">
              {candidate.name}
            </h2>
          </div>

          <StageBadge status={candidate.status} />
        </div>

        <div className="grid grid-cols-3 gap-y-6 gap-x-10 text-sm">
          <Info label="Email" value={candidate.email} />
          <Info label="Phone" value={candidate.phone} />
          <Info
            label="Last Working Day"
            value={formatDate(candidate.lastWorkingDay)}
          />

          <Info label="Vendor" value={candidate.vendor?.name} />
          <Info label="Job" value={candidate.job?.title} />
          <Info label="Experience" value={`${candidate.experience} years`} />

          <Info
            label="Location"
            value={`${candidate.city || '-'}, ${candidate.state || '-'}`}
          />
          <Info
            label="Notice Period"
            value={`${candidate.noticePeriod} days`}
          />
          <Info
            label="Current Organization"
            value={candidate.currentOrg}
          />
        </div>

        <div className="grid grid-cols-2 gap-10 pt-6 border-t border-gray-200">
          <div>
            <p className="text-xs text-gray-500 mb-3 font-medium">
              Primary Skills
            </p>
            <SkillList skills={candidate.primarySkills} />
          </div>

          <div>
            <p className="text-xs text-gray-500 mb-3 font-medium">
              Secondary Skills
            </p>
            <SkillList skills={candidate.secondarySkills} />
          </div>
        </div>

        {candidate.status === 'DROPPED' && (
          <div className="pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500">Drop Justification</p>
            <p className="font-medium text-gray-800 mt-2">
              {candidate.dropJustification || '-'}
            </p>
          </div>
        )}

        {canHmEdit && (
          <div className="pt-6 border-t border-gray-200 space-y-4">
            <p className="text-sm font-semibold text-gray-700">
              Update Candidate Status ({candidate.status})
            </p>

            <div className="flex gap-4">
              <button
                disabled={loading}
                onClick={() => void submitHmDecision('SELECT')}
                className="px-5 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition"
              >
                Select
              </button>

              <button
                disabled={loading}
                onClick={() => setShowRejectBox(true)}
                className="px-5 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition"
              >
                Reject
              </button>
            </div>

            {showRejectBox && (
              <div className="space-y-3">
                <textarea
                  rows={4}
                  placeholder="Enter rejection justification..."
                  value={feedback}
                  onChange={(event) => setFeedback(event.target.value)}
                  className="w-full border rounded p-3 text-sm"
                />

                <button
                  disabled={loading}
                  onClick={() => void submitHmDecision('REJECT')}
                  className="bg-red-700 text-white px-5 py-2 rounded text-sm hover:bg-red-800 transition"
                >
                  Confirm Reject
                </button>
              </div>
            )}
          </div>
        )}

        {canVmFinalize && (
          <div className="pt-6 border-t border-gray-200 space-y-4">
            <p className="text-sm font-semibold text-gray-700">
              Finalize Candidate ({candidate.status})
            </p>

            <div className="flex gap-4">
              <button
                disabled={loading}
                onClick={() => void submitVendorManagerDecision('ONBOARDED')}
                className="px-5 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition"
              >
                Onboarded
              </button>

              <button
                disabled={loading}
                onClick={() => setShowDropBox(true)}
                className="px-5 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition"
              >
                Drop
              </button>
            </div>

            {showDropBox && (
              <div className="space-y-3">
                <textarea
                  rows={4}
                  placeholder="Enter drop justification..."
                  value={feedback}
                  onChange={(event) => setFeedback(event.target.value)}
                  className="w-full border rounded p-3 text-sm"
                />

                <button
                  disabled={loading}
                  onClick={() => void submitVendorManagerDecision('DROPPED')}
                  className="bg-red-700 text-white px-5 py-2 rounded text-sm hover:bg-red-800 transition"
                >
                  Confirm Drop
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow border border-gray-200 p-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-6">
          Evaluation Progress
        </h2>

        <div className="flex justify-between text-sm">
          {HM_FLOW.map((stage, index) => (
            <div
              key={stage}
              className="flex flex-col items-center flex-1"
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-xs ${
                  index < currentStageIndex
                    ? 'bg-green-600'
                    : index === currentStageIndex
                      ? 'bg-yellow-500'
                      : 'bg-gray-300'
                }`}
              >
                {index + 1}
              </div>

              <p className="mt-2 text-center text-xs">
                {stage.replace('_', ' ')}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CandidateDetails;

const Info = ({ label, value }: any) => (
  <div>
    <p className="text-xs text-gray-500">{label}</p>
    <p className="font-medium text-gray-800 mt-1">
      {value || '-'}
    </p>
  </div>
);

const SkillList = ({ skills }: { skills?: string }) => {
  if (!skills) {
    return <p className="text-sm text-gray-400">No skills listed</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {skills.split(',').map((skill: string, index: number) => (
        <span
          key={index}
          className="bg-teal-100 text-teal-700 text-xs px-3 py-1 rounded-full font-medium"
        >
          {skill.trim()}
        </span>
      ))}
    </div>
  );
};
