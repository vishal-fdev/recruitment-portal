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
import { Box, Button, Card, CardBody, DataTable, Grid, Heading, Text } from 'grommet';
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

const COLORS = ['#01A982', '#27C3B8', '#7C6CF2', '#F59E0B', '#EF4444', '#6366F1'];

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
    (candidate) =>
      ['IDENTIFIED', 'YET_TO_JOIN', 'ONBOARDED'].includes(candidate.status) &&
      isToday(candidate.createdAt),
  ).length;

  const livePieData = Object.entries(stats?.stageSummary ?? {})
    .filter(([, value]) => value > 0)
    .map(([status, value]) => ({
      name: formatStageLabel(status),
      value: Number(value),
    }));
  const pieData = livePieData;

  const liveBarData: SubmissionStat[] = stats?.submissionsByDate ?? [];
  const barData = liveBarData;

  const recentJobs = [...jobs]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4);
  const displayJobs = recentJobs;

  const liveCandidateSummary = [
    { label: 'Screen select', value: countStatuses(candidates, ['SCREEN_SELECTED']), color: '#0F766E', bar: '#0F766E' },
    { label: 'Tech select', value: countStatuses(candidates, ['TECH_SELECTED']), color: '#166534', bar: '#166534' },
    { label: 'Ops select', value: countStatuses(candidates, ['OPS_SELECTED', 'IDENTIFIED']), color: '#6D28D9', bar: '#6D28D9' },
    { label: 'Submitted', value: countStatuses(candidates, ['SUBMITTED']), color: '#1D4ED8', bar: '#1D4ED8' },
    {
      label: 'Rejected',
      value: countStatuses(candidates, ['SCREEN_REJECTED', 'TECH_REJECTED', 'OPS_REJECTED', 'REJECTED', 'DROPPED']),
      color: '#B91C1C',
      bar: '#B91C1C',
    },
  ];
  const candidateSummary = liveCandidateSummary.filter((item) => item.value > 0);
  const maxSummary = Math.max(...candidateSummary.map((item) => item.value), 1);

  const recentCandidateUpdates = [...candidates]
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .slice(0, 6)
    .map((candidate) => ({
      ...candidate,
      candidateCode: `CND-${String(candidate.id).padStart(3, '0')}`,
      jobCode: candidate.job ? `JOB-${String(candidate.job.id).padStart(3, '0')}` : '-',
      statusLabel: formatStageLabel(candidate.status),
    }));

  return (
    <Box gap="24px">
      <Card round="24px" border={{ color: 'border-weak' }} background="white">
        <CardBody pad="32px" gap="24px">
          <Box direction="row" justify="between" align="start">
            <Box gap="8px">
              <Heading level={1} margin="none" size="medium" color="#0B1F44">
                Hiring manager dashboard
              </Heading>
              <Text color="#64748B">Q2 2026 - HPE India - Welcome back</Text>
            </Box>

            <Box direction="row" gap="12px">
              <Button
                label="Export"
                style={{
                  borderRadius: '16px',
                  border: '1px solid #D7DEE9',
                  padding: '12px 20px',
                  fontWeight: 600,
                  background: '#FFFFFF',
                }}
              />
              <Button
                primary
                color="#01A982"
                label="+ Create job opening"
                onClick={() => navigate('/hiring-manager/jobs/create')}
                style={{
                  borderRadius: '16px',
                  padding: '12px 22px',
                  fontWeight: 700,
                  boxShadow: '0 8px 20px rgba(1, 169, 130, 0.18)',
                }}
              />
            </Box>
          </Box>

          <Grid columns={['flex', 'flex', 'flex', 'flex']} gap="16px">
            <TopCard accent="#01A982" title="JOBS CREATED" value={loading ? '...' : jobs.length} helper={`${createdThisWeek} this week`} helperColor="#01A982" />
            <TopCard accent="#4E86F7" title="PENDING APPROVAL" value={loading ? '...' : pendingApprovals} helper="Awaiting VM Head" helperColor="#94A3B8" />
            <TopCard accent="#7C6CF2" title="ACTIVE CANDIDATES" value={loading ? '...' : activeCandidates} helper={`${activeCandidatesThisWeek} this week`} helperColor="#01A982" />
            <TopCard accent="#F59E0B" title="OFFERS EXTENDED" value={loading ? '...' : offersExtended} helper={`${offersToday} today`} helperColor="#01A982" />
          </Grid>
        </CardBody>
      </Card>

      <Grid columns={['flex', 'flex']} gap="24px">
        <DashboardCard title="Candidate status distribution">
          {pieData.length ? (
            <Box height="320px" align="center" justify="center">
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
            </Box>
          ) : (
            <EmptyState message="No candidate status data available yet." />
          )}
        </DashboardCard>

        <DashboardCard
          title="Recent job openings"
          action={<Button plain label="View all" color="brand" onClick={() => navigate('/hiring-manager/jobs')} />}
        >
          <Box gap="12px">
            {displayJobs.length ? displayJobs.map((job) => (
                <Box
                  key={job.id}
                  direction="row"
                  align="center"
                  justify="between"
                  gap="12px"
                  background="#EEF3FB"
                  round="18px"
                  pad={{ horizontal: '20px', vertical: '18px' }}
                  onClick={() => navigate(`/hiring-manager/jobs/${job.id}`)}
                >
                  <Text color="#7C8699">{`JOB-${String(job.id).padStart(3, '0')}`}</Text>
                 <Box flex>
  <Text
    weight={500}
    truncate
  >
    {job.title}
  </Text>
</Box>
                  <Text color="#94A3B8">{job.location || '-'}</Text>
                  <Box pad={{ horizontal: '16px', vertical: '8px' }} round="999px" background={getPillColors(job.status).background}>
                    <Text size="small" color={getPillColors(job.status).color}>
                      {formatJobStatus(job.status)}
                    </Text>
                  </Box>
                </Box>
              )) : <EmptyState message="No recent job openings available yet." />}
          </Box>
        </DashboardCard>
      </Grid>

      <Grid columns={['flex', 'flex']} gap="24px">
        <DashboardCard title="Candidate submissions per day">
          {barData.length ? (
            <Box height="300px">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="4 4" stroke="#E2E8F0" />
                  <XAxis dataKey="label" tick={{ fill: '#64748B', fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#01A982" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          ) : (
            <EmptyState message="No submission trend data available yet." />
          )}
        </DashboardCard>

        <DashboardCard title="Candidate status summary">
          {candidateSummary.length ? (
            <Box gap="20px">
              {candidateSummary.map((item) => (
                <Grid key={item.label} columns={['160px', 'flex', '34px']} gap="medium" align="center">
                  <Box direction="row" align="center" gap="small">
                    <Box width="12px" height="12px" round="50%" background={item.color} />
                    <Text color="text-paragraph">{item.label}</Text>
                  </Box>
                  <Box height="16px" round="999px" background="#E5E7EB">
                    <Box
                      height="16px"
                      round="999px"
                      background={item.bar}
                      width={`${(item.value / maxSummary) * 100}%`}
                    />
                  </Box>
                  <Text textAlign="end" weight="bold">
                    {item.value}
                  </Text>
                </Grid>
              ))}
            </Box>
          ) : (
            <EmptyState message="No candidate status summary available yet." />
          )}
        </DashboardCard>
      </Grid>

      <DashboardCard
        title="Recent candidate updates"
        action={<Button plain label="View all" color="brand" onClick={() => navigate('/hiring-manager/candidates')} />}
      >
        {recentCandidateUpdates.length > 0 ? (
  <DataTable
    data={recentCandidateUpdates}
    columns={[
      {
        property: 'candidateCode',
        header: (
          <Text size="small" weight="bold">
            ID
          </Text>
        ),
        render: (datum) => (
          <Text weight="bold" color="brand">
            {datum.candidateCode}
          </Text>
        ),
      },
      {
        property: 'name',
        header: (
          <Text size="small" weight="bold">
            NAME
          </Text>
        ),
      },
      {
        property: 'jobCode',
        header: (
          <Text size="small" weight="bold">
            JOB
          </Text>
        ),
        render: (datum) => (
          <Text weight="bold" color="brand">
            {datum.jobCode}
          </Text>
        ),
      },
      {
        property: 'statusLabel',
        header: (
          <Text size="small" weight="bold">
            STATUS
          </Text>
        ),
        render: (datum) => (
          <StatusPill
            status={datum.status}
            label={datum.statusLabel}
          />
        ),
      },
    ]}
    onClickRow={({ datum }) =>
      navigate(`/hiring-manager/candidates/${datum.id}`)
    }
    fill
  />
) : (
  <EmptyState message="No candidate updates available yet." />
)}
      </DashboardCard>
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
  <Card round="20px" border={{ color: 'border-weak' }} background="white" overflow="hidden">
    <Box height="4px" background={accent} />
    <CardBody pad="28px" gap="12px">
      <Text size="small" weight="bold" color="#A0A8B8" style={{ letterSpacing: '0.08em' }}>
        {title}
      </Text>
      <Text size="48px" weight="bold" color="#0B1F44">
        {value}
      </Text>
      <Text color={helperColor}>{helper}</Text>
    </CardBody>
  </Card>
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
  <Card round="24px" border={{ color: 'border-weak' }} background="white">
    <CardBody pad="28px" gap="20px">
      <Box direction="row" justify="between" align="center">
        <Heading level={3} size="small" margin="none">
          {title}
        </Heading>
        {action}
      </Box>
      {children}
    </CardBody>
  </Card>
);

const StatusPill = ({ status, label }: { status: string; label: string }) => {
  const { background, color } = getPillColors(status);
  return (
    <Box background={background} pad={{ horizontal: '16px', vertical: '8px' }} round="999px">
      <Text size="small" weight="bold" color={color}>
        {label}
      </Text>
    </Box>
  );
};

const EmptyState = ({ message }: { message: string }) => (
  <Box height="300px" align="center" justify="center">
    <Text color="text-weak">{message}</Text>
  </Box>
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

const countStatuses = (items: CandidateRecord[], statuses: string[]) =>
  items.filter((candidate) => statuses.includes(candidate.status)).length;

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

const isThisWeek = (value?: string) => {
  if (!value) return false;
  const date = new Date(value);
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(now.getDate() - now.getDay());
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  return date >= start && date < end;
};

const getPillColors = (status: string) => {
  switch (status) {
    case 'APPROVED':
    case 'SCREEN_SELECTED':
    case 'TECH_SELECTED':
    case 'OPS_SELECTED':
    case 'IDENTIFIED':
      return { background: '#DDFBF2', color: '#0F766E' };
    case 'PENDING_APPROVAL':
    case 'SUBMITTED':
      return { background: '#DBEAFE', color: '#1D4ED8' };
    case 'REJECTED':
    case 'SCREEN_REJECTED':
    case 'TECH_REJECTED':
    case 'OPS_REJECTED':
    case 'DROPPED':
      return { background: '#FEE2E2', color: '#B91C1C' };
    default:
      return { background: '#F1F5F9', color: '#475569' };
  }
};

export default HiringManagerDashboard;
