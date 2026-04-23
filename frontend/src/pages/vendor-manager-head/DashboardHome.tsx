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
import api from '../../api/api';
import { getJobs, type Job } from '../../services/jobService';

type CandidateRecord = {
  id: number;
  name: string;
  status: string;
  createdAt?: string;
  vendor?: {
    id?: string;
    name?: string;
  };
  job?: {
    id: number;
    title: string;
  };
};

type VendorRecord = {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
};

const CHART_COLORS = ['#EF4444', '#01A982', '#3B82F6', '#7C6CF2', '#F59E0B', '#27C3B8'];

const DashboardHome = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [candidates, setCandidates] = useState<CandidateRecord[]>([]);
  const [vendors, setVendors] = useState<VendorRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        const [jobsData, candidatesResponse, vendorsResponse] = await Promise.all([
          getJobs(),
          api.get('/candidates'),
          api.get('/vendors'),
        ]);

        if (!mounted) return;

        setJobs(jobsData || []);
        setCandidates(candidatesResponse.data || []);
        setVendors(vendorsResponse.data || []);
      } catch (error) {
        console.error('Failed to load vendor manager head dashboard', error);
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

  const pendingJobs = useMemo(
    () =>
      jobs
        .filter((job) => job.status === 'PENDING_APPROVAL')
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [jobs],
  );

  const approvedJobs = jobs.filter((job) => job.status === 'APPROVED').length;
  const activeVendors = vendors.filter((vendor) => vendor.isActive).length;
  const totalCandidates = candidates.length;
  const candidatesThisWeek = candidates.filter((candidate) => isThisWeek(candidate.createdAt)).length;

  const pieData = [
    { name: 'Pending', value: pendingJobs.length },
    { name: 'Approved', value: approvedJobs },
    { name: 'Rejected', value: jobs.filter((job) => job.status === 'REJECTED').length },
    { name: 'On Hold', value: jobs.filter((job) => job.status === 'ON_HOLD').length },
  ].filter((item) => item.value > 0);

  const barData = Object.entries(
    candidates.reduce<Record<string, number>>((acc, candidate) => {
      const label = candidate.createdAt
        ? new Date(candidate.createdAt).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
          })
        : 'Unknown';
      acc[label] = (acc[label] || 0) + 1;
      return acc;
    }, {}),
  )
    .map(([label, count]) => ({ label, count }))
    .slice(-7);

  const vendorPerformance = vendors
    .map((vendor) => {
      const vendorCandidates = candidates.filter(
        (candidate) => candidate.vendor?.id === vendor.id || candidate.vendor?.name === vendor.name,
      );
      const submitted = vendorCandidates.length;
      const selected = vendorCandidates.filter((candidate) =>
        ['SCREEN_SELECTED', 'TECH_SELECTED', 'IDENTIFIED', 'YET_TO_JOIN', 'ONBOARDED'].includes(candidate.status),
      ).length;
      const rate = submitted ? Math.round((selected / submitted) * 100) : 0;

      return {
        id: vendor.id,
        name: vendor.name,
        submitted,
        selected,
        rate,
      };
    })
    .sort((a, b) => b.submitted - a.submitted)
    .slice(0, 5);

  const pipelineOverview = [...candidates]
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .slice(0, 6);

  return (
    <div className="space-y-6">
      <section className="rounded-[24px] border border-black/8 bg-white px-10 py-7 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
        <div>
          <h1 className="mt-1 text-[40px] font-semibold leading-tight tracking-[-0.04em] text-[#0F172A]">
            VM Head dashboard
          </h1>
          <p className="mt-2 text-[15px] text-[#64748B]">
            Q2 2026 · HPE India · Welcome back
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <TopCard
            accent="#EF4444"
            title="PENDING APPROVALS"
            value={loading ? '...' : pendingJobs.length}
            helper="Action needed"
            helperClassName="text-[#EF4444]"
          />
          <TopCard
            accent="#01A982"
            title="APPROVED JOBS"
            value={loading ? '...' : approvedJobs}
            helper={`${jobs.filter((job) => isThisWeek(job.createdAt) && job.status === 'APPROVED').length} this week`}
            helperClassName="text-[#01A982]"
          />
          <TopCard
            accent="#3B82F6"
            title="ACTIVE VENDORS"
            value={loading ? '...' : activeVendors}
            helper="All active"
            helperClassName="text-[#94A3B8]"
          />
          <TopCard
            accent="#7C6CF2"
            title="TOTAL CANDIDATES"
            value={loading ? '...' : totalCandidates}
            helper={`${candidatesThisWeek} this week`}
            helperClassName="text-[#01A982]"
          />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.05fr_1fr]">
        <DashboardCard title="Job status distribution">
          {pieData.length ? (
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_210px]">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={68}
                      outerRadius={118}
                      paddingAngle={3}
                    >
                      {pieData.map((entry, index) => (
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
                {pieData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-3 rounded-[14px] bg-[#F8FAFC] px-3 py-2">
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
            <EmptyState message="No job status data available yet." />
          )}
        </DashboardCard>

        <DashboardCard
          title="Jobs pending your approval"
          action={
            <button
              type="button"
              onClick={() => navigate('/vendor-manager-head/jobs')}
              className="text-[14px] font-semibold text-[#01A982]"
            >
              View all
            </button>
          }
        >
          <div className="space-y-3">
            {pendingJobs.length ? (
              pendingJobs.slice(0, 4).map((job) => (
                <button
                  key={job.id}
                  type="button"
                  onClick={() => navigate(`/vendor-manager-head/jobs/${job.id}`)}
                  className="grid w-full grid-cols-[150px_1fr_120px_110px] items-center gap-3 rounded-[18px] bg-[#F1F5F9] px-5 py-4 text-left transition hover:bg-[#EAF1F7]"
                >
                  <div className="font-mono text-[15px] text-[#01A982]">{`JOB-${String(job.id).padStart(3, '0')}`}</div>
                  <div className="truncate text-[16px] font-medium text-[#0F172A]">{job.title}</div>
                  <div className="text-[15px] text-[#64748B]">{job.createdAt ? formatShortDate(job.createdAt) : '-'}</div>
                  <div className="text-right">
                    <span className="inline-flex rounded-full bg-[#FEE2E2] px-4 py-2 text-[14px] font-medium text-[#B91C1C]">
                      Pending
                    </span>
                  </div>
                </button>
              ))
            ) : (
              <EmptyState message="No pending approvals right now." />
            )}
          </div>
        </DashboardCard>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.05fr_1fr]">
        <DashboardCard title="Candidate inflow">
          {barData.length ? (
            <div className="space-y-4">
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
              <div className="rounded-[14px] bg-[#F8FAFC] px-4 py-3 text-sm text-[#475569]">
                Total candidates in view: <span className="font-semibold text-[#0F172A]">{totalCandidates}</span>
              </div>
            </div>
          ) : (
            <EmptyState message="No candidate inflow data available yet." />
          )}
        </DashboardCard>

        <DashboardCard title="Vendor performance">
          <div className="overflow-hidden rounded-[18px] border border-black/6">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#F1F5F9]">
                  <HeaderCell>VENDOR</HeaderCell>
                  <HeaderCell center>SUBMITTED</HeaderCell>
                  <HeaderCell center>SELECTED</HeaderCell>
                  <HeaderCell center>RATE</HeaderCell>
                </tr>
              </thead>
              <tbody>
                {vendorPerformance.length ? (
                  vendorPerformance.map((vendor) => (
                    <tr
                      key={vendor.id}
                      className="cursor-pointer border-t border-black/6 bg-white transition hover:bg-[#F8FAFC]"
                      onClick={() => navigate(`/vendor-manager-head/vendors/${vendor.id}`)}
                    >
                      <BodyCell link>{vendor.name}</BodyCell>
                      <BodyCell center>{vendor.submitted}</BodyCell>
                      <BodyCell center>{vendor.selected}</BodyCell>
                      <BodyCell center>
                        <span className={`inline-flex rounded-full px-4 py-2 text-[14px] font-medium ${getRateClass(vendor.rate)}`}>
                          {vendor.rate}%
                        </span>
                      </BodyCell>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-16 text-center text-sm text-[#94A3B8]">
                      No vendor performance data available yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </DashboardCard>
      </section>

      <DashboardCard title="Pipeline overview">
        <div className="overflow-hidden rounded-[18px] border border-black/6">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#F1F5F9]">
                <HeaderCell>CANDIDATE</HeaderCell>
                <HeaderCell>JOB</HeaderCell>
                <HeaderCell>VENDOR</HeaderCell>
                <HeaderCell center>STATUS</HeaderCell>
              </tr>
            </thead>
            <tbody>
              {pipelineOverview.length ? (
                pipelineOverview.map((candidate) => (
                  <tr
                    key={candidate.id}
                    className="cursor-pointer border-t border-black/6 bg-white transition hover:bg-[#F8FAFC]"
                    onClick={() => navigate(`/vendor-manager-head/candidates/${candidate.id}`)}
                  >
                    <BodyCell link>{candidate.name}</BodyCell>
                    <BodyCell>{candidate.job?.title || '-'}</BodyCell>
                    <BodyCell>{candidate.vendor?.name || '-'}</BodyCell>
                    <BodyCell center>
                      <span className={`inline-flex rounded-full px-4 py-2 text-[14px] font-medium ${getCandidateStatusClass(candidate.status)}`}>
                        {formatStageLabel(candidate.status)}
                      </span>
                    </BodyCell>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-16 text-center text-sm text-[#94A3B8]">
                    No pipeline candidates available yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </DashboardCard>
    </div>
  );
};

const TopCard = ({
  title,
  value,
  helper,
  helperClassName,
  accent,
}: {
  title: string;
  value: number | string;
  helper: string;
  helperClassName: string;
  accent: string;
}) => (
  <div className="overflow-hidden rounded-[18px] border border-black/8 bg-white shadow-[0_8px_20px_rgba(15,23,42,0.04)]">
    <div className="h-1 w-full" style={{ backgroundColor: accent }} />
    <div className="px-7 py-5">
      <div className="text-[14px] font-semibold uppercase tracking-[0.08em] text-[#A0A8B8]">{title}</div>
      <div className="mt-3 text-[40px] font-semibold leading-none tracking-[-0.04em] text-[#111827]">{value}</div>
      <div className={`mt-3 text-[15px] ${helperClassName}`}>{helper}</div>
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
  <div className="rounded-[24px] border border-black/8 bg-white px-7 py-6 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
    <div className="mb-5 flex items-center justify-between gap-4">
      <h2 className="text-[18px] font-semibold tracking-[-0.02em] text-[#0F172A]">{title}</h2>
      {action}
    </div>
    {children}
  </div>
);

const HeaderCell = ({
  children,
  center,
}: {
  children: React.ReactNode;
  center?: boolean;
}) => (
  <th className={`px-5 py-4 text-[13px] font-semibold uppercase tracking-[0.08em] text-[#6B7280] ${center ? 'text-center' : 'text-left'}`}>
    {children}
  </th>
);

const BodyCell = ({
  children,
  center,
  link,
}: {
  children: React.ReactNode;
  center?: boolean;
  link?: boolean;
}) => (
  <td
    className={`px-5 py-5 text-[16px] ${center ? 'text-center' : 'text-left'} ${
      link ? 'font-medium text-[#01A982]' : 'text-[#0F172A]'
    }`}
  >
    {children}
  </td>
);

const EmptyState = ({ message }: { message: string }) => (
  <div className="flex h-[300px] items-center justify-center text-sm text-[#94A3B8]">{message}</div>
);

const formatStageLabel = (value: string) =>
  value
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());

const formatShortDate = (value: string) =>
  new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
  });

const getRateClass = (rate: number) => {
  if (rate >= 20) return 'bg-[#DDFBF2] text-[#0F766E]';
  if (rate >= 10) return 'bg-[#DBEAFE] text-[#1D4ED8]';
  return 'bg-[#E5E7EB] text-[#6B7280]';
};

const getCandidateStatusClass = (status: string) => {
  if (['SCREEN_REJECTED', 'TECH_REJECTED', 'OPS_REJECTED', 'REJECTED', 'DROPPED'].includes(status)) {
    return 'bg-[#FEE2E2] text-[#B91C1C]';
  }
  if (['SCREEN_SELECTED', 'TECH_SELECTED', 'IDENTIFIED', 'SELECTED', 'ONBOARDED', 'OPS_SELECTED'].includes(status)) {
    return 'bg-[#DDFBF2] text-[#0F766E]';
  }
  if (status === 'YET_TO_JOIN') {
    return 'bg-[#FEF3C7] text-[#B45309]';
  }
  return 'bg-[#DBEAFE] text-[#1D4ED8]';
};

const isThisWeek = (value?: string) => {
  if (!value) return false;
  const date = new Date(value);
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  return date >= startOfWeek;
};

export default DashboardHome;
