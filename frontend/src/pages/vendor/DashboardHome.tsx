import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  BriefcaseBusiness,
  CircleDot,
  Clock3,
  TrendingUp,
  UserRoundSearch,
  Users,
} from 'lucide-react';
import type {
  DashboardStats,
  SubmissionStat,
} from '../../services/dashboardService';
import { getDashboardStats } from '../../services/dashboardService';

const CHART_COLORS = [
  '#10b981',
  '#6366f1',
  '#ef4444',
  '#14b8a6',
  '#f59e0b',
  '#22c55e',
  '#06b6d4',
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
      } catch (error) {
        console.error('Failed to load dashboard stats', error);
      } finally {
        setLoading(false);
      }
    };

    void loadStats();
    const intervalId = window.setInterval(() => {
      void loadStats();
    }, 30000);

    return () => window.clearInterval(intervalId);
  }, []);

  const kpis = stats?.kpis ?? {};
  const activeCandidates = Number(kpis.activeCandidates ?? 0);
  const activeRequests = Number(kpis.openJobs ?? kpis.activeJobs ?? 0);
  const submissions = Number(kpis.submissions ?? 0);
  const activePartners = useMemo(() => {
    if (!stats) return 0;
    return activeCandidates > 0 || activeRequests > 0 || submissions > 0 ? 1 : 0;
  }, [activeCandidates, activeRequests, stats, submissions]);

  const stageData = useMemo(
    () =>
      Object.entries(stats?.stageSummary ?? {})
        .map(([name, value]) => ({
          name: formatStageLabel(name),
          value: Number(value),
        }))
        .filter((item) => item.value > 0),
    [stats?.stageSummary],
  );

  const weeklySubmissions: SubmissionStat[] = stats?.submissionsByDate ?? [];
  const barData = weeklySubmissions.map((item) => ({
    label: item.label,
    count: item.count,
  }));

  const totalWeeklySubmissions = weeklySubmissions.reduce(
    (sum, item) => sum + Number(item.count),
    0,
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-[2.3rem] font-semibold text-slate-900">Dashboard</h1>
        <p className="mt-2 text-base text-slate-600">
          Overview of your recruitment metrics
        </p>
      </div>

      {loading ? (
        <div className="rounded-3xl border border-white/70 bg-white/90 p-10 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
          <p className="text-sm text-slate-500">Loading dashboard...</p>
        </div>
      ) : (
        <>
          <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <MetricCard
              title="Active Partners"
              value={activePartners}
              helper="Active partnerships"
              helperClassName="text-emerald-500"
              icon={
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-[#01a982]">
                  <Users size={26} />
                </div>
              }
            />
            <MetricCard
              title="Active Candidates"
              value={activeCandidates}
              helper="In pipeline"
              helperClassName="text-blue-500"
              icon={
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-500">
                  <UserRoundSearch size={26} />
                </div>
              }
            />
            <MetricCard
              title="Active Requests"
              value={activeRequests}
              helper="Open positions"
              helperClassName="text-violet-500"
              icon={
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-violet-50 text-violet-500">
                  <BriefcaseBusiness size={26} />
                </div>
              }
            />
          </section>

          <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.05fr_1fr]">
            <div className="overflow-hidden rounded-[28px] border border-white/70 bg-white/95 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
              <div className="mb-6 flex items-center gap-2 text-slate-900">
                <CircleDot size={18} className="text-[#01a982]" />
                <h2 className="text-[1.6rem] font-semibold">Candidate Stage Summary</h2>
              </div>

              {stageData.length ? (
                <div className="grid gap-4 xl:grid-cols-[1fr_280px] xl:items-center">
                  <div className="h-[340px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stageData}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={70}
                          outerRadius={118}
                          paddingAngle={3}
                          stroke="white"
                          strokeWidth={3}
                        >
                          {stageData.map((entry, index) => (
                            <Cell
                              key={`${entry.name}-${index}`}
                              fill={CHART_COLORS[index % CHART_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            borderRadius: 14,
                            borderColor: '#e2e8f0',
                            boxShadow: '0 16px 40px rgba(15, 23, 42, 0.12)',
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-1">
                    {stageData.map((item, index) => (
                      <LegendItem
                        key={item.name}
                        color={CHART_COLORS[index % CHART_COLORS.length]}
                        label={item.name}
                        value={item.value}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <EmptyState message="No candidate stage data available yet." />
              )}
            </div>

            <div className="overflow-hidden rounded-[28px] border border-white/70 bg-white/95 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
              <div className="mb-6 flex items-center gap-2 text-slate-900">
                <TrendingUp size={18} className="text-[#01a982]" />
                <h2 className="text-[1.6rem] font-semibold">Weekly Profile Submissions</h2>
              </div>

              {barData.length ? (
                <>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barData} barCategoryGap={30}>
                        <CartesianGrid strokeDasharray="3 5" stroke="#e5e7eb" />
                        <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 13 }} />
                        <YAxis allowDecimals={false} tick={{ fill: '#64748b', fontSize: 13 }} />
                        <Tooltip
                          cursor={{ fill: 'rgba(1, 169, 130, 0.08)' }}
                          contentStyle={{
                            borderRadius: 14,
                            borderColor: '#e2e8f0',
                            boxShadow: '0 16px 40px rgba(15, 23, 42, 0.12)',
                          }}
                        />
                        <Bar dataKey="count" fill="#01a982" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="mt-5 rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-600">
                    Total submissions this week:{' '}
                    <span className="font-semibold text-slate-900">
                      {totalWeeklySubmissions}
                    </span>
                  </div>
                </>
              ) : (
                <EmptyState message="No weekly submission data available yet." />
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default DashboardHome;

const MetricCard = ({
  title,
  value,
  helper,
  helperClassName,
  icon,
}: {
  title: string;
  value: number;
  helper: string;
  helperClassName: string;
  icon: ReactNode;
}) => (
  <div className="rounded-[26px] border border-white/70 bg-white/95 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_28px_70px_rgba(15,23,42,0.18)]">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-slate-700">{title}</p>
        <p className="mt-2 text-[2.2rem] font-semibold leading-none text-slate-950">
          {value}
        </p>
      </div>
      {icon}
    </div>

    <div className={`mt-5 inline-flex items-center gap-2 text-sm ${helperClassName}`}>
      <Clock3 size={14} />
      <span>{helper}</span>
    </div>
  </div>
);

const LegendItem = ({
  color,
  label,
  value,
}: {
  color: string;
  label: string;
  value: number;
}) => (
  <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2">
    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
    <span className="min-w-0 flex-1 truncate text-sm text-slate-700">{label}</span>
    <span className="text-sm font-semibold text-slate-900">({value})</span>
  </div>
);

const EmptyState = ({ message }: { message: string }) => (
  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-14 text-center text-sm text-slate-400">
    {message}
  </div>
);

const formatStageLabel = (value: string) =>
  value
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
