import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api';
import { authService } from '../../auth/authService';
import { downloadJD, downloadPSQ } from '../../services/jobService';

interface Job {
  id: number;
  title: string;
  location: string;
  level?: string;
  createdAt: string;
  status: string;
  numberOfPositions?: number;
  currentNumberOfPositions?: number;
  jdFileName?: string;
  psqFileName?: string;
  jdFiles?: { fileName: string; path: string; mimeType: string }[];
  psqFiles?: { fileName: string; path: string; mimeType: string }[];
}

const HMJobs = () => {
  const navigate = useNavigate();
  const role = authService.getRole();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchJobs = async () => {
    try {
      const res = await api.get('/jobs');
      setJobs(res.data || []);
    } catch {
      alert('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchJobs();
  }, []);

  const triggerDownload = (link: string) => {
    const anchor = document.createElement('a');
    anchor.href = link;
    anchor.target = '_blank';
    anchor.rel = 'noreferrer';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">My job openings</h1>
          <p className="text-sm text-gray-500">Create and manage job openings</p>
        </div>

        {role === 'HIRING_MANAGER' && (
          <button
            onClick={() => navigate('/hiring-manager/jobs/create')}
            className="rounded-[14px] bg-[#01A982] px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(1,169,130,0.18)]"
          >
            + Create Job
          </button>
        )}
      </div>

      <div className="space-y-4">
        {loading && <div className="rounded-[20px] bg-white p-8 shadow">Loading...</div>}

        {!loading &&
          jobs.map((job) => (
            <div
              key={job.id}
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/hiring-manager/jobs/${job.id}`)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  navigate(`/hiring-manager/jobs/${job.id}`);
                }
              }}
              className="w-full rounded-[24px] border border-black/8 bg-white p-6 text-left shadow-[0_8px_24px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(15,23,42,0.08)]"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-medium text-[#01A982]">{`HRQ${job.id}`}</span>
                    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${getStatusChipClass(job.status)}`}>
                      <span className={`h-2.5 w-2.5 rounded-full ${getStatusDotClass(job.status)}`} />
                      {formatStatus(job.status)}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-[#0F172A]">{job.title}</h2>
                    <p className="mt-1 text-sm text-[#64748B]">
                      {job.location} · Level {job.level || '-'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={!((job.jdFiles?.length ?? 0) > 0 || job.jdFileName)}
                    onClick={(event) => {
                      event.stopPropagation();
                      triggerDownload(downloadJD(job.id));
                    }}
                    className="rounded-[12px] bg-gray-800 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-gray-300"
                  >
                    Download JD
                  </button>
                  <button
                    type="button"
                    disabled={!((job.psqFiles?.length ?? 0) > 0 || job.psqFileName)}
                    onClick={(event) => {
                      event.stopPropagation();
                      triggerDownload(downloadPSQ(job.id));
                    }}
                    className="rounded-[12px] bg-gray-800 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-gray-300"
                  >
                    Download PSQ
                  </button>
                  {(job.status === 'PENDING_APPROVAL' || job.status === 'REJECTED') && (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        navigate(`/hiring-manager/edit-job/${job.id}`, {
                          state: { job },
                        });
                      }}
                      className="rounded-[12px] bg-[#01A982] px-4 py-2 text-sm font-semibold text-white"
                    >
                      Resubmit
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4">
                <Info label="Assigned Date" value={new Date(job.createdAt).toLocaleDateString('en-IN')} />
                <Info label="Total Positions" value={String(job.numberOfPositions ?? 0)} />
                <Info label="Current Positions" value={String(job.currentNumberOfPositions ?? job.numberOfPositions ?? 0)} />
                <Info label="Status" value={formatStatus(job.status)} />
              </div>
            </div>
          ))}

        {!loading && jobs.length === 0 && (
          <div className="rounded-[20px] bg-white p-10 text-center text-sm text-gray-500 shadow">No jobs found.</div>
        )}
      </div>
    </div>
  );
};

const Info = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-[16px] bg-[#F8FAFC] px-4 py-3">
    <div className="text-xs font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">{label}</div>
    <div className="mt-1 text-sm font-medium text-[#0F172A]">{value}</div>
  </div>
);

const formatStatus = (status: string) =>
  status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());

const getStatusDotClass = (status: string) => {
  if (status === 'APPROVED') return 'bg-[#01A982]';
  if (status === 'REJECTED') return 'bg-[#EF4444]';
  if (status === 'PENDING_APPROVAL') return 'bg-[#F59E0B]';
  return 'bg-[#94A3B8]';
};

const getStatusChipClass = (status: string) => {
  if (status === 'APPROVED') return 'bg-[#DDFBF2] text-[#0F766E]';
  if (status === 'REJECTED') return 'bg-[#FEE2E2] text-[#B91C1C]';
  if (status === 'PENDING_APPROVAL') return 'bg-[#FEF3C7] text-[#B45309]';
  return 'bg-[#E5E7EB] text-[#64748B]';
};

export default HMJobs;
