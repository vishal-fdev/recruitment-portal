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

const COLORS = [
  '#00a982',
  '#14b8a6',
  '#6366f1',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
];

const HiringManagerDashboard = () => {
  /* ===============================
     TEMP DATA (Replace with API Later)
  =============================== */

  const kpis = {
    openJobs: 12,
    totalCandidates: 87,
    interviews: 14,
  };

  const pieData = [
    { name: 'SCREENING', value: 20 },
    { name: 'TECHNICAL', value: 30 },
    { name: 'OPS', value: 10 },
    { name: 'SELECTED', value: 15 },
    { name: 'REJECTED', value: 12 },
  ];

  const barData = [
    { label: 'Mon', count: 5 },
    { label: 'Tue', count: 8 },
    { label: 'Wed', count: 6 },
    { label: 'Thu', count: 10 },
    { label: 'Fri', count: 4 },
  ];

  return (
    <div className="space-y-10">

      {/* HEADER */}
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
        <StatCard title="Open Jobs" value={kpis.openJobs} />
        <StatCard
          title="Candidates Received"
          value={kpis.totalCandidates}
        />
        <StatCard
          title="Interviews Scheduled"
          value={kpis.interviews}
        />
      </div>

      {/* CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* PIE CHART */}
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

        {/* BAR CHART */}
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

export default HiringManagerDashboard;

/* ================= KPI CARD ================= */

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