import { useEffect, useState } from 'react';

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

import type {
  DashboardStats,
  SubmissionStat,
} from '../../services/dashboardService';

import { getDashboardStats } from '../../services/dashboardService';

/* ================= COLORS ================= */

const COLORS = [
  '#00a982',
  '#3b82f6',
  '#f59e0b',
  '#22c55e',
  '#ef4444',
  '#64748b',
];

const DashboardHome = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await getDashboardStats();
        setStats(data);
      } catch (err) {
        console.error('Failed to load dashboard stats', err);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  /* ================= KPI ================= */

  const kpis = stats?.kpis ?? {};

  const totalVendors = kpis.activeVendors ?? 0;
  const activeJobs = kpis.activeJobs ?? 0;
  const totalCandidates = kpis.totalCandidates ?? 0;

  /* ================= PIE DATA ================= */

  const stageData = Object.entries(stats?.stageSummary ?? {}).map(
    ([name, value]) => ({
      name,
      value: Number(value),
    }),
  );

  /* ================= BAR DATA ================= */

  const weeklySubmissions: SubmissionStat[] =
    stats?.submissionsByDate ?? [];

  const barData = weeklySubmissions.map((d) => ({
    date: d.label,
    count: d.count,
  }));

  return (
    <div className="space-y-10">

      {/* HEADER */}

      <div>
        <h1 className="text-2xl font-semibold text-gray-800">
          Vendor Manager Dashboard
        </h1>

        <p className="text-gray-500 mt-1">
          Overview of vendors, jobs, and candidate pipeline
        </p>
      </div>

      {loading && <p>Loading...</p>}

      {!loading && (
        <>
          {/* KPI CARDS */}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            <StatCard
              label="Active Vendors"
              value={totalVendors}
            />

            <StatCard
              label="Active Jobs"
              value={activeJobs}
            />

            <StatCard
              label="Total Candidates"
              value={totalCandidates}
            />

          </div>

          {/* CHART SECTION */}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* PIE CHART */}

            <div className="bg-white p-6 rounded-xl shadow border border-gray-200">

              <h2 className="text-lg font-semibold text-center mb-6">
                Candidate Stage Summary
              </h2>

              {stageData.length === 0 ? (
                <p className="text-sm text-gray-400 text-center">
                  No data available
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>

                    <Pie
                      data={stageData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={70}
                      outerRadius={120}
                      paddingAngle={4}
                    >
                      {stageData.map((_, index) => (
                        <Cell
                          key={index}
                          fill={
                            COLORS[index % COLORS.length]
                          }
                        />
                      ))}
                    </Pie>

                    <Tooltip />

                    <Legend verticalAlign="bottom" />

                  </PieChart>
                </ResponsiveContainer>
              )}

            </div>

            {/* BAR CHART */}

            <div className="bg-white p-6 rounded-xl shadow border border-gray-200">

              <h2 className="text-lg font-semibold text-center mb-6">
                Weekly Profile Submissions
              </h2>

              <ResponsiveContainer width="100%" height={350}>

                <BarChart data={barData}>

                  <CartesianGrid strokeDasharray="3 3" />

                  <XAxis dataKey="date" />

                  <YAxis allowDecimals={false} />

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

    <p className="text-sm text-gray-500">
      {label}
    </p>

    <p className="text-3xl font-semibold mt-2 text-gray-800">
      {value}
    </p>

  </div>
);