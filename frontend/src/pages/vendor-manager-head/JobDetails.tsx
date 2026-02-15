// src/pages/vendor-manager-head/JobDetails.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  approveJob,
  rejectJob,
  downloadJD,
  getJobDetails,
  viewJD,
} from '../../services/jobService';
import RejectModal from './RejectModal';

const JobDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [rejecting, setRejecting] = useState(false);

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      try {
        const data = await getJobDetails(Number(id));
        setJob(data);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  if (loading) {
    return <div className="p-6">Loading job details…</div>;
  }

  if (!job) {
    return <div className="p-6 text-red-500">Job not found</div>;
  }

  const handleApprove = async () => {
    await approveJob(job.id);
    navigate('/vendor-manager-head');
  };

  const handleReject = async () => {
    await rejectJob(job.id);
    navigate('/vendor-manager-head');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">
          Job Requisition – JOB-{job.id}
        </h1>

        <StatusBadge status={job.status} />
      </div>

      {/* Basic Information */}
      <Section title="Basic Information">
        <Detail label="Title" value={job.title} />
        <Detail label="Location" value={job.location} />
        <Detail label="Experience" value={job.experience} />
        <Detail label="Department" value={job.department ?? '-'} />
      </Section>

      {/* Contract Information */}
      <Section title="Contract Details">
        <Detail label="Employment Type" value={job.employmentType ?? '-'} />
        <Detail label="Budget" value={job.budget ?? '-'} />
        <Detail label="Start Date" value={job.startDate ?? '-'} />
        <Detail label="End Date" value={job.endDate ?? '-'} />
      </Section>

      {/* Description */}
      <Section title="Job Description">
        <p className="text-sm text-gray-700 whitespace-pre-wrap">
          {job.description || 'No description provided'}
        </p>
      </Section>

      {/* JD Section */}
      {job.jdFileName && (
        <Section title="Attached JD">
          <div className="flex gap-6">
            <a
              href={viewJD(job.id)}
              target="_blank"
              className="text-blue-600 underline text-sm"
            >
              View JD
            </a>

            <a
              href={downloadJD(job.id)}
              className="text-emerald-600 underline text-sm"
            >
              Download JD
            </a>
          </div>
        </Section>
      )}

      {/* Approval Buttons */}
      {job.status === 'PENDING_APPROVAL' && (
        <div className="flex gap-4 pt-4">
          <button
            onClick={handleApprove}
            className="px-6 py-2 bg-emerald-600 text-white rounded-md"
          >
            Approve Job
          </button>

          <button
            onClick={() => setRejecting(true)}
            className="px-6 py-2 bg-red-600 text-white rounded-md"
          >
            Reject Job
          </button>
        </div>
      )}

      {rejecting && (
        <RejectModal
          jobId={job.id}
          onClose={() => setRejecting(false)}
          onRejected={handleReject}
        />
      )}
    </div>
  );
};

export default JobDetails;

/* ====================== UI COMPONENTS ====================== */

const Section = ({
  title,
  children,
}: {
  title: string;
  children: any;
}) => (
  <div className="bg-white rounded-lg shadow p-6 space-y-4">
    <h2 className="text-lg font-semibold border-b pb-2">
      {title}
    </h2>
    {children}
  </div>
);

const Detail = ({
  label,
  value,
}: {
  label: string;
  value: string;
}) => (
  <div className="flex justify-between text-sm">
    <span className="text-gray-500">{label}</span>
    <span className="font-medium">{value}</span>
  </div>
);

const StatusBadge = ({ status }: { status: string }) => {
  let styles = '';

  switch (status) {
    case 'PENDING_APPROVAL':
      styles = 'bg-yellow-100 text-yellow-700';
      break;
    case 'APPROVED':
      styles = 'bg-green-100 text-green-700';
      break;
    case 'REJECTED':
      styles = 'bg-red-100 text-red-700';
      break;
    case 'CLOSED':
      styles = 'bg-gray-200 text-gray-600';
      break;
    default:
      styles = 'bg-gray-200 text-gray-600';
  }

  return (
    <span
      className={`px-3 py-1 rounded text-xs font-medium ${styles}`}
    >
      {status.replace('_', ' ')}
    </span>
  );
};
