// src/pages/vendor-manager-head/DashboardHome.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getJobs } from '../../services/jobService';
import type { Job } from '../../services/jobService';

const DashboardHome = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getJobs()
      .then(setJobs)
      .finally(() => setLoading(false));
  }, []);

  const total = jobs.length;
  const pending = jobs.filter(
    (j) => j.status === 'PENDING_APPROVAL',
  ).length;
  const approved = jobs.filter(
    (j) => j.status === 'APPROVED',
  ).length;
  const rejected = jobs.filter(
    (j) => j.status === 'REJECTED',
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">
          Vendor Manager Head Dashboard
        </h1>
        <p className="text-sm text-gray-500">
          Job requisition approvals & governance
        </p>
      </div>

      {loading && <p>Loading...</p>}

      {!loading && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard label="Total Jobs" value={total} />
            <StatCard label="Pending Approval" value={pending} />
            <StatCard label="Approved" value={approved} />
            <StatCard label="Rejected" value={rejected} />
          </div>

          {/* CTA */}
          <div className="bg-white rounded-lg shadow p-6 flex items-center justify-between">
            <div>
              <h2 className="font-medium">
                Job Approval Queue
              </h2>
              <p className="text-sm text-gray-500">
                Review job details, JD and approve or reject
              </p>
            </div>

            <button
              onClick={() =>
                navigate('/vendor-manager-head/jobs')
              }
              className="bg-emerald-600 text-white px-4 py-2 rounded-md text-sm hover:bg-emerald-700"
            >
              View Job Approvals
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardHome;

/* ================= UI ================= */

const StatCard = ({
  label,
  value,
}: {
  label: string;
  value: number;
}) => (
  <div className="bg-white rounded-lg shadow p-6">
    <p className="text-sm text-gray-500">{label}</p>
    <p className="text-3xl font-semibold mt-2">{value}</p>
  </div>
);
