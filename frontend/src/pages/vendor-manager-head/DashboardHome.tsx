import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getJobs } from '../../services/jobService';
import type { Job } from '../../services/jobService';

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

const COLORS = [
  '#00a982',
  '#f59e0b',
  '#ef4444',
  '#6366f1',
];

const DashboardHome = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getJobs()
      .then(setJobs)
      .finally(() => setLoading(false));
  }, []);

  /* ================= KPI CALCULATIONS ================= */

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

  /* ================= PIE DATA ================= */

  const pieData = [
    { name: 'Pending', value: pending },
    { name: 'Approved', value: approved },
    { name: 'Rejected', value: rejected },
  ];

  /* ================= BAR DATA (Jobs per Date) ================= */

  const jobsByDateMap: Record<string, number> = {};

  jobs.forEach((job) => {
    const date = new Date(job.createdAt).toLocaleDateString(
      'en-IN',
    );
    jobsByDateMap[date] =
      (jobsByDateMap[date] || 0) + 1;
  });

  const barData = Object.entries(jobsByDateMap).map(
    ([date, count]) => ({
      date,
      count,
    }),
  );

  return (
    <div className="space-y-10">

      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-800">
          Vendor Manager Head Dashboard
        </h1>
        <p className="text-gray-500 mt-1">
          Job requisition approvals & governance
        </p>
      </div>

      {loading && <p>Loading...</p>}

      {!loading && (
        <>
          {/* KPI CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard label="Total Jobs" value={total} />
            <StatCard label="Pending Approval" value={pending} />
            <StatCard label="Approved" value={approved} />
            <StatCard label="Rejected" value={rejected} />
          </div>

          {/* CHART SECTION */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* PIE CHART */}
            <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
              <h2 className="text-lg font-semibold text-center mb-6">
                Job Status Distribution
              </h2>

              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={70}
                    outerRadius={120}
                    paddingAngle={4}
                  >
                    {pieData.map((_, index) => (
                      <Cell
                        key={index}
                        fill={
                          COLORS[
                            index % COLORS.length
                          ]
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* BAR CHART */}
            <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
              <h2 className="text-lg font-semibold text-center mb-6">
                Jobs Created Per Day
              </h2>

              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar
                    dataKey="count"
                    fill="#00a982"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

          </div>

          {/* CTA */}
          <div className="bg-white rounded-lg shadow p-6 flex items-center justify-between border border-gray-200">
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
              className="bg-emerald-600 text-white px-5 py-2 rounded-md text-sm hover:bg-emerald-700 transition"
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

/* ================= KPI CARD ================= */

const StatCard = ({
  label,
  value,
}: {
  label: string;
  value: number;
}) => (
  <div className="bg-white rounded-xl shadow border border-gray-200 p-6 text-center">
    <p className="text-sm text-gray-500">{label}</p>
    <p className="text-3xl font-semibold mt-2 text-gray-800">
      {value}
    </p>
  </div>
);