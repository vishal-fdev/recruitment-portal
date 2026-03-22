import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/api';
import StageBadge from '../../components/StageBadge';
import { authService } from '../../auth/authService';

const stages = [
  'SCREENING',
  'TECHNICAL_EVALUATION',
  'OPS_EVALUATION',
];

const CandidateDetails = () => {

  const { id } = useParams();
  const navigate = useNavigate();
  const role = authService.getRole();

  const [candidate, setCandidate] = useState<any>(null);
  const [feedback, setFeedback] = useState('');
  const [showRejectBox, setShowRejectBox] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) {
      api.get(`/candidates/${id}`).then(res => {
        setCandidate(res.data);
      });
    }
  }, [id]);

  if (!candidate) return <div className="p-6">Loading...</div>;

  const isFinal =
    candidate.status === 'REJECTED' ||
    candidate.status === 'SELECTED';

  const currentStageIndex = stages.findIndex(
    s => s === candidate.status
  );

  const nextStage = stages[currentStageIndex + 1];

  const canEdit =
    role === 'HIRING_MANAGER' && !isFinal;

  const formatDate = (date: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString();
  };

  const submitDecision = async (
    decision: 'SELECT' | 'REJECT'
  ) => {

    if (decision === 'REJECT' && !feedback.trim()) {
      alert('Rejection justification is mandatory');
      return;
    }

    setLoading(true);

    if (decision === 'REJECT') {
      await api.patch(`/candidates/${candidate.id}/status`, {
        status: 'REJECTED',
        feedback,
      });
    } else {

      if (!nextStage) {
        await api.patch(`/candidates/${candidate.id}/status`, {
          status: 'SELECTED',
        });
      } else {
        await api.patch(`/candidates/${candidate.id}/status`, {
          status: nextStage,
        });
      }

    }

    const res = await api.get(`/candidates/${candidate.id}`);
    setCandidate(res.data);
    setFeedback('');
    setShowRejectBox(false);
    setLoading(false);
  };

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex items-center gap-4">

        <button
          onClick={() => navigate('/hiring-manager/candidates')}
          className="bg-emerald-600 text-white px-4 py-1 rounded text-sm hover:bg-emerald-700 transition"
        >
          ← Back
        </button>

        <h1 className="text-2xl font-semibold text-gray-800">
          Candidate Details
        </h1>

      </div>

      {/* PROFILE CARD */}
      <div className="bg-white rounded-xl shadow border border-gray-200 p-8 space-y-6">

        <div className="flex justify-between items-start">

          <div>
            <h2 className="text-2xl font-semibold text-gray-900">
              {candidate.name}
            </h2>
          </div>

          <StageBadge status={candidate.status} />

        </div>

        {/* INFO GRID */}
        <div className="grid grid-cols-3 gap-y-6 gap-x-10 text-sm">

          <Info label="Email" value={candidate.email} />
          <Info label="Phone" value={candidate.phone} />
          <Info label="Last Working Day" value={formatDate(candidate.lastWorkingDay)} />

          <Info label="Vendor" value={candidate.vendor?.name} />
          <Info label="Job" value={candidate.job?.title} />
          <Info label="Experience" value={`${candidate.experience} years`} />

          <Info label="Location" value={`${candidate.city || '-'}, ${candidate.state || '-'}`} />
          <Info label="Notice Period" value={`${candidate.noticePeriod} days`} />
          <Info label="Current Organization" value={candidate.currentOrg} />

        </div>

        {/* SKILLS */}
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

        {/* ACTIONS */}
        {canEdit && (
          <div className="pt-6 border-t border-gray-200 space-y-4">

            <p className="text-sm font-semibold text-gray-700">
              Update Candidate Status ({candidate.status})
            </p>

            <div className="flex gap-4">

              <button
                disabled={loading}
                onClick={() => submitDecision('SELECT')}
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
                  onChange={e => setFeedback(e.target.value)}
                  className="w-full border rounded p-3 text-sm"
                />

                <button
                  disabled={loading}
                  onClick={() => submitDecision('REJECT')}
                  className="bg-red-700 text-white px-5 py-2 rounded text-sm hover:bg-red-800 transition"
                >
                  Confirm Reject
                </button>

              </div>

            )}

          </div>
        )}

      </div>

      {/* PROGRESS TRACKER */}
      <div className="bg-white rounded-xl shadow border border-gray-200 p-8">

        <h2 className="text-lg font-semibold text-gray-800 mb-6">
          Evaluation Progress
        </h2>

        <div className="flex justify-between text-sm">

          {stages.map((stage, index) => (

            <div
              key={stage}
              className="flex flex-col items-center flex-1"
            >

              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-xs
                ${
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

        {isFinal && (
          <div className="mt-6 text-sm text-red-600">
            Final decision made. Status cannot be changed.
          </div>
        )}

      </div>

    </div>
  );
};

export default CandidateDetails;

/* SMALL COMPONENTS */

const Info = ({ label, value }: any) => (
  <div>
    <p className="text-xs text-gray-500">{label}</p>
    <p className="font-medium text-gray-800 mt-1">
      {value || '-'}
    </p>
  </div>
);

const SkillList = ({ skills }: { skills?: string }) => {

  if (!skills)
    return <p className="text-sm text-gray-400">No skills listed</p>;

  return (
    <div className="flex flex-wrap gap-2">

      {skills.split(',').map((skill: string, i: number) => (

        <span
          key={i}
          className="bg-teal-100 text-teal-700 text-xs px-3 py-1 rounded-full font-medium"
        >
          {skill.trim()}
        </span>

      ))}

    </div>
  );
};