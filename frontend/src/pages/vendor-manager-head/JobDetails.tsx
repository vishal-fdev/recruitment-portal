import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/api';
import {
  approveJob,
  getJobDetails,
  rejectJob,
} from '../../services/jobService';
import type { Job } from '../../services/jobService';

type TabType = 'DETAILS' | 'INTERVIEWS' | 'CALIBRATION';

const JobDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('DETAILS');
  const [calibrationNotes, setCalibrationNotes] = useState('');
  const [isEditingCalibration, setIsEditingCalibration] = useState(false);

  useEffect(() => {
    if (id) {
      void loadJob(Number(id));
    }
  }, [id]);

  const loadJob = async (jobId: number) => {
    try {
      const data = await getJobDetails(jobId);

      const order = ['SCREENING', 'TECH', 'OPS'];
      if (data.interviewRounds) {
        data.interviewRounds = [...data.interviewRounds].sort(
          (a, b) => order.indexOf(a.roundName) - order.indexOf(b.roundName),
        );
      }

      setJob(data);
    } catch {
      console.error('Failed to fetch job');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!job) return;
    setActionLoading(true);
    await approveJob(job.id);
    await loadJob(job.id);
    setActionLoading(false);
  };

  const handleReject = async () => {
    if (!job) return;
    setActionLoading(true);
    await rejectJob(job.id);
    await loadJob(job.id);
    setActionLoading(false);
  };

  const handleSaveCalibration = () => {
    setIsEditingCalibration(false);
  };

  const handleFileDownload = async (
    path: string,
    fallbackFileName: string,
  ) => {
    try {
      const response = await api.get(path, {
        responseType: 'blob',
      });

      const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fallbackFileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('File download failed', error);
      alert('Failed to download file');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!job) return <div>Job not found.</div>;

  let hiringManagerName = job.hiringManager;
  if (!hiringManagerName) {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        hiringManagerName = payload.name || payload.email;
      }
    } catch {}
  }

  const formatSkills = (skills: unknown) => {
    if (!skills) return '-';
    if (Array.isArray(skills)) return skills.join(', ');
    return String(skills);
  };

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/vendor-manager-head/jobs')}
        className="px-4 py-2 bg-green-600 text-white rounded-md"
      >
        Back
      </button>

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">HRQ{job.id}</h1>
      </div>

      {job.status === 'PENDING_APPROVAL' && (
        <div className="flex gap-4">
          <button
            onClick={handleApprove}
            disabled={actionLoading}
            className="px-6 py-2 bg-black text-white rounded"
          >
            Approve
          </button>
          <button
            onClick={handleReject}
            disabled={actionLoading}
            className="px-6 py-2 border rounded"
          >
            Reject
          </button>
        </div>
      )}

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

      {activeTab === 'DETAILS' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card title="Hiring Information">
              <Row label="HRQ ID" value={`HRQ${job.id}`} />
              <Row label="Role" value={job.title} />
              <Row label="Hiring Manager" value={hiringManagerName} />
              <Row label="Business" value={job.department} />
              <Row label="Created Date" value={job.createdAt?.split('T')[0]} />
            </Card>

            <Card title="Job Information">
              <Row label="Location" value={job.location} />
              <Row label="Employment Type" value={job.employmentType} />
              <Row label="Work Type" value={job.workType} />
              <Row label="Category" value={job.jobCategory} />
              <Row label="Region" value={job.region} />
              <Row label="Deal" value={job.dealName} />
              <Row label="Start Date" value={job.startDate} />
              <Row label="End Date" value={job.endDate} />
              <Row label="Primary Skills" value={formatSkills(job.primarySkills)} />
              <Row label="Secondary Skills" value={formatSkills(job.secondarySkills)} />
            </Card>
          </div>

          <Card title="Position Details">
            <div className="mb-4">
              <h3 className="font-semibold mb-2">Main Position</h3>

              <Row label="Request Type" value={job.requestType} />
              <Row label="No. Positions" value={job.numberOfPositions} />
              <Row label="Level" value={job.level} />

              {job.requestType === 'BACKFILL' && (
                <>
                  <Row label="Employee ID" value={job.backfillEmployeeId} />
                  <Row label="Employee Name" value={job.backfillEmployeeName} />
                </>
              )}

              <div className="flex gap-3 mt-3">
                <DownloadButton
                  label="Download JD"
                  disabled={!job.jdFileName}
                  onClick={() =>
                    handleFileDownload(
                      `/jobs/${job.id}/jd/download`,
                      job.jdFileName || `JOB-${job.id}.pdf`,
                    )
                  }
                />
                <DownloadButton
                  label="Download PSQ"
                  disabled={!job.psqFileName}
                  onClick={() =>
                    handleFileDownload(
                      `/jobs/${job.id}/psq/download`,
                      job.psqFileName || `PSQ-${job.id}.pdf`,
                    )
                  }
                />
              </div>
            </div>

            {job.positions?.map((pos, index) => (
              <div key={pos.id} className="mb-4 border-t pt-4">
                <h4 className="font-medium mb-2">
                  Additional Position {index + 1}
                </h4>

                <Row label="Level" value={pos.level} />
                <Row label="Openings" value={pos.openings} />
                <Row label="Request Type" value={pos.requestType} />

                {pos.requestType === 'BACKFILL' && (
                  <>
                    <Row label="Employee ID" value={pos.backfillEmployeeId} />
                    <Row label="Employee Name" value={pos.backfillEmployeeName} />
                  </>
                )}

                <div className="flex gap-3 mt-3">
                  <DownloadButton
                    label="Download JD"
                    onClick={() =>
                      handleFileDownload(
                        `/jobs/positions/${pos.id}/jd/download`,
                        `POSITION-JD-${pos.id}.pdf`,
                      )
                    }
                  />
                  <DownloadButton
                    label="Download PSQ"
                    onClick={() =>
                      handleFileDownload(
                        `/jobs/positions/${pos.id}/psq/download`,
                        `POSITION-PSQ-${pos.id}.pdf`,
                      )
                    }
                  />
                </div>
              </div>
            ))}
          </Card>

          <Card title="Justification">
            <p className="text-sm">{job.justification || '-'}</p>
          </Card>
        </div>
      )}

      {activeTab === 'INTERVIEWS' && (
        <div className="space-y-4">
          {job.interviewRounds?.map((round, index) => (
            <div key={round.id} className="bg-white rounded-xl shadow border p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-sm font-semibold">
                  {index + 1}
                </div>

                <div>
                  <div className="font-medium">{round.roundName}</div>
                  <div className="text-xs text-gray-500">{round.mode}</div>
                </div>
              </div>

              <div className="text-sm text-gray-600 mb-2">Panel Members</div>

              <div className="flex flex-wrap gap-2">
                {round.panels.map((panel) => (
                  <span
                    key={panel.id}
                    className="px-3 py-1 bg-gray-200 rounded-full text-xs"
                  >
                    {panel.name} ({panel.email})
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'CALIBRATION' && (
        <div className="bg-white rounded-xl shadow border p-8 text-center">
          {!isEditingCalibration ? (
            <>
              <h2 className="text-lg font-medium mb-2">
                No Calibration Information
              </h2>

              <p className="text-sm text-gray-500 mb-4">
                No calibration sessions have been scheduled yet.
              </p>

              <button
                onClick={() => setIsEditingCalibration(true)}
                className="px-5 py-2 bg-black text-white rounded"
              >
                Add Calibration Pointers
              </button>
            </>
          ) : (
            <>
              <textarea
                value={calibrationNotes}
                onChange={(e) => setCalibrationNotes(e.target.value)}
                className="w-full border rounded p-3 mb-4"
              />

              <div className="flex justify-center gap-3">
                <button
                  onClick={handleSaveCalibration}
                  className="px-5 py-2 bg-black text-white rounded"
                >
                  Save
                </button>
                <button
                  onClick={() => setIsEditingCalibration(false)}
                  className="px-5 py-2 border rounded"
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default JobDetails;

const Card = ({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) => (
  <div className="bg-white rounded-xl shadow border border-gray-200">
    <div className="px-6 py-4 border-b font-medium">{title}</div>
    <div className="p-4">{children}</div>
  </div>
);

const Row = ({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) => (
  <div className="flex justify-between px-4 py-2 odd:bg-gray-200 even:bg-white rounded">
    <span className="text-gray-700">{label}</span>
    <span className="font-medium">{value || '-'}</span>
  </div>
);

const DownloadButton = ({
  label,
  onClick,
  disabled = false,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="px-3 py-1 bg-gray-800 text-white rounded text-sm hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed"
  >
    {label}
  </button>
);

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
    className={`flex-1 py-3 ${active ? 'bg-white font-semibold' : 'text-gray-600'}`}
  >
    {label}
  </button>
);
