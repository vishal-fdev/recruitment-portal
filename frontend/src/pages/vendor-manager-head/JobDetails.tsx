// src/pages/vendor-manager-head/JobDetails.tsx

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getJobDetails,
  approveJob,
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

  const role = localStorage.getItem('role');

  const canAddCalibration =
    role === 'HIRING_MANAGER' ||
    role === 'VENDOR_MANAGER' ||
    role === 'VENDOR_MANAGER_HEAD';

  const [calibrationNotes, setCalibrationNotes] = useState('');
  const [isEditingCalibration, setIsEditingCalibration] = useState(false);

  useEffect(() => {
    if (id) loadJob(Number(id));
  }, [id]);

  const loadJob = async (jobId: number) => {
    try {
      const data = await getJobDetails(jobId);

      if (data.interviewRounds) {
        data.interviewRounds = [...data.interviewRounds].sort(
          (a, b) => a.id - b.id
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
    console.log('Calibration saved:', calibrationNotes);
    setIsEditingCalibration(false);
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-gray-300 text-black';
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
        onClick={() => navigate('/vendor-manager-head/jobs')}
        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition text-sm"
      >
        ← Back
      </button>

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">
          HRQ{job.id}
        </h1>

        <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusStyle(job.status)}`}>
          {job.status}
        </span>
      </div>

      {/* APPROVAL */}
      {job.status === 'PENDING_APPROVAL' && (
        <div className="flex gap-4">
          <button
            onClick={handleApprove}
            disabled={actionLoading}
            className="px-6 py-2 bg-black text-white rounded-md hover:bg-gray-800"
          >
            Approve
          </button>

          <button
            onClick={handleReject}
            disabled={actionLoading}
            className="px-6 py-2 border border-black text-black rounded-md hover:bg-gray-100"
          >
            Reject
          </button>
        </div>
      )}

      {/* TABS */}
      <div className="bg-gray-200 rounded-lg flex overflow-hidden text-sm font-medium">
        <TabButton label="Details" active={activeTab === 'DETAILS'} onClick={() => setActiveTab('DETAILS')} />
        <TabButton label="Interview Rounds" active={activeTab === 'INTERVIEWS'} onClick={() => setActiveTab('INTERVIEWS')} />
        <TabButton label="Calibration" active={activeTab === 'CALIBRATION'} onClick={() => setActiveTab('CALIBRATION')} />
      </div>

      {/* ================= DETAILS ================= */}
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
                <InfoRow label="Created Date" value={job.createdAt?.split('T')[0] || '-'} />
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
                <InfoRow label="Work Type" value={job.workType || '-'} />
                <InfoRow label="Job Category" value={job.jobCategory || '-'} />
                <InfoRow label="Region" value={job.region || '-'} />
                <InfoRow label="Deal Name" value={job.dealName || '-'} />
                <InfoRow label="Start Date" value={job.startDate || '-'} />
                <InfoRow label="End Date" value={job.endDate || '-'} />
              </div>
            </div>

          </div>

          {/* POSITION DETAILS */}
<div className="bg-white rounded-xl shadow border border-gray-200">
  <div className="px-6 py-4 border-b font-medium text-gray-700">
    Position Details
  </div>

  <div className="p-6 space-y-6 text-sm">

    {/* MAIN POSITION */}
    <div className="border rounded p-4 bg-gray-50">
      <div className="font-semibold mb-2">Main Position</div>

      <InfoRow label="Request Type" value={job.requestType || '-'} />
      <InfoRow label="No. of Positions" value={String(job.numberOfPositions || '-')} />
      <InfoRow label="Level" value={job.level || '-'} />

      {job.requestType === 'BACKFILL' && (
        <>
          <InfoRow label="Employee ID" value={job.backfillEmployeeId || '-'} />
          <InfoRow label="Employee Name" value={job.backfillEmployeeName || '-'} />
        </>
      )}
    </div>

    {/* CHILD POSITIONS */}
    {job.positions && job.positions.length > 0 && (
      <div>
        <div className="font-semibold mb-3">Additional Positions</div>

        {job.positions.map((pos, index) => (
          <div key={pos.id} className="border rounded p-4 mb-3">

            <div className="font-medium mb-2">
              Position {index + 1}
            </div>

            <InfoRow label="Level" value={pos.level} />
            <InfoRow label="Openings" value={String(pos.openings)} />
            <InfoRow label="Request Type" value={pos.requestType || 'NEW'} />

            {pos.requestType === 'BACKFILL' && (
              <>
                <InfoRow label="Employee ID" value={pos.backfillEmployeeId || '-'} />
                <InfoRow label="Employee Name" value={pos.backfillEmployeeName || '-'} />
              </>
            )}

          </div>
        ))}

      </div>
    )}

  </div>
</div>

          {/* JUSTIFICATION */}
          <div className="bg-white rounded-xl shadow border border-gray-200">
            <div className="px-6 py-4 border-b font-medium text-gray-700">
              Justification
            </div>

            <div className="p-6 text-sm text-gray-700 whitespace-pre-line">
              {job.justification || 'No justification provided.'}
            </div>
          </div>

          {/* DESCRIPTION */}
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

      {/* ================= INTERVIEW ================= */}
      {activeTab === 'INTERVIEWS' && (
        <div className="space-y-4">
          {job.interviewRounds?.length ? (
            job.interviewRounds.map((round, index) => (
              <div key={round.id} className="bg-white rounded-xl shadow border p-6">

                <div className="flex items-center gap-4 mb-4">
                  <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-sm font-semibold">
                    {index + 1}
                  </div>

                  <div>
                    <div className="font-medium">{round.roundName}</div>
                    <div className="text-xs text-gray-500">{round.mode || 'N/A'}</div>
                  </div>
                </div>

                <div className="text-sm text-gray-600 mb-2">Panel Members</div>

                <div className="flex flex-wrap gap-2">
                  {round.panels.map((panel) => (
                    <span key={panel.id} className="px-3 py-1 bg-gray-200 rounded-full text-xs">
                      {panel.name} ({panel.email})
                    </span>
                  ))}
                </div>

              </div>
            ))
          ) : (
            <div className="bg-white rounded-xl shadow border p-10 text-center text-gray-500">
              No interview rounds configured.
            </div>
          )}
        </div>
      )}

      {/* ================= CALIBRATION ================= */}
      {activeTab === 'CALIBRATION' && (
        <div className="bg-white rounded-xl shadow border p-8">

          {!calibrationNotes && !isEditingCalibration && (
            <div className="text-center text-gray-500 space-y-4">
              <div className="text-lg font-medium">No Calibration Information</div>
              <div className="text-sm">
                No calibration sessions have been scheduled yet.
              </div>

              {canAddCalibration && (
                <button
                  onClick={() => setIsEditingCalibration(true)}
                  className="px-5 py-2 bg-black text-white rounded-md"
                >
                  Add Calibration Pointers
                </button>
              )}
            </div>
          )}

          {isEditingCalibration && (
            <div className="space-y-4">
              <textarea
                value={calibrationNotes}
                onChange={(e) => setCalibrationNotes(e.target.value)}
                rows={5}
                className="w-full border rounded-md p-3 text-sm"
              />

              <div className="flex gap-3">
                <button onClick={handleSaveCalibration} className="px-5 py-2 bg-black text-white rounded-md">
                  Save
                </button>

                <button onClick={() => setIsEditingCalibration(false)} className="px-5 py-2 border rounded-md">
                  Cancel
                </button>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};

export default JobDetails;

/* TAB BUTTON */
const TabButton = ({ label, active, onClick }: any) => (
  <button
    onClick={onClick}
    className={`flex-1 py-3 ${active ? 'bg-white text-black' : 'text-gray-600 hover:bg-gray-300'}`}
  >
    {label}
  </button>
);

/* INFO ROW */
const InfoRow = ({ label, value }: any) => (
  <div className="flex justify-between">
    <span className="text-gray-600">{label}</span>
    <span className="font-medium">{value}</span>
  </div>
);