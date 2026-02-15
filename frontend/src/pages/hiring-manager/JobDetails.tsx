// src/pages/hiring-manager/JobDetails.tsx

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getJobDetails,
  type Job,
} from '../../services/jobService';

const JobDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState<Job | null>(null);

  useEffect(() => {
    if (id) {
      getJobDetails(Number(id)).then(setJob);
    }
  }, [id]);

  if (!job) {
    return (
      <div className="p-6 text-gray-500">
        Loading...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="text-emerald-600 font-medium"
      >
        ← Back
      </button>

      {/* HEADER */}
      <div className="bg-white p-6 rounded shadow">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold">
              HRQ{job.id} – {job.title}
            </h1>
            <p className="text-sm text-gray-500">
              {job.location}
            </p>
          </div>

          <StatusBadge status={job.status} />
        </div>
      </div>

      {/* JOB INFO */}
      <div className="grid grid-cols-2 gap-6">
        <Card title="Hiring Information">
          <Row label="Experience" value={job.experience} />
          <Row label="Department" value={job.department} />
          <Row label="Budget" value={job.budget} />
          <Row label="Start Date" value={job.startDate} />
          <Row label="End Date" value={job.endDate} />
        </Card>

        <Card title="Job Information">
          <Row
            label="Employment Type"
            value={job.employmentType}
          />
          <Row label="Status" value={job.status} />
          <Row
            label="Created On"
            value={new Date(
              job.createdAt,
            ).toLocaleDateString('en-IN')}
          />
        </Card>
      </div>

      {/* DESCRIPTION */}
      <Card title="Job Description">
        <p className="text-sm whitespace-pre-line">
          {job.description || '-'}
        </p>
      </Card>

      {/* INTERVIEW ROUNDS */}
      <Card title="Interview Rounds">
        {job.interviewRounds &&
        job.interviewRounds.length > 0 ? (
          job.interviewRounds.map((round: any) => (
            <div
              key={round.id}
              className="border rounded p-4 mb-4"
            >
              <h3 className="font-semibold text-sm mb-2">
                {round.roundName} ({round.mode})
              </h3>

              {round.panels?.length ? (
                <ul className="list-disc ml-5 text-sm">
                  {round.panels.map((panel: any) => (
                    <li key={panel.id}>
                      {panel.name}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 text-sm">
                  No panel members assigned
                </p>
              )}
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-500">
            No interview rounds configured
          </p>
        )}
      </Card>
    </div>
  );
};

export default JobDetails;

/* ================= UI COMPONENTS ================= */

const Card = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="bg-white rounded shadow p-6">
    <h2 className="font-medium mb-4">{title}</h2>
    {children}
  </div>
);

const Row = ({
  label,
  value,
}: {
  label: string;
  value?: string;
}) => (
  <div className="flex justify-between text-sm py-1">
    <span className="text-gray-500">{label}</span>
    <span className="font-medium">
      {value || '-'}
    </span>
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
