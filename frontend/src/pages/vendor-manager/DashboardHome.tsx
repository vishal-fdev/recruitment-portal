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
import type { DashboardStats, SubmissionStat } from '../../services/dashboardService';
import { getDashboardStats } from '../../services/dashboardService';
import { getJobs, type Job } from '../../services/jobService';
import CreateVendorModal from './CreateVendorModal';

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
  isActive: boolean;
};

const CHART_COLORS = ['#01A982', '#27C3B8', '#7C6CF2', '#F59E0B', '#EF4444', '#3B82F6'];

const DashboardHome = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [candidates, setCandidates] = useState<CandidateRecord[]>([]);
  const [vendors, setVendors] = useState<VendorRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateVendor, setShowCreateVendor] = useState(false);

  const loadData = async () => {
    try {
      const [dashboardStats, vendorJobs, candidateResponse, vendorResponse] = await Promise.all([
        getDashboardStats(),
        getJobs(),
        api.get('/candidates'),
        api.get('/vendors'),
      ]);

      setStats(dashboardStats);
      setJobs(vendorJobs || []);
      setCandidates(candidateResponse.data || []);
      setVendors(vendorResponse.data || []);
    } catch (error) {
      console.error('Failed to load vendor manager dashboard', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
    const interval = window.setInterval(() => {
      void loadData();
    }, 30000);

    return () => {
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
        })),
    [stats],
  );

  const weeklySubmissions: SubmissionStat[] = stats?.submissionsByDate ?? [];
  const activeJobs = jobs.filter((job) => !['CLOSED', 'REJECTED'].includes(job.status)).length;
  const activeVendors = vendors.filter((vendor) => vendor.isActive).length;
  const candidatesInPool = candidates.length;
  const averageTimeToFill = getAverageDays(
    candidates.filter((candidate) => candidate.status === 'ONBOARDED').map((candidate) => candidate.createdAt),
  );

  const assignVendorJobs = [...jobs]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4);

  const vendorActivity = vendors
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
    .slice(0, 4);

  return (
    <div className="space-y-6">
      <section className="rounded-[24px] border border-black/8 bg-white px-10 py-7 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h1 className="mt-1 text-[40px] font-semibold leading-tight tracking-[-0.04em] text-[#0F172A]">
              Vendor Manager dashboard
            </h1>
            <p className="mt-2 text-[15px] text-[#64748B]">
              Q2 2026 · Live vendor operations · Welcome back
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowCreateVendor(true)}
            className="inline-flex items-center justify-center rounded-[14px] bg-[#01A982] px-6 py-3 text-[16px] font-semibold text-white shadow-[0_10px_20px_rgba(1,169,130,0.18)] transition hover:shadow-[0_14px_28px_rgba(1,169,130,0.24)]"
          >
            + Create vendor
          </button>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <TopCard
            accent="#01A982"
            title="ACTIVE JOBS"
            value={loading ? '...' : activeJobs}
            helper="Approved & live"
            helperClassName="text-[#94A3B8]"
          />
          <TopCard
            accent="#3B82F6"
            title="VENDORS ASSIGNED"
            value={loading ? '...' : activeVendors}
            helper="Across all jobs"
            helperClassName="text-[#01A982]"
          />
          <TopCard
            accent="#7C6CF2"
            title="CANDIDATES IN POOL"
            value={loading ? '...' : candidatesInPool}
            helper={`${weeklySubmissions.reduce((sum, item) => sum + Number(item.count), 0)} this week`}
            helperClassName="text-[#01A982]"
          />
          <TopCard
            accent="#F59E0B"
            title="AVG. TIME TO FILL"
            value={loading ? '...' : `${averageTimeToFill}d`}
            helper="Live average"
            helperClassName="text-[#EF4444]"
          />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.05fr_1fr]">
        <DashboardCard title="Candidate stage summary">
          {stageData.length ? (
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_210px]">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stageData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={68}
                      outerRadius={118}
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
            <EmptyState message="No candidate stage data available yet." />
          )}
        </DashboardCard>

        <DashboardCard title="Jobs — assign vendors">
          <div className="space-y-3">
            {assignVendorJobs.length ? (
              assignVendorJobs.map((job) => (
                <div
                  key={job.id}
                  onClick={() => navigate(`/vendor-manager/jobs/${job.id}`)}
                  className="grid cursor-pointer grid-cols-[126px_1fr_110px_110px] items-center gap-3 rounded-[18px] bg-[#F1F5F9] px-5 py-4 transition hover:bg-[#EAF2FF]"
                >
                  <div className="text-[15px] text-[#7C8699]">{`JOB-${String(job.id).padStart(3, '0')}`}</div>
                  <div className="truncate text-[16px] font-medium text-[#0F172A]">{job.title}</div>
                  <div className="truncate text-right text-[15px] text-[#94A3B8]">{job.location || '-'}</div>
                  <div className="text-right">
                    <span className={`inline-flex rounded-full px-4 py-2 text-[14px] font-medium ${getJobStatusClass(job.status)}`}>
                      {formatJobStatus(job.status)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState message="No jobs available yet." />
            )}
          </div>
        </DashboardCard>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.05fr_1fr]">
        <DashboardCard title="Weekly profile submissions">
          {weeklySubmissions.length ? (
            <div className="space-y-4">
              <div className="h-[300px]">
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
                Total submissions this week:{' '}
                <span className="font-semibold text-[#0F172A]">
                  {weeklySubmissions.reduce((sum, item) => sum + Number(item.count), 0)}
                </span>
              </div>
            </div>
          ) : (
            <EmptyState message="No weekly submission data available yet." />
          )}
        </DashboardCard>

        <DashboardCard title="Vendor activity">
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
                {vendorActivity.length ? (
                  vendorActivity.map((vendor) => (
                    <tr key={vendor.id} className="border-t border-black/6 bg-white">
                      <BodyCell>{vendor.name}</BodyCell>
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
                      No vendor activity available yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </DashboardCard>
      </section>

      {showCreateVendor && (
        <CreateVendorModal
          onClose={() => setShowCreateVendor(false)}
          onCreated={async () => {
            setShowCreateVendor(false);
            await loadData();
          }}
        />
      )}
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
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="rounded-[24px] border border-black/8 bg-white px-7 py-6 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
    <div className="mb-5">
      <h2 className="text-[18px] font-semibold tracking-[-0.02em] text-[#0F172A]">{title}</h2>
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
}: {
  children: React.ReactNode;
  center?: boolean;
}) => (
  <td className={`px-5 py-5 text-[16px] text-[#0F172A] ${center ? 'text-center' : 'text-left'}`}>
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

const formatJobStatus = (status: string) => {
  switch (status) {
    case 'APPROVED':
      return 'Approved';
    case 'ON_HOLD':
      return 'Pending';
    case 'CLOSED':
      return 'Closed';
    default:
      return formatStageLabel(status);
  }
};

const getJobStatusClass = (status: string) => {
  switch (status) {
    case 'APPROVED':
      return 'bg-[#DDFBF2] text-[#0F766E]';
    case 'ON_HOLD':
      return 'bg-[#FEF3C7] text-[#B45309]';
    case 'CLOSED':
      return 'bg-[#E5E7EB] text-[#6B7280]';
    default:
      return 'bg-[#DBEAFE] text-[#1D4ED8]';
  }
};

const getRateClass = (rate: number) => {
  if (rate >= 20) return 'bg-[#DDFBF2] text-[#0F766E]';
  if (rate >= 10) return 'bg-[#DBEAFE] text-[#1D4ED8]';
  return 'bg-[#E5E7EB] text-[#6B7280]';
};

const getAverageDays = (dates: Array<string | undefined>) => {
  const validDates = dates.filter(Boolean) as string[];
  if (!validDates.length) return 0;

  const totalDays = validDates.reduce((sum, value) => {
    const created = new Date(value).getTime();
    const now = Date.now();
    return sum + Math.max(0, Math.round((now - created) / (1000 * 60 * 60 * 24)));
  }, 0);

  return Math.round(totalDays / validDates.length);
};

export default DashboardHome;
