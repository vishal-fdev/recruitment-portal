import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import type { DashboardStats, SubmissionStat } from '../../services/dashboardService';
import { getDashboardStats } from '../../services/dashboardService';
import { getVendorCandidates } from '../../services/candidateService';
import { getJobs, type Job } from '../../services/jobService';

type CandidateRecord = {
  id: number;
  name: string;
  status: string;
  job?: {
    id: number;
    title: string;
  };
  createdAt?: string;
};

const CHART_COLORS = ['#01A982', '#00C98D', '#7F77DD', '#EF9F27', '#E24B4A', '#378ADD'];

const DashboardHome = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [candidates, setCandidates] = useState<CandidateRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        const [dashboardStats, vendorJobs, vendorCandidates] = await Promise.all([
          getDashboardStats(),
          getJobs(),
          getVendorCandidates(),
        ]);

        if (!mounted) return;

        setStats(dashboardStats);
        setJobs(vendorJobs || []);
        setCandidates(vendorCandidates || []);
      } catch (error) {
        console.error('Failed to load vendor dashboard', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void loadData();
    const interval = window.setInterval(() => {
      void loadData();
    }, 30000);

    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, []);

  const stageData = useMemo(
    () =>
      Object.entries(stats?.stageSummary ?? {})
        .filter(([, value]) => Number(value) > 0)
        .map(([status, value]) => ({
          name: formatStageLabel(status),
          value: Number(value),
          rawStatus: status,
        })),
    [stats],
  );

  const weeklySubmissions: SubmissionStat[] = stats?.submissionsByDate ?? [];

  const candidatesSubmitted = candidates.length;
  const assignedJobs = jobs.length;
  const submittedThisWeek = weeklySubmissions.reduce((sum, item) => sum + Number(item.count), 0);
  const jobsCreatedToday = jobs.filter((job) => isToday(job.createdAt)).length;
  const interviewStatuses = ['SCREEN_SELECTED', 'TECH_SELECTED', 'IDENTIFIED', 'SELECTED', 'YET_TO_JOIN'];
  const interviewCandidates = candidates.filter((candidate) => interviewStatuses.includes(candidate.status));
  const interviewJobsCount = new Set(interviewCandidates.map((candidate) => candidate.job?.id).filter(Boolean)).size;
  const offersPlaced = candidates.filter((candidate) => candidate.status === 'ONBOARDED').length;

  const assignedJobsList = [...jobs]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4);

  const candidateLiveStatus = [...candidates]
    .sort(
      (a, b) =>
        new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime(),
    )
    .slice(0, 4);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[26px] font-semibold leading-tight text-[#0F172A]">
          Vendor dashboard
        </h1>
        <div className="mt-2 flex items-center gap-2 text-[15px] text-[#6B7280]">
          <span className="h-2.5 w-2.5 rounded-full bg-[#96F7E4]" />
          <span>Live recruitment activity</span>
        </div>
      </div>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          accent="#01A982"
          title="ASSIGNED JOBS"
          value={loading ? '...' : assignedJobs}
          helper={`${jobsCreatedToday} new today`}
          helperColor="text-[#01A982]"
        />
        <StatCard
          accent="#3B82F6"
          title="CANDIDATES SUBMITTED"
          value={loading ? '...' : candidatesSubmitted}
          helper={`${submittedThisWeek} this week`}
          helperColor="text-[#01A982]"
        />
        <StatCard
          accent="#7C6CF2"
          title="IN INTERVIEW STAGE"
          value={loading ? '...' : interviewCandidates.length}
          helper={`Across ${interviewJobsCount} jobs`}
          helperColor="text-[#94A3B8]"
        />
        <StatCard
          accent="#F59E0B"
          title="OFFERS / PLACED"
          value={loading ? '...' : offersPlaced}
          helper="This quarter"
          helperColor="text-[#01A982]"
        />
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1.05fr_1fr]">
        <DashboardCard title="Candidate stage summary">
          {stageData.length ? (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_220px]">
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stageData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={68}
                      outerRadius={120}
                      paddingAngle={3}
                    >
                      {stageData.map((entry, index) => (
                        <Cell
                          key={`${entry.name}-${index}`}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-col justify-center gap-3">
                {stageData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-3">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                    />
                    <span className="flex-1 text-sm text-[#475569]">{entry.name}</span>
                    <span className="text-sm font-semibold text-[#0F172A]">{entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <EmptyState message="No candidate stage data available yet." heightClassName="h-[320px]" />
          )}
        </DashboardCard>

        <DashboardCard
          title="Assigned jobs"
          action={
            <button
              type="button"
              onClick={() => navigate('/vendor/candidates')}
              className="text-[13px] font-semibold text-[#01A982]"
            >
              View all
            </button>
          }
        >
          <div className="space-y-3">
            {assignedJobsList.length ? (
              assignedJobsList.map((job) => (
                <div
                  key={job.id}
                  onClick={() => navigate(`/vendor/jobs/${job.id}`)}
                  className="flex cursor-pointer items-center gap-3 rounded-[18px] border border-black/5 bg-[#F8FAFC] px-4 py-4 transition hover:bg-[#EEFDF9]"
                >
                  <div className="min-w-[110px] text-[15px] text-[#7C8699]">{`JOB-${String(job.id).padStart(3, '0')}`}</div>
                  <div className="flex-1">
                    <div className="text-[16px] font-medium text-[#0F172A]">{job.title}</div>
                  </div>
                  <div className="min-w-[92px] text-[15px] text-[#94A3B8]">{job.location || '-'}</div>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      navigate(`/vendor/candidates/create?jobId=${job.id}`);
                    }}
                    className="rounded-[12px] bg-[#01A982] px-5 py-2 text-sm font-semibold text-white transition hover:shadow-md"
                  >
                    Submit
                  </button>
                </div>
              ))
            ) : (
              <EmptyState message="No assigned jobs available." heightClassName="h-[320px]" />
            )}
          </div>
        </DashboardCard>
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1.05fr_1fr]">
        <DashboardCard title="Weekly profile submissions">
          {weeklySubmissions.length ? (
            <div className="space-y-3">
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklySubmissions}>
                    <CartesianGrid strokeDasharray="4 4" stroke="#E2E8F0" />
                    <XAxis dataKey="label" tick={{ fill: '#64748B', fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#01A982" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="rounded-[14px] bg-[#F8FAFC] px-4 py-3 text-sm text-[#475569]">
                Total submissions this week: <span className="font-semibold text-[#0F172A]">{submittedThisWeek}</span>
              </div>
            </div>
          ) : (
            <EmptyState message="No weekly submission data available yet." heightClassName="h-[320px]" />
          )}
        </DashboardCard>

        <DashboardCard title="My candidates — live status">
          <div className="space-y-3">
            {candidateLiveStatus.length ? (
              candidateLiveStatus.map((candidate) => (
                <div
                  key={candidate.id}
                  onClick={() => navigate(`/vendor/candidates/${candidate.id}`)}
                  className="flex cursor-pointer items-center gap-4 rounded-[18px] border border-black/5 bg-white px-4 py-4 shadow-[0_1px_0_rgba(15,23,42,0.04)] transition hover:bg-[#F8FAFC]"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#F1F5F9] text-[16px] font-semibold uppercase text-[#6B7280]">
                    {getInitials(candidate.name)}
                  </div>
                  <div className="flex-1">
                    <div className="text-[16px] font-medium text-[#0F172A]">{candidate.name}</div>
                    <div className="text-[15px] text-[#94A3B8]">
                      {candidate.job ? `JOB-${String(candidate.job.id).padStart(3, '0')}` : 'No job assigned'}
                    </div>
                  </div>
                  <span className={`rounded-full px-4 py-2 text-sm font-medium ${getLiveStatusClass(candidate.status)}`}>
                    {formatLiveStatus(candidate.status)}
                  </span>
                </div>
              ))
            ) : (
              <EmptyState message="No live candidate activity yet." heightClassName="h-[320px]" />
            )}
          </div>
        </DashboardCard>
      </section>
    </div>
  );
};

