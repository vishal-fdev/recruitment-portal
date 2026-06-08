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
import { Box, Button, Card, CardBody, Grid, Heading, Paragraph, Text } from 'grommet';
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
        if (mounted) setLoading(false);
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
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .slice(0, 4);

  return (
    <Box gap="large">
      <Box gap="xsmall">
        <Heading level={2} margin="none" color="text-strong">
          Vendor dashboard
        </Heading>
        <Box direction="row" align="center" gap="small">
          <Box width="10px" height="10px" round="full" background="#96F7E4" />
          <Text color="text-paragraph">Live recruitment activity</Text>
        </Box>
      </Box>

      <Grid columns={{ count: 'fit', size: ['small', 'small'] }} gap="medium">
        <StatCard accent="#01A982" title="ASSIGNED JOBS" value={loading ? '...' : assignedJobs} helper={`${jobsCreatedToday} new today`} helperColor="#01A982" />
        <StatCard accent="#3B82F6" title="CANDIDATES SUBMITTED" value={loading ? '...' : candidatesSubmitted} helper={`${submittedThisWeek} this week`} helperColor="#01A982" />
        <StatCard accent="#7C6CF2" title="IN INTERVIEW STAGE" value={loading ? '...' : interviewCandidates.length} helper={`Across ${interviewJobsCount} jobs`} helperColor="#94A3B8" />
        <StatCard accent="#F59E0B" title="OFFERS / PLACED" value={loading ? '...' : offersPlaced} helper="This quarter" helperColor="#01A982" />
      </Grid>

      <Grid columns={{ count: 'fit', size: ['medium', 'medium'] }} gap="medium">
        <DashboardCard title="Candidate stage summary">
          {stageData.length ? (
            <Grid columns={['flex', '220px']} gap="medium">
              <Box height="320px">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={stageData} dataKey="value" nameKey="name" innerRadius={68} outerRadius={120} paddingAngle={3}>
                      {stageData.map((entry, index) => (
                        <Cell key={`${entry.name}-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
              <Box justify="center" gap="small">
                {stageData.map((entry, index) => (
                  <Box key={entry.name} direction="row" align="center" gap="small">
                    <Box width="12px" height="12px" round="full" background={CHART_COLORS[index % CHART_COLORS.length]} />
                    <Box flex>
  <Text color="text-paragraph" size="small">
    {entry.name}
  </Text>
</Box>
                    <Text weight="bold" size="small">
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

        <DashboardCard
          title="Assigned jobs"
          action={<Button plain label="View all" color="brand" onClick={() => navigate('/vendor/candidates')} />}
        >
          <Box gap="small">
            {assignedJobsList.length ? (
              assignedJobsList.map((job) => (
                <Card
                  key={job.id}
                  background={{ color: '#F8FAFC' }}
                  round="18px"
                  border={{ color: 'border-weak' }}
                  onClick={() => navigate(`/vendor/jobs/${job.id}`)}
                  elevation="xsmall"
                >
                  <CardBody pad="medium">
                    <Box direction="row" align="center" gap="medium" wrap>
                      <Box width="110px">
  <Text color="text-weak">
    {`JOB-${String(job.id).padStart(3, '0')}`}
  </Text>
</Box>
                      <Box flex>
                        <Text weight="bold">{job.title}</Text>
                      </Box>
                      <Box width="92px">
  <Text color="text-weak">
    {job.location || '-'}
  </Text>
</Box>
                      <Button
                        type="button"
                        label="Submit"
                        primary
                        color="brand"
                        onClick={(event) => {
                          event.stopPropagation();
                          navigate(`/vendor/candidates/create?jobId=${job.id}`);
                        }}
                      />
                    </Box>
                  </CardBody>
                </Card>
              ))
            ) : (
              <EmptyState message="No assigned jobs available." />
            )}
          </Box>
        </DashboardCard>
      </Grid>

      <Grid columns={{ count: 'fit', size: ['medium', 'medium'] }} gap="medium">
        <DashboardCard title="Weekly profile submissions">
          {weeklySubmissions.length ? (
            <Box gap="small">
              <Box height="320px">
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
              <Box background="#F8FAFC" round="14px" pad={{ horizontal: 'medium', vertical: 'small' }}>
                <Text size="small" color="text-paragraph">
                  Total submissions this week: <Text weight="bold">{submittedThisWeek}</Text>
                </Text>
              </Box>
            </Box>
          ) : (
            <EmptyState message="No weekly submission data available yet." />
          )}
        </DashboardCard>

        <DashboardCard title="My candidates - live status">
          <Box gap="small">
            {candidateLiveStatus.length ? (
              candidateLiveStatus.map((candidate) => (
                <Card
                  key={candidate.id}
                  background="white"
                  round="18px"
                  border={{ color: 'border-weak' }}
                  onClick={() => navigate(`/vendor/candidates/${candidate.id}`)}
                  elevation="xsmall"
                >
                  <CardBody pad="medium">
                    <Box direction="row" align="center" gap="medium" wrap>
                      <Box
                        width="44px"
                        height="44px"
                        round="full"
                        background="#F1F5F9"
                        align="center"
                        justify="center"
                      >
                        <Text weight="bold" color="#6B7280">
                          {getInitials(candidate.name)}
                        </Text>
                      </Box>
                      <Box flex>
                        <Text weight="bold">{candidate.name}</Text>
                        <Text color="text-weak">
                          {candidate.job ? `JOB-${String(candidate.job.id).padStart(3, '0')}` : 'No job assigned'}
                        </Text>
                      </Box>
                      <Box background={getLiveStatusColors(candidate.status).background} pad={{ horizontal: 'medium', vertical: 'small' }} round="full">
                        <Text size="small" weight="bold" color={getLiveStatusColors(candidate.status).color}>
                          {formatLiveStatus(candidate.status)}
                        </Text>
                      </Box>
                    </Box>
                  </CardBody>
                </Card>
              ))
            ) : (
              <EmptyState message="No live candidate activity yet." />
            )}
          </Box>
        </DashboardCard>
      </Grid>
    </Box>
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
  <Card background="white" round="18px" border={{ color: 'border-weak' }} overflow="hidden" elevation="xsmall">
    <Box height="4px" background={accent} />
    <CardBody pad="medium" gap="small">
      <Text size="xsmall" weight="bold" color="#9CA3AF">
        {title}
      </Text>
      <Text size="xxlarge" weight="bold" color="text-strong">
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
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) => (
  <Card background="white" round="22px" border={{ color: 'border-weak' }} elevation="xsmall">
    <CardBody pad="large" gap="medium">
      <Box direction="row" justify="between" align="center" gap="medium">
        <Heading level={3} size="small" margin="none">
          {title}
        </Heading>
        {action}
      </Box>
      {children}
    </CardBody>
  </Card>
);

const EmptyState = ({ message }: { message: string }) => (
  <Box height="320px" align="center" justify="center">
    <Text color="text-weak">{message}</Text>
  </Box>
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

const getLiveStatusColors = (status: string) => {
  switch (status) {
    case 'OPS_SELECTED':
    case 'IDENTIFIED':
      return { background: '#EFE7FF', color: '#6D28D9' };
    case 'SCREEN_SELECTED':
    case 'TECH_SELECTED':
      return { background: '#DDFBF2', color: '#0F766E' };
    case 'SUBMITTED':
      return { background: '#DBEAFE', color: '#1D4ED8' };
    case 'SCREEN_REJECTED':
    case 'TECH_REJECTED':
    case 'OPS_REJECTED':
    case 'DROPPED':
      return { background: '#FEE2E2', color: '#B91C1C' };
    case 'ONBOARDED':
      return { background: '#DCFCE7', color: '#15803D' };
    case 'YET_TO_JOIN':
      return { background: '#FEF3C7', color: '#B45309' };
    default:
      return { background: '#F1F5F9', color: '#475569' };
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
