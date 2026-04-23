import { useEffect, useState } from 'react';
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
import api from '../../api/api';
import { getDashboardStats } from '../../services/dashboardService';
import type { DashboardStats, SubmissionStat } from '../../services/dashboardService';
import { getJobs, type Job } from '../../services/jobService';

type CandidateRecord = {
  id: number;
  name: string;
  status: string;
  createdAt?: string;
  job?: {
    id: number;
    title: string;
  };
};

const COLORS = ['#01A982', '#14B8A6', '#6366F1', '#F59E0B', '#EF4444', '#8B5CF6'];

const HiringManagerDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [candidates, setCandidates] = useState<CandidateRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        const [dashboardStats, allJobs, candidateResponse] = await Promise.all([
          getDashboardStats(),
          getJobs(),
          api.get('/candidates'),
        ]);

        if (!mounted) return;

        setStats(dashboardStats);
        setJobs(allJobs || []);
        setCandidates(candidateResponse.data || []);
      } catch (error) {
        console.error('Failed to load hiring manager dashboard', error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void loadData();
    const interval = window.setInterval(() => void loadData(), 30000);

    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, []);

  const createdThisWeek = jobs.filter((job) => isThisWeek(job.createdAt)).length;
  const pendingApprovals = jobs.filter((job) => job.status === 'PENDING_APPROVAL').length;
  const activeCandidates = candidates.length;
  const activeCandidatesThisWeek = candidates.filter((candidate) => isThisWeek(candidate.createdAt)).length;
  const offersExtended = candidates.filter((candidate) =>
    ['IDENTIFIED', 'YET_TO_JOIN', 'ONBOARDED'].includes(candidate.status),
  ).length;
  const offersToday = candidates.filter(
    (candidate) => ['IDENTIFIED', 'YET_TO_JOIN', 'ONBOARDED'].includes(candidate.status) && isToday(candidate.createdAt),
  ).length;

  const pieData = Object.entries(stats?.stageSummary ?? {})
    .filter(([, value]) => value > 0)
    .map(([status, value]) => ({
      name: formatStageLabel(status),
      value: Number(value),
    }));

  const barData: SubmissionStat[] = stats?.submissionsByDate ?? [];

  const recentJobs = [...jobs]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4);

  const candidateSummary = [
    { label: 'Screen select', value: countStatuses(candidates, ['SCREEN_SELECTED']), color: '#0F766E', bar: '#0F766E' },
    { label: 'Tech select', value: countStatuses(candidates, ['TECH_SELECTED']), color: '#166534', bar: '#166534' },
    { label: 'Ops select', value: countStatuses(candidates, ['OPS_SELECTED', 'IDENTIFIED']), color: '#6D28D9', bar: '#6D28D9' },
    { label: 'Submitted', value: countStatuses(candidates, ['SUBMITTED']), color: '#1D4ED8', bar: '#1D4ED8' },
    { label: 'Rejected', value: countStatuses(candidates, ['SCREEN_REJECTED', 'TECH_REJECTED', 'OPS_REJECTED', 'REJECTED', 'DROPPED']), color: '#B91C1C', bar: '#B91C1C' },
  ];
  const maxSummary = Math.max(...candidateSummary.map((item) => item.value), 1);

  const recentCandidateUpdates = [...candidates]
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .slice(0, 6);

  return (
    <div className="space-y-6">
      <section className="rounded-[24px] border border-black/8 bg-white px-10 py-7 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h1 className="text-[40px] font-semibold leading-tight tracking-[-0.04em] text-[#0F172A]">
              Hiring manager dashboard
            </h1>
            <p className="mt-2 text-[15px] text-[#64748B]">
              Q2 2026 · HPE India · Welcome back
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-[14px] border border-[#D6DCE5] bg-white px-5 py-3 text-[16px] font-medium text-[#475569]"
            >
              Export
            </button>
            <button
              type="button"
              onClick={() => navigate('/hiring-manager/jobs/create')}
              className="rounded-[14px] bg-[#01A982] px-6 py-3 text-[16px] font-semibold text-white shadow-[0_10px_20px_rgba(1,169,130,0.18)]"
            >
              + Create job opening
            </button>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <TopCard accent="#01A982" title="JOBS CREATED" value={loading ? '...' : jobs.length} helper={`${createdThisWeek} this week`} helperClassName="text-[#01A982]" />
          <TopCard accent="#3B82F6" title="PENDING APPROVAL" value={loading ? '...' : pendingApprovals} helper="Awaiting VM Head" helperClassName="text-[#94A3B8]" />
          <TopCard accent="#7C6CF2" title="ACTIVE CANDIDATES" value={loading ? '...' : activeCandidates} helper={`${activeCandidatesThisWeek} this week`} helperClassName="text-[#01A982]" />
          <TopCard accent="#F59E0B" title="OFFERS EXTENDED" value={loading ? '...' : offersExtended} helper={`${offersToday} today`} helperClassName="text-[#01A982]" />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.05fr_1fr]">
        <DashboardCard title="Candidate status distribution">
          {pieData.length ? (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={68} outerRadius={118} paddingAngle={3}>
                    {pieData.map((entry, index) => (
                      <Cell key={`${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState message="No candidate status data available yet." />
          )}
        </DashboardCard>

        <DashboardCard
          title="Recent job openings"
          action={<button type="button" onClick={() => navigate('/hiring-manager/jobs')} className="text-[14px] font-semibold text-[#01A982]">View all</button>}
        >
          <div className="space-y-3">
            {recentJobs.length ? recentJobs.map((job) => (
              <button
                key={job.id}
                type="button"
                onClick={() => navigate(`/hiring-manager/jobs/${job.id}`)}
                className="grid w-full grid-cols-[150px_1fr_110px_120px] items-center gap-3 rounded-[18px] bg-[#F1F5F9] px-5 py-4 text-left transition hover:bg-[#EAF1F7]"
              >
                <div className="font-mono text-[15px] text-[#7C8699]">{`JOB-${String(job.id).padStart(3, '0')}`}</div>
                <div className="truncate text-[16px] font-medium text-[#0F172A]">{job.title}</div>
                <div className="text-[15px] text-[#94A3B8]">{job.location || '-'}</div>
                <div className="text-right">
                  <span className={`inline-flex rounded-full px-4 py-2 text-[14px] font-medium ${getCardStatusClass(job.status)}`}>
                    {formatJobStatus(job.status)}
                  </span>
                </div>
              </button>
            )) : <EmptyState message="No recent jobs available yet." />}
          </div>
        </DashboardCard>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.05fr_1fr]">
        <DashboardCard title="Candidate submissions per day">
          {barData.length ? (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="4 4" stroke="#E2E8F0" />
                  <XAxis dataKey="label" tick={{ fill: '#64748B', fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#01A982" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : <EmptyState message="No submission data available yet." />}
        </DashboardCard>

        <DashboardCard title="Candidate status summary">
          <div className="space-y-5">
            {candidateSummary.map((item) => (
              <div key={item.label} className="grid grid-cols-[160px_1fr_34px] items-center gap-4">
                <div className="flex items-center gap-3 text-[15px] text-[#64748B]">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span>{item.label}</span>
                </div>
                <div className="h-4 rounded-full bg-[#E5E7EB]">
                  <div
                    className="h-4 rounded-full"
                    style={{ width: `${(item.value / maxSummary) * 100}%`, backgroundColor: item.bar }}
                  />
                </div>
                <div className="text-right text-[15px] font-medium text-[#0F172A]">{item.value}</div>
              </div>
            ))}
          </div>
        </DashboardCard>
      </section>

      <DashboardCard
        title="Recent candidate updates"
        action={<button type="button" onClick={() => navigate('/hiring-manager/candidates')} className="text-[14px] font-semibold text-[#01A982]">View all</button>}
      >
        <div className="overflow-hidden rounded-[18px] border border-black/6">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#F1F5F9]">
                <HeaderCell>ID</HeaderCell>
                <HeaderCell>NAME</HeaderCell>
                <HeaderCell>JOB</HeaderCell>
                <HeaderCell>STATUS</HeaderCell>
              </tr>
            </thead>
            <tbody>
              {recentCandidateUpdates.length ? recentCandidateUpdates.map((candidate, index) => (
                <tr
                  key={candidate.id}
                  className={`cursor-pointer border-t border-black/6 transition hover:bg-[#F8FAFC] ${index === 2 ? 'bg-[#F7FCFB]' : 'bg-white'}`}
                  onClick={() => navigate(`/hiring-manager/candidates/${candidate.id}`)}
                >
                  <BodyCell link>{`CND-${String(candidate.id).padStart(3, '0')}`}</BodyCell>
                  <BodyCell>{candidate.name}</BodyCell>
                  <BodyCell link>{candidate.job ? `JOB-${String(candidate.job.id).padStart(3, '0')}` : '-'}</BodyCell>
                  <BodyCell>
                    <span className={`inline-flex rounded-full px-4 py-2 text-[14px] font-medium ${getCandidateStatusClass(candidate.status)}`}>
                      {formatStageLabel(candidate.status)}
                    </span>
                  </BodyCell>
                </tr>
              )) : (
                <tr><td colSpan={4} className="py-16 text-center text-sm text-[#94A3B8]">No candidate updates available yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </DashboardCard>
    </div>
  );
};

const TopCard = ({ title, value, helper, helperClassName, accent }: { title: string; value: number | string; helper: string; helperClassName: string; accent: string }) => (
  <div className="overflow-hidden rounded-[18px] border border-black/8 bg-white shadow-[0_8px_20px_rgba(15,23,42,0.04)]">
    <div className="h-1 w-full" style={{ backgroundColor: accent }} />
    <div className="px-7 py-5">
      <div className="text-[14px] font-semibold uppercase tracking-[0.08em] text-[#A0A8B8]">{title}</div>
      <div className="mt-3 text-[40px] font-semibold leading-none tracking-[-0.04em] text-[#111827]">{value}</div>
      <div className={`mt-3 text-[15px] ${helperClassName}`}>{helper}</div>
    </div>
  </div>
);

const DashboardCard = ({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) => (
  <div className="rounded-[24px] border border-black/8 bg-white px-7 py-6 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
    <div className="mb-5 flex items-center justify-between gap-4">
      <h2 className="text-[18px] font-semibold tracking-[-0.02em] text-[#0F172A]">{title}</h2>
      {action}
    </div>
    {children}
  </div>
);

const HeaderCell = ({ children }: { children: React.ReactNode }) => (
  <th className="px-5 py-4 text-left text-[13px] font-semibold uppercase tracking-[0.08em] text-[#6B7280]">{children}</th>
);

const BodyCell = ({ children, link }: { children: React.ReactNode; link?: boolean }) => (
  <td className={`px-5 py-5 text-[16px] ${link ? 'font-medium text-[#01A982]' : 'text-[#0F172A]'}`}>{children}</td>
);

const EmptyState = ({ message }: { message: string }) => (
  <div className="flex h-[300px] items-center justify-center text-sm text-[#94A3B8]">{message}</div>
);

const formatStageLabel = (value: string) =>
  value.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());

const formatJobStatus = (status: string) => {
  switch (status) {
    case 'PENDING_APPROVAL':
      return 'Pending';
    case 'APPROVED':
      return 'Approved';
    case 'REJECTED':
      return 'Rejected';
    default:
      return formatStageLabel(status);
  }
};

const getCardStatusClass = (status: string) => {
  switch (status) {
    case 'APPROVED':
      return 'bg-[#DDFBF2] text-[#0F766E]';
    case 'REJECTED':
      return 'bg-[#FEE2E2] text-[#B91C1C]';
    case 'PENDING_APPROVAL':
      return 'bg-[#FEF3C7] text-[#B45309]';
    default:
      return 'bg-[#E5E7EB] text-[#64748B]';
  }
};

const getCandidateStatusClass = (status: string) => {
  if (['SCREEN_REJECTED', 'TECH_REJECTED', 'OPS_REJECTED', 'REJECTED', 'DROPPED'].includes(status)) {
    return 'bg-[#FEE2E2] text-[#B91C1C]';
  }
  if (['SCREEN_SELECTED', 'TECH_SELECTED'].includes(status)) {
    return 'bg-[#DDFBF2] text-[#0F766E]';
  }
  if (['OPS_SELECTED', 'IDENTIFIED'].includes(status)) {
    return 'bg-[#EFE7FF] text-[#6D28D9]';
  }
  return 'bg-[#DBEAFE] text-[#1D4ED8]';
};

const countStatuses = (candidates: CandidateRecord[], statuses: string[]) =>
  candidates.filter((candidate) => statuses.includes(candidate.status)).length;

const isThisWeek = (value?: string) => {
  if (!value) return false;
  const date = new Date(value);
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  return date >= startOfWeek;
};

const isToday = (value?: string) => {
  if (!value) return false;
  const date = new Date(value);
  const now = new Date();
  return date.toDateString() === now.toDateString();
};

export default HiringManagerDashboard;
