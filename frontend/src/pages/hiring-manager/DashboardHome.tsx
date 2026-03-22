// src/pages/hiring-manager/DashboardHome.tsx

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

import type { DashboardStats } from '../../services/dashboardService';
import { getDashboardStats } from '../../services/dashboardService';

const COLORS = [
  '#00a982',
  '#14b8a6',
  '#6366f1',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
];

const DashboardHome = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await getDashboardStats();
        setStats(data);
      } catch (err) {
        console.error('Failed to load dashboard stats', err);
      }
    };

    loadStats();
  }, []);

  const kpis = stats?.kpis ?? {};

  /* =======================
     PIE DATA
  ======================= */

  const pieData =
    stats?.stageSummary &&
    Object.keys(stats.stageSummary).length > 0
      ? Object.entries(stats.stageSummary).map(
          ([status, count]) => ({
            name: status.replace('_', ' '),
            value: count,
          }),
        )
      : [
          { name: 'SCREENING', value: 10 },
          { name: 'TECHNICAL', value: 20 },
          { name: 'OPS', value: 5 },
          { name: 'SELECTED', value: 8 },
          { name: 'REJECTED', value: 6 },
        ];

  /* =======================
     BAR DATA
  ======================= */

  const barData =
    stats?.submissionsByDate && stats.submissionsByDate.length > 0
      ? stats.submissionsByDate
      : [
          { label: 'Mon', count: 5 },
          { label: 'Tue', count: 8 },
          { label: 'Wed', count: 6 },
          { label: 'Thu', count: 10 },
          { label: 'Fri', count: 4 },
        ];

  return (
    <div className="space-y-10">

      <div>
        <h1 className="text-2xl font-semibold text-gray-800">
          Hiring Manager Dashboard
        </h1>
        <p className="text-gray-500 mt-1">
          Overview of hiring pipeline and candidate progress
        </p>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Open Jobs" value={kpis.openJobs ?? 12} />
        <StatCard
          title="Candidates Received"
          value={kpis.totalCandidates ?? 87}
        />
        <StatCard
          title="Interviews Scheduled"
          value={kpis.interviews ?? 14}
        />
      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* PIE */}
        <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
          <h2 className="text-lg font-semibold text-center mb-6">
            Candidate Status Distribution
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
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* BAR */}
        <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
          <h2 className="text-lg font-semibold text-center mb-6">
            Candidate Submissions Per Day
          </h2>

          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
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
    </div>
  );
};

export default DashboardHome;

const StatCard = ({
  title,
  value,
}: {
  title: string;
  value: number;
}) => (
  <div className="bg-white p-6 rounded-xl shadow border border-gray-200 text-center">
    <p className="text-sm text-gray-500">{title}</p>
    <p className="text-3xl font-semibold mt-2 text-gray-800">
      {value}
    </p>
  </div>
);
<div style={{ background: 'red', height: '200px' }}>
  TEST BLOCK
</div>