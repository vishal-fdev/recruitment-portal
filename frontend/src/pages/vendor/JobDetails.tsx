import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getJobDetails,
  type Job,
} from '../../services/jobService';

type TabType = 'DETAILS' | 'INTERVIEWS' | 'CALIBRATION';

const VendorJobDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('DETAILS');

  useEffect(() => {
    if (id) loadJob(Number(id));
  }, [id]);

  const loadJob = async (jobId: number) => {
    try {
      const data = await getJobDetails(jobId);

      if (data.interviewRounds) {
        data.interviewRounds = [...data.interviewRounds].sort(
          (a, b) => a.id - b.id,
        );
      }

      setJob(data);
    } catch (err) {
      console.error('Failed to fetch job');
    } finally {
      setLoading(false);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-gray-300 text-black';
      case 'ON_HOLD':
        return 'bg-yellow-100 text-yellow-700';
      case 'CLOSED':
        return 'bg-gray-200 text-gray-600';
      case 'REJECTED':
        return 'bg-gray-400 text-black';
      case 'PENDING_APPROVAL':
        return 'bg-gray-200 text-black';
      default:
        return 'bg-gray-200 text-black';
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!job) return <div>Job not found.</div>;

  return (
    <div className="space-y-6">

      {/* BACK BUTTON */}

      <button
        onClick={() => navigate('/vendor/jobs')}
        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition text-sm"
      >
        ← Back
      </button>

      {/* HEADER */}

      <div className="flex justify-between items-center">

        <h1 className="text-2xl font-semibold">
          HRQ{job.id}
        </h1>

        <span
          className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusStyle(
            job.status,
          )}`}
        >
          {job.status}
        </span>

      </div>

      {/* TAB BAR */}

      <div className="bg-gray-200 rounded-lg flex overflow-hidden text-sm font-medium">

        <TabButton
          label="Details"
          active={activeTab === 'DETAILS'}
          onClick={() => setActiveTab('DETAILS')}
        />

        <TabButton
          label="Interview Rounds"
          active={activeTab === 'INTERVIEWS'}
          onClick={() => setActiveTab('INTERVIEWS')}
        />

        <TabButton
          label="Calibration"
          active={activeTab === 'CALIBRATION'}
          onClick={() => setActiveTab('CALIBRATION')}
        />

      </div>

      {/* ================= DETAILS TAB ================= */}

      {activeTab === 'DETAILS' && (

        <div className="space-y-6">

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Hiring Info */}

            <div className="bg-white rounded-xl shadow border border-gray-200">

              <div className="px-6 py-4 border-b font-medium text-gray-700">
                Hiring Information
              </div>

              <div className="p-6 space-y-4 text-sm">

                <InfoRow label="HRQ ID" value={`HRQ${job.id}`} />

                <InfoRow label="Role Hired For" value={job.title} />

                <InfoRow label="Business" value={job.department || '-'} />

                <InfoRow label="Request Assigned Date" value={job.startDate || '-'} />

              </div>

            </div>

            {/* Job Info */}

            <div className="bg-white rounded-xl shadow border border-gray-200">

              <div className="px-6 py-4 border-b font-medium text-gray-700">
                Job Information
              </div>

              <div className="p-6 space-y-4 text-sm">

                <InfoRow label="Location" value={job.location} />

                <InfoRow label="Experience" value={job.experience} />

                <InfoRow label="Employment Type" value={job.employmentType || '-'} />

                <InfoRow label="Budget" value={job.budget || '-'} />

                <InfoRow label="Start Date" value={job.startDate || '-'} />

                <InfoRow label="End Date" value={job.endDate || '-'} />

              </div>

            </div>

          </div>

          {/* Job Description */}

          <div className="bg-white rounded-xl shadow border border-gray-200">

            <div className="px-6 py-4 border-b font-medium text-gray-700">
              Job Description
            </div>

            <div className="p-6 text-sm text-gray-700 whitespace-pre-line">
              {job.description || 'No description provided.'}
            </div>

          </div>

        </div>

      )}

      {/* ================= INTERVIEW TAB ================= */}

      {activeTab === 'INTERVIEWS' && (

        <div className="space-y-4">

          {job.interviewRounds && job.interviewRounds.length > 0 ? (

            job.interviewRounds.map((round, index) => (

              <div
                key={round.id}
                className="bg-white rounded-xl shadow border border-gray-200 p-6"
              >

                <div className="flex items-center gap-4 mb-4">

                  <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-sm font-semibold">
                    {index + 1}
                  </div>

                  <div>
                    <div className="font-medium">
                      {round.roundName}
                    </div>

                    <div className="text-xs text-gray-500">
                      {round.mode || 'N/A'}
                    </div>
                  </div>

                </div>

                <div className="text-sm text-gray-600 mb-2">
                  Panel Members
                </div>

                <div className="flex flex-wrap gap-2">

                  {round.panels.map((panel) => (

                    <span
                      key={panel.id}
                      className="px-3 py-1 bg-gray-200 rounded-full text-xs"
                    >
                      {panel.name}
                    </span>

                  ))}

                </div>

              </div>

            ))

          ) : (

            <div className="bg-white rounded-xl shadow border border-gray-200 p-10 text-center text-gray-500">
              No interview rounds configured.
            </div>

          )}

        </div>

      )}

      {/* ================= CALIBRATION TAB ================= */}

      {activeTab === 'CALIBRATION' && (

        <div className="bg-white rounded-xl shadow border border-gray-200 p-8">

          {job.calibrationNotes ? (

            <div className="whitespace-pre-line text-sm text-gray-700">
              {job.calibrationNotes}
            </div>

          ) : (

            <div className="text-center text-gray-500 text-sm">
              No calibration pointers available for this job.
            </div>

          )}

        </div>

      )}

    </div>
  );
};

export default VendorJobDetails;

/* TAB BUTTON */

const TabButton = ({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`flex-1 py-3 transition ${
      active
        ? 'bg-white text-black'
        : 'text-gray-600 hover:bg-gray-300'
    }`}
  >
    {label}
  </button>
);

/* INFO ROW */

const InfoRow = ({
  label,
  value,
}: {
  label: string;
  value: string;
}) => (
  <div className="flex justify-between">
    <span className="text-gray-600">{label}</span>
    <span className="font-medium">{value}</span>
  </div>
);
