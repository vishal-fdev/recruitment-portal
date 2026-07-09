import { useEffect, useLayoutEffect, useState } from 'react';
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
import { Box, Button, Card, CardBody, Grid, Text } from 'grommet';
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

const PIE_COLORS = ['#16B8AA', '#08A984', '#835CEB', '#F59E0B', '#F43F3F', '#5B5FF0'];
const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const HiringManagerDashboardV2 = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [candidates, setCandidates] = useState<CandidateRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useLayoutEffect(() => {
    const resetScroll = () => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };

    resetScroll();
    const frame = window.requestAnimationFrame(resetScroll);
    const timer = window.setTimeout(resetScroll, 80);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      const [dashboardResult, jobsResult, candidatesResult] = await Promise.allSettled([
        getDashboardStats(),
        getJobs(),
        api.get('/candidates'),
      ]);

      if (!mounted) return;

      if (dashboardResult.status === 'fulfilled') {
        setStats(dashboardResult.value);
      } else {
        console.error('Failed to load hiring manager dashboard stats', dashboardResult.reason);
      }

      if (jobsResult.status === 'fulfilled') {
        setJobs(jobsResult.value || []);
      } else {
        console.error('Failed to load hiring manager jobs', jobsResult.reason);
      }

      if (candidatesResult.status === 'fulfilled') {
        setCandidates(candidatesResult.value.data || []);
      } else {
        console.error('Failed to load hiring manager candidates', candidatesResult.reason);
      }

      setLoading(false);
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
  const activeCandidates = candidates.length || Number(stats?.kpis?.totalCandidates || 0);
  const activeCandidatesThisWeek = candidates.filter((candidate) => isThisWeek(candidate.createdAt)).length;
  const offersExtended = candidates.filter((candidate) =>
    ['IDENTIFIED', 'YET_TO_JOIN', 'ONBOARDED'].includes(candidate.status),
  ).length;
  const offersToday = candidates.filter(
    (candidate) =>
      ['IDENTIFIED', 'YET_TO_JOIN', 'ONBOARDED'].includes(candidate.status) &&
      isToday(candidate.createdAt),
  ).length;

  const pieData = Object.entries(stats?.stageSummary ?? {})
    .filter(([, value]) => value > 0)
    .map(([status, value]) => ({
      name: formatStageLabel(status),
      value: Number(value),
    }));

  const barData = normalizeWeeklySubmissions(stats?.submissionsByDate ?? []);
  const hasSubmissionData = barData.some((entry) => entry.count > 0);

  const recentJobs = [...jobs]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4);

  const candidateSummary = [
    { label: 'Screen select', value: countStatuses(candidates, ['SCREEN_SELECTED']), color: '#0F766E' },
    { label: 'Tech select', value: countStatuses(candidates, ['TECH_SELECTED']), color: '#166534' },
    { label: 'Ops select', value: countStatuses(candidates, ['OPS_SELECTED', 'IDENTIFIED']), color: '#6D28D9' },
    { label: 'Submitted', value: countStatuses(candidates, ['SUBMITTED']), color: '#1D4ED8' },
    {
      label: 'Rejected',
      value: countStatuses(candidates, ['SCREEN_REJECTED', 'TECH_REJECTED', 'OPS_REJECTED', 'REJECTED', 'DROPPED']),
      color: '#B91C1C',
    },
  ];
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
    <Box gap="24px" id="hm-dashboard-top">
      <Box
        background="white"
        round="22px"
        border={{ color: '#DDE3EB' }}
        pad={{ horizontal: '40px', vertical: '28px' }}
        gap="34px"
        flex={false}
        style={{ overflow: 'visible' }}
      >
        <Box direction="row" justify="between" align="start" wrap gap="24px" flex={false}>
          <Box gap="8px" flex={false}>
            <Text size="40px" weight={500} color="#020B24" style={{ lineHeight: 1.05 }}>
              Hiring manager dashboard
            </Text>
            <Text size="16px" color="#526584">Q2 2026 - HPE India - Welcome back</Text>
          </Box>

          <Box direction="row" gap="12px" align="center" flex={false}>
            <Button
              label="Export"
              style={{
                borderRadius: '16px',
                border: '1px solid #D7DEE9',
                padding: '12px 20px',
                fontSize: '14px',
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
                fontSize: '14px',
                fontWeight: 700,
                boxShadow: '0 8px 20px rgba(1, 169, 130, 0.18)',
              }}
            />
          </Box>
        </Box>

        <Grid columns={['flex', 'flex', 'flex', 'flex']} gap="16px" flex={false}>
          <MetricCard accent="#01A982" title="JOBS CREATED" value={loading ? '...' : jobs.length} helper={`${createdThisWeek} this week`} helperColor="#01A982" />
          <MetricCard accent="#4E86F7" title="PENDING APPROVAL" value={loading ? '...' : pendingApprovals} helper="Awaiting VM Head" helperColor="#94A3B8" />
          <MetricCard accent="#7C6CF2" title="ACTIVE CANDIDATES" value={loading ? '...' : activeCandidates} helper={`${activeCandidatesThisWeek} this week`} helperColor="#01A982" />
          <MetricCard accent="#F59E0B" title="OFFERS EXTENDED" value={loading ? '...' : offersExtended} helper={`${offersToday} today`} helperColor="#01A982" />
        </Grid>
      </Box>

      <Grid columns={['flex', 'flex']} gap="24px">
        <DashboardCard title="Candidate status distribution">
          {pieData.length ? (
            <Box height="312px" align="center" justify="center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={68} outerRadius={118} paddingAngle={3}>
                    {pieData.map((entry, index) => (
                      <Cell key={`${entry.name}-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
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
          action={<ActionLink label="View all" onClick={() => navigate('/hiring-manager/jobs')} />}
        >
          <Box gap="12px">
            {recentJobs.length ? recentJobs.map((job) => (
              <Box
                key={job.id}
                direction="row"
                align="center"
                justify="between"
                gap="16px"
                background="#EEF3FB"
                round="18px"
                pad={{ horizontal: '20px', vertical: '16px' }}
                height="68px"
                onClick={() => navigate(`/hiring-manager/jobs/${job.id}`)}
                style={{ cursor: 'pointer' }}
              >
                <Text size="14px" color="#75829A" style={{ minWidth: 145 }}>{`JOB-${String(job.id).padStart(3, '0')}`}</Text>
                <Box flex overflow="hidden">
                  <Text size="16px" weight={600} truncate color="#020B24">{job.title}</Text>
                </Box>
                <Text size="14px" color="#8B96B2" style={{ minWidth: 130 }}>{job.location || '-'}</Text>
                <Box pad={{ horizontal: '17px', vertical: '9px' }} round="999px" background={getPillColors(job.status).background}>
                  <Text size="14px" weight={600} color={getPillColors(job.status).color}>
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
          {hasSubmissionData ? (
            <Box height="300px">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="4 4" stroke="#E4EAF2" />
                  <XAxis dataKey="label" tick={{ fill: '#64748B', fontSize: 12 }} tickLine={false} axisLine={{ stroke: '#9CA3AF' }} />
                  <YAxis allowDecimals={false} tick={{ fill: '#64748B', fontSize: 12 }} tickLine={false} axisLine={{ stroke: '#9CA3AF' }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#08A984" radius={[7, 7, 0, 0]} barSize={86} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          ) : (
            <EmptyState message="No submission data available yet." />
          )}
        </DashboardCard>

        <DashboardCard title="Candidate status summary">
          <Box gap="21px" pad={{ top: '2px' }}>
            {candidateSummary.map((item) => (
              <Grid key={item.label} columns={['152px', 'flex', '34px']} gap="24px" align="center">
                <Box direction="row" align="center" gap="small">
                  <Box width="12px" height="12px" round="50%" background={item.color} />
                  <Text size="14px" color="#526584">{item.label}</Text>
                </Box>
                <Box height="16px" round="999px" background="#E0E3E9">
                  <Box height="16px" round="999px" background={item.color} width={`${(item.value / maxSummary) * 100}%`} />
                </Box>
                <Text size="14px" textAlign="end" weight={600} color="#020B24">{item.value}</Text>
              </Grid>
            ))}
          </Box>
        </DashboardCard>
      </Grid>

      <DashboardCard
        title="Recent candidate updates"
        action={<ActionLink label="View all" onClick={() => navigate('/hiring-manager/candidates')} />}
      >
        <Box round="16px" overflow="hidden" border={{ color: '#DDE3EB' }}>
          <Grid columns={['1.1fr', '1.1fr', '1.05fr', '1.7fr']} background="#EEF3F9" pad={{ horizontal: '20px', vertical: '18px' }}>
            {['ID', 'NAME', 'JOB', 'STATUS'].map((heading) => (
              <Text key={heading} size="12px" weight={700} color="#60708A" style={{ letterSpacing: '0.08em' }}>
                {heading}
              </Text>
            ))}
          </Grid>
          {recentCandidateUpdates.length > 0 ? (
            recentCandidateUpdates.map((candidate, index) => (
              <Grid
                key={candidate.id}
                columns={['1.1fr', '1.1fr', '1.05fr', '1.7fr']}
                align="center"
                background={index === 2 ? '#F5FCFA' : index % 2 === 0 ? '#FFFFFF' : '#FAFBFD'}
                pad={{ horizontal: '20px', vertical: '21px' }}
                border={{ side: 'top', color: '#DDE3EB' }}
                onClick={() => navigate(`/hiring-manager/candidates/${candidate.id}`)}
                style={{ cursor: 'pointer', minHeight: 78 }}
              >
                <Text size="16px" weight={600} color="#00A37D">{candidate.candidateCode}</Text>
                <Text size="16px" color="#020B24">{candidate.name}</Text>
                <Text size="16px" weight={600} color="#00A37D">{candidate.jobCode}</Text>
                <StatusPill status={candidate.status} label={candidate.statusLabel} />
              </Grid>
            ))
          ) : (
            <Box height="148px" align="center" justify="center" border={{ side: 'top', color: '#DDE3EB' }}>
              <Text size="14px" color="#8A97B7">No candidate updates available yet.</Text>
            </Box>
          )}
        </Box>
      </DashboardCard>
    </Box>
  );
};

const MetricCard = ({
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
  <Box round="16px" border={{ color: '#DDE3EB' }} background="white" overflow="hidden" flex={false}>
    <Box height="4px" background={accent} flex={false} />
    <Box pad={{ horizontal: '28px', vertical: '24px' }} gap="11px" flex={false}>
      <Text size="12px" weight={700} color="#A2AEC5" style={{ letterSpacing: '0.08em' }}>
        {title}
      </Text>
      <Text size="38px" weight={700} color="#020B24" style={{ lineHeight: 1 }}>
        {value}
      </Text>
      <Text size="16px" color={helperColor}>{helper}</Text>
    </Box>
  </Box>
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
  <Card round="22px" border={{ color: '#DDE3EB' }} background="white" elevation="none" overflow="hidden">
    <CardBody pad={{ horizontal: '28px', vertical: '26px' }} gap="22px">
      <Box direction="row" justify="between" align="center">
        <Text size="18px" weight={700} color="#020B24">{title}</Text>
        {action}
      </Box>
      {children}
    </CardBody>
  </Card>
);

const StatusPill = ({ status, label }: { status: string; label: string }) => {
  const { background, color } = getPillColors(status);
  return (
    <Box align="center" justify="center" background={background} pad={{ horizontal: '16px', vertical: '8px' }} round="999px" width={{ min: '100px', max: 'max-content' }}>
      <Text size="13px" weight={700} color={color}>{label}</Text>
    </Box>
  );
};

const ActionLink = ({ label, onClick }: { label: string; onClick: () => void }) => (
  <Button plain onClick={onClick} label={<Text size="14px" weight={700} color="#008A68">{label}</Text>} />
);

const EmptyState = ({ message }: { message: string }) => (
  <Box height="312px" align="center" justify="center">
    <Text size="14px" color="#8A97B7">{message}</Text>
  </Box>
);

const formatStageLabel = (value: string) =>
  value.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());

const normalizeWeeklySubmissions = (submissions: SubmissionStat[]) => {
  const counts = new Map(WEEK_DAYS.map((day) => [day, 0]));

  submissions.forEach((submission) => {
    const label = toWeekdayLabel(submission.label);
    counts.set(label, (counts.get(label) || 0) + Number(submission.count || 0));
  });

  return WEEK_DAYS.map((label) => ({ label, count: counts.get(label) || 0 }));
};

const toWeekdayLabel = (label: string) => {
  const trimmed = label.trim();
  const direct = WEEK_DAYS.find((day) => day.toLowerCase() === trimmed.slice(0, 3).toLowerCase());
  if (direct) return direct;

  const date = new Date(trimmed);
  if (!Number.isNaN(date.getTime())) {
    return WEEK_DAYS[date.getDay()];
  }

  return trimmed.slice(0, 3) || 'Sun';
};

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
    case 'YET_TO_JOIN':
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

export default HiringManagerDashboardV2;