const StatCard = ({
  title,
  value,
  helper,
  helperColor,
  accent,
}: {
  title: string;
  value: number | string;
  helper: string;
  helperColor: string;
  accent: string;
}) => (
  <div className="overflow-hidden rounded-[18px] border border-black/10 bg-white shadow-[0_2px_10px_rgba(15,23,42,0.04)]">
    <div className="h-1 w-full" style={{ backgroundColor: accent }} />
    <div className="px-7 py-5">
      <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[#9CA3AF]">{title}</p>
      <p className="mt-2 text-[42px] font-semibold leading-none tracking-[-0.03em] text-[#0F172A]">{value}</p>
      <p className={`mt-3 text-[14px] ${helperColor}`}>{helper}</p>
    </div>
  </div>
);

const DashboardCard = ({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) => (
  <div className="rounded-[22px] border border-black/10 bg-white px-7 py-6 shadow-[0_2px_12px_rgba(15,23,42,0.04)]">
    <div className="mb-5 flex items-center justify-between gap-4">
      <h2 className="text-[20px] font-semibold text-[#0F172A]">{title}</h2>
      {action}
    </div>
    {children}
  </div>
);

const EmptyState = ({
  message,
  heightClassName,
}: {
  message: string;
  heightClassName: string;
}) => (
  <div className={`flex items-center justify-center text-sm text-[#94A3B8] ${heightClassName}`}>
    {message}
  </div>
);

const formatStageLabel = (value: string) =>
  value
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());

const formatLiveStatus = (status: string) => {
  switch (status) {
    case 'IDENTIFIED':
      return 'Identified';
    case 'SCREEN_SELECTED':
      return 'Screen select';
    case 'SCREEN_REJECTED':
      return 'Screen reject';
    case 'TECH_SELECTED':
      return 'Tech select';
    case 'TECH_REJECTED':
      return 'Tech reject';
    case 'OPS_SELECTED':
      return 'Ops select';
    case 'OPS_REJECTED':
      return 'Ops reject';
    case 'ONBOARDED':
      return 'Onboarded';
    case 'DROPPED':
      return 'Drop';
    case 'YET_TO_JOIN':
      return 'YTJ';
    default:
      return formatStageLabel(status);
  }
};

const getLiveStatusClass = (status: string) => {
  switch (status) {
    case 'OPS_SELECTED':
    case 'IDENTIFIED':
      return 'bg-[#EFE7FF] text-[#6D28D9]';
    case 'SCREEN_SELECTED':
    case 'TECH_SELECTED':
      return 'bg-[#DDFBF2] text-[#0F766E]';
    case 'SUBMITTED':
      return 'bg-[#DBEAFE] text-[#1D4ED8]';
    case 'SCREEN_REJECTED':
    case 'TECH_REJECTED':
    case 'OPS_REJECTED':
    case 'DROPPED':
      return 'bg-[#FEE2E2] text-[#B91C1C]';
    case 'ONBOARDED':
      return 'bg-[#DCFCE7] text-[#15803D]';
    case 'YET_TO_JOIN':
      return 'bg-[#FEF3C7] text-[#B45309]';
    default:
      return 'bg-[#F1F5F9] text-[#475569]';
  }
};

const getInitials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

const isToday = (value?: string) => {
  if (!value) return false;
  const date = new Date(value);
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
};

export default DashboardHome;
