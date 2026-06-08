import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardBody,
  DataTable,
  Grid,
  Heading,
  Text,
} from 'grommet';
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
  vendor?: { id?: string; name?: string };
  job?: { id: number; title: string };
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

    return () => window.clearInterval(interval);
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

      return { id: vendor.id, name: vendor.name, submitted, selected, rate };
    })
    .sort((a, b) => b.submitted - a.submitted)
    .slice(0, 4);

  return (
    <Box gap="24px">
      <Card round="24px" border={{ color: 'border-weak' }} background="white">
        <CardBody pad="32px" gap="24px">
          <Box direction="row" justify="between" align="start">
            <Box gap="8px">
              <Heading level={1} margin="none" size="medium">
                Vendor Manager dashboard
              </Heading>
              <Text color="#64748B">Q2 2026 - Live vendor operations - Welcome back</Text>
            </Box>

            <Button
              primary
              color="#01A982"
              label="+ Create vendor"
              onClick={() => setShowCreateVendor(true)}
            />
          </Box>

          <Grid columns={['flex', 'flex', 'flex', 'flex']} gap="16px">
            <TopCard accent="#01A982" title="ACTIVE JOBS" value={loading ? '...' : activeJobs} helper="Approved & live" helperColor="#94A3B8" />
            <TopCard accent="#3B82F6" title="VENDORS ASSIGNED" value={loading ? '...' : activeVendors} helper="Across all jobs" helperColor="#01A982" />
            <TopCard
              accent="#7C6CF2"
              title="CANDIDATES IN POOL"
              value={loading ? '...' : candidatesInPool}
              helper={`${weeklySubmissions.reduce((sum, item) => sum + Number(item.count), 0)} this week`}
              helperColor="#01A982"
            />
            <TopCard accent="#F59E0B" title="AVG. TIME TO FILL" value={loading ? '...' : `${averageTimeToFill}d`} helper="Live average" helperColor="#EF4444" />
          </Grid>
        </CardBody>
      </Card>

      <Grid columns={['flex', 'flex']} gap="24px">
        <DashboardCard title="Candidate stage summary">
          {stageData.length ? (
            <Grid columns={['flex', '220px']} gap="20px">
              <Box height="300px">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={stageData} dataKey="value" nameKey="name" innerRadius={68} outerRadius={118} paddingAngle={3}>
                      {stageData.map((entry, index) => (
                        <Cell key={`${entry.name}-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
              <Box justify="center" gap="12px">
                {stageData.map((entry, index) => (
                  <Box key={entry.name} direction="row" align="center" gap="12px" background="#F8FAFC" round="14px" pad={{ horizontal: '12px', vertical: '8px' }}>
                    <Box width="12px" height="12px" round="50%" background={CHART_COLORS[index % CHART_COLORS.length]} />
                    <Box flex>
  <Text
    size="small"
    color="#475569"
  >
    {entry.name}
  </Text>
</Box>
                    <Text size="small" weight={600}>
                      {entry.value}
                    </Text>
                  </Box>
                ))}
              </Box>
            </Grid>
          ) : (
            <EmptyState message="No candidate stage data available yet." />
          )}
        </DashboardCard>

        <DashboardCard title="Jobs - assign vendors">
          <Box gap="12px">
            {assignVendorJobs.length ? (
              assignVendorJobs.map((job) => (
                <Box
                  key={job.id}
                  direction="row"
                  align="center"
                  gap="12px"
                  justify="between"
                  background="#F1F5F9"
                  round="18px"
                  pad={{ horizontal: '20px', vertical: '16px' }}
                  onClick={() => navigate(`/vendor-manager/jobs/${job.id}`)}
                >
                  <Text color="#7C8699">{`JOB-${String(job.id).padStart(3, '0')}`}</Text>
                  <Box
  flex
  overflow="hidden"
>
  <Text
    weight={500}
    style={{
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    }}
  >
    {job.title}
  </Text>
</Box>
                  <Text color="#94A3B8">{job.location || '-'}</Text>
                  <Box pad={{ horizontal: '16px', vertical: '8px' }} round="999px" background={jobStatusColors(job.status).background}>
                    <Text size="small" color={jobStatusColors(job.status).color}>
                      {formatJobStatus(job.status)}
                    </Text>
                  </Box>
                </Box>
              ))
            ) : (
              <EmptyState message="No jobs available yet." />
            )}
          </Box>
        </DashboardCard>
      </Grid>

      <Grid columns={['flex', 'flex']} gap="24px">
        <DashboardCard title="Weekly profile submissions">
          {weeklySubmissions.length ? (
            <Box gap="16px">
              <Box height="300px">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklySubmissions}>
                    <CartesianGrid strokeDasharray="4 4" stroke="#E2E8F0" />
                    <XAxis dataKey="label" tick={{ fill: '#64748B', fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#01A982" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
              <Box background="#F8FAFC" round="14px" pad={{ horizontal: '16px', vertical: '12px' }}>
                <Text size="small" color="#475569">
                  Total submissions this week:{' '}
                  <Text weight={600} color="#0F172A">
                    {weeklySubmissions.reduce((sum, item) => sum + Number(item.count), 0)}
                  </Text>
                </Text>
              </Box>
            </Box>
          ) : (
            <EmptyState message="No weekly submission data available yet." />
          )}
        </DashboardCard>

        <DashboardCard title="Vendor activity">
          {vendorActivity.length ? (
            <DataTable
              data={vendorActivity}
              columns={[
                { property: 'name', header: 'VENDOR' },
                { property: 'submitted', header: 'SUBMITTED' },
                { property: 'selected', header: 'SELECTED' },
                {
                  property: 'rate',
                  header: 'RATE',
                  render: (datum) => (
                    <Box as="span" pad={{ horizontal: '16px', vertical: '8px' }} round="999px" background={rateColors(datum.rate).background}>
                      <Text size="small" color={rateColors(datum.rate).color}>
                        {datum.rate}%
                      </Text>
                    </Box>
                  ),
                },
              ]}
            />
          ) : (
            <EmptyState message="No vendor activity available yet." />
          )}
        </DashboardCard>
      </Grid>

      {showCreateVendor && (
        <CreateVendorModal
          onClose={() => setShowCreateVendor(false)}
          onCreated={async () => {
            setShowCreateVendor(false);
            await loadData();
          }}
        />
      )}
    </Box>
  );
};

const TopCard = ({
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
  <Card round="18px" border={{ color: 'border-weak' }} background="white">
    <Box height="4px" background={accent} />
    <CardBody pad="24px" gap="12px">
      <Text size="small" weight={600} color="#A0A8B8">
        {title}
      </Text>
      <Text size="xxlarge" weight={600}>
        {value}
      </Text>
      <Text size="small" color={helperColor}>
        {helper}
      </Text>
    </CardBody>
  </Card>
);

const DashboardCard = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <Card round="24px" border={{ color: 'border-weak' }} background="white">
    <CardBody pad="24px" gap="20px">
      <Heading level={3} size="small" margin="none">
        {title}
      </Heading>
      {children}
    </CardBody>
  </Card>
);

const EmptyState = ({ message }: { message: string }) => (
  <Box height="300px" align="center" justify="center">
    <Text size="small" color="#94A3B8">
      {message}
    </Text>
  </Box>
);

const formatStageLabel = (value: string) =>
  value.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());

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

const jobStatusColors = (status: string) => {
  switch (status) {
    case 'APPROVED':
      return { background: '#DDFBF2', color: '#0F766E' };
    case 'ON_HOLD':
      return { background: '#FEF3C7', color: '#B45309' };
    case 'CLOSED':
      return { background: '#E5E7EB', color: '#6B7280' };
    default:
      return { background: '#DBEAFE', color: '#1D4ED8' };
  }
};

const rateColors = (rate: number) => {
  if (rate >= 20) return { background: '#DDFBF2', color: '#0F766E' };
  if (rate >= 10) return { background: '#DBEAFE', color: '#1D4ED8' };
  return { background: '#E5E7EB', color: '#6B7280' };
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
