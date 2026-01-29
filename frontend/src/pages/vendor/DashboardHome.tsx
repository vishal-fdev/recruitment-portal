// src/pages/vendor/DashboardHome.tsx
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

import type { DashboardStats } from '../../services/dashboardService';
import { getDashboardStats } from '../../services/dashboardService';

/* ------------------ STATIC FALLBACK DATA ------------------ */
/* UI stays SAME even if backend doesn’t send these yet */

const DEFAULT_STAGE_DATA = [
  { name: 'Screening', value: 0 },
  { name: 'Interviewing', value: 0 },
  { name: 'On Hold', value: 0 },
  { name: 'Onboarded', value: 0 },
  { name: 'Dropped', value: 0 },
  { name: 'Rejected', value: 0 },
];

const STAGE_COLORS = [
  '#10b981',
  '#3b82f6',
  '#f59e0b',
  '#22c55e',
  '#ef4444',
  '#64748b',
];

const DEFAULT_WEEKLY_SUBMISSIONS = [
  { day: 'Mon', count: 0 },
  { day: 'Tue', count: 0 },
  { day: 'Wed', count: 0 },
  { day: 'Thu', count: 0 },
  { day: 'Fri', count: 0 },
];

const DashboardHome = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalJobs: 0,
    activeJobs: 0,
  });

  const [stageData] = useState(DEFAULT_STAGE_DATA);
  const [weeklySubmissions] = useState(
    DEFAULT_WEEKLY_SUBMISSIONS,
  );

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">
          Dashboard
        </h1>
        <p className="text-sm text-gray-500">
          Overview of your recruitment metrics
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          label="Active Candidates"
          value={0} // backend not wired yet
        />
        <StatCard
          label="Open Jobs"
          value={stats.activeJobs}
        />
        <StatCard
          label="Submissions"
          value={0} // backend not wired yet
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Candidate Stage Summary */}
        <Card title="Candidate Stage Summary">
          <div className="h-72">
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
                        STAGE_COLORS[
                          index % STAGE_COLORS.length
                        ]
                      }
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="grid grid-cols-2 gap-2 mt-4 text-sm">
            {stageData.map((item, index) => (
              <div
                key={item.name}
                className="flex items-center gap-2"
              >
                <span
                  className="w-3 h-3 rounded-full"
                  style={{
                    backgroundColor:
                      STAGE_COLORS[index],
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
                <XAxis dataKey="day" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar
                  dataKey="count"
                  radius={[4, 4, 0, 0]}
                  fill="#10b981"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <p className="text-sm text-gray-500 mt-2">
            Total submissions this week: 0
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
    <p className="text-sm text-gray-500">
      {label}
    </p>
    <p className="text-3xl font-semibold mt-2">
      {value}
    </p>
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
    <h2 className="text-sm font-medium mb-4">
      {title}
    </h2>
    {children}
  </div>
);
