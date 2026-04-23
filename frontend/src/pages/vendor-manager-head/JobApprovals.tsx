import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getJobs } from '../../services/jobService';
import type { Job } from '../../services/jobService';

const JobApprovals = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    void loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      const all = await getJobs();
      const sorted = all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setJobs(sorted);
    } catch {
      console.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const getTotalPositions = (job: Job) => {
    const main = job.numberOfPositions || 0;
    const child = job.positions?.reduce((sum, p) => sum + (p.openings || 0), 0) || 0;
    return main + child;
  };

  const getClosedPositions = (job: Job) => {
    const mainClosed =
      Number(job.numberOfPositions || 0) - Number(job.currentNumberOfPositions ?? job.numberOfPositions ?? 0);
    const childClosed =
      job.positions?.reduce(
        (sum, p) => sum + (Number(p.openings || 0) - Number(p.currentOpenings ?? p.openings ?? 0)),
        0,
      ) || 0;
    return mainClosed + childClosed;
  };

  const getCurrentPositions = (job: Job) => getTotalPositions(job) - getClosedPositions(job);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-black">Job Approval Queue</h1>
        <p className="mt-1 text-gray-500">Review, approve or reject job requisitions</p>
      </div>

      <div className="space-y-4">
        {loading && <div className="rounded-[20px] bg-white p-8 shadow">Loading...</div>}

        {!loading &&
          jobs.map((job) => {
            const totalPositions = getTotalPositions(job);
            const currentPositions = getCurrentPositions(job);
            const progress = totalPositions ? Math.round(((totalPositions - currentPositions) / totalPositions) * 100) : 0;

            return (
              <button
                key={job.id}
                type="button"
                onClick={() => navigate(`/vendor-manager-head/jobs/${job.id}`)}
                className="w-full rounded-[24px] border border-black/8 bg-white p-6 text-left shadow-[0_8px_24px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(15,23,42,0.08)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-medium text-[#01A982]">{`HRQ${job.id}`}</span>
                      <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${getStatusClass(job.status)}`}>
                        <span className={`h-2.5 w-2.5 rounded-full ${getDotClass(job.status)}`} />
                        {formatStatus(job.status)}
                      </span>
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-[#0F172A]">{job.title}</h2>
                      <p className="mt-1 text-sm text-[#64748B]">{job.location} · Level {job.level || '-'}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-5">
                  <Info label="Total Positions" value={String(totalPositions)} />
                  <Info label="Current Positions" value={String(currentPositions)} />
                  <Info label="Created Date" value={job.createdAt ? job.createdAt.split('T')[0] : '-'} />
                  <Info label="Progress" value={`${progress}%`} />
                  <Info label="Status" value={formatStatus(job.status)} />
                </div>
              </button>
            );
          })}
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

const getStatusClass = (status: string) => {
  switch (status) {
    case 'APPROVED':
      return 'bg-green-100 text-green-700';
    case 'REJECTED':
      return 'bg-red-100 text-red-700';
    case 'PENDING_APPROVAL':
      return 'bg-yellow-100 text-yellow-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

const getDotClass = (status: string) => {
  switch (status) {
    case 'APPROVED':
      return 'bg-[#01A982]';
    case 'REJECTED':
      return 'bg-[#EF4444]';
    case 'PENDING_APPROVAL':
      return 'bg-[#F59E0B]';
    default:
      return 'bg-[#94A3B8]';
  }
};

export default JobApprovals;
