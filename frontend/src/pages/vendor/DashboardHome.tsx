import { useEffect, useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

import type { DashboardStats, SubmissionStat } from '../../services/dashboardService';
import { getDashboardStats } from '../../services/dashboardService';

/* ------------------ COLORS ------------------ */

const STAGE_COLORS = [
  '#10b981',
  '#3b82f6',
  '#f59e0b',
  '#22c55e',
  '#ef4444',
  '#64748b',
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

  /* ------------------ SAFE DERIVED DATA ------------------ */

  const kpis = stats?.kpis ?? {};

  const stageData = Object.entries(stats?.stageSummary ?? {}).map(
    ([name, value]) => ({
      name,
      value: Number(value),
    }),
  );

  const weeklySubmissions: SubmissionStat[] =
    stats?.submissionsByDate ?? [];

  const totalWeeklySubmissions = weeklySubmissions.reduce(
    (sum: number, d: SubmissionStat) => sum + d.count,
    0,
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-gray-500">
          Overview of your recruitment metrics
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          label="Active Candidates"
          value={kpis.activeCandidates ?? 0}
        />
        <StatCard
          label="Open Jobs"
          value={kpis.openJobs ?? kpis.activeJobs ?? 0}
        />
        <StatCard
          label="Submissions"
          value={kpis.submissions ?? 0}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stage Summary */}
        <Card title="Candidate Stage Summary">
          <div className="h-72">
            {stageData.length === 0 ? (
              <p className="text-sm text-gray-400 text-center pt-20">
                No data available
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stageData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={2}
                  >
                    {stageData.map((_, index) => (
                      <Cell
                        key={index}
                        fill={
                          STAGE_COLORS[index % STAGE_COLORS.length]
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Legend */}
          <div className="grid grid-cols-2 gap-2 mt-4 text-sm">
            {stageData.map((item, index) => (
              <div key={item.name} className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{
                    backgroundColor:
                      STAGE_COLORS[index % STAGE_COLORS.length],
                  }}
                />
                <span className="text-gray-600">
                  {item.name} ({item.value})
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Weekly Submissions */}
        <Card title="Weekly Profile Submissions">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklySubmissions}>
                <XAxis dataKey="label" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar
                  dataKey="count"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <p className="text-sm text-gray-500 mt-2">
            Total submissions this week: {totalWeeklySubmissions}
          </p>
        </Card>
      </div>
    </div>
  );
};

export default DashboardHome;

/* ------------------ UI HELPERS ------------------ */

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

const Card = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="bg-white rounded-lg shadow p-6">
    <h2 className="text-sm font-medium mb-4">{title}</h2>
    {children}
  </div>
);
