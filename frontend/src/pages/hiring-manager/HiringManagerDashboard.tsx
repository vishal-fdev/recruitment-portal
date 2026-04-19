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
import { getDashboardStats } from '../../services/dashboardService';
import type { DashboardStats } from '../../services/dashboardService';

const COLORS = [
  '#00a982',
  '#14b8a6',
  '#6366f1',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
];

const HiringManagerDashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadStats = async () => {
      try {
        const data = await getDashboardStats();
        if (isMounted) {
          setStats(data);
        }
      } catch (err) {
        console.error('Failed to load dashboard stats', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadStats();
    const interval = window.setInterval(() => {
      void loadStats();
    }, 30000);

    return () => {
      isMounted = false;
      window.clearInterval(interval);
    };
  }, []);

  const kpis = stats?.kpis ?? {};

  const pieData = Object.entries(stats?.stageSummary ?? {})
    .filter(([, value]) => value > 0)
    .map(([status, value]) => ({
      name: status.replace(/_/g, ' '),
      value,
    }));

  const barData = stats?.submissionsByDate ?? [];

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
        <StatCard
          title="Open Jobs"
          value={loading ? '...' : kpis.openJobs ?? 0}
        />
        <StatCard
          title="Candidates Received"
          value={loading ? '...' : kpis.totalCandidates ?? 0}
        />
        <StatCard
          title="Interviews Scheduled"
          value={loading ? '...' : kpis.interviews ?? 0}
        />
      </div>

      {/* CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* PIE CHART */}
        <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
          <h2 className="text-lg font-semibold text-center mb-6">
            Candidate Status Distribution
          </h2>
          {pieData.length ? (
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
          ) : (
            <div className="flex h-[350px] items-center justify-center text-sm text-gray-400">
              No candidate status data available yet.
            </div>
          )}
        </div>

        {/* BAR CHART */}
        <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
          <h2 className="text-lg font-semibold text-center mb-6">
            Candidate Submissions Per Day
          </h2>
          {barData.length ? (
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
          ) : (
            <div className="flex h-[350px] items-center justify-center text-sm text-gray-400">
              No submission data available yet.
            </div>
          )}
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
  value: number | string;
}) => (
  <div className="bg-white p-6 rounded-xl shadow border border-gray-200 text-center">
    <p className="text-sm text-gray-500">{title}</p>
    <p className="text-3xl font-semibold mt-2 text-gray-800">
      {value}
    </p>
  </div>
);
