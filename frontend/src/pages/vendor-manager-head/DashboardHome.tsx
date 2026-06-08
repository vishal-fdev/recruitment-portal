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
import { getJobs, type Job } from '../../services/jobService';

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
        ? new Date(candidate.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
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

      return { id: vendor.id, name: vendor.name, submitted, selected, rate };
    })
    .sort((a, b) => b.submitted - a.submitted)
    .slice(0, 5);

  const pipelineOverview = [...candidates]
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .slice(0, 6);

  return (
    <Box gap="24px">
      <Card round="24px" border={{ color: 'border-weak' }} background="white">
        <CardBody pad="32px" gap="24px">
          <Box gap="8px">
            <Heading level={1} size="medium" margin="none">
              VM Head dashboard
            </Heading>
            <Text color="#64748B">Q2 2026 - HPE India - Welcome back</Text>
          </Box>

          <Grid columns={['flex', 'flex', 'flex', 'flex']} gap="16px">
            <TopCard accent="#EF4444" title="PENDING APPROVALS" value={loading ? '...' : pendingJobs.length} helper="Action needed" helperColor="#EF4444" />
            <TopCard
              accent="#01A982"
              title="APPROVED JOBS"
              value={loading ? '...' : approvedJobs}
              helper={`${jobs.filter((job) => isThisWeek(job.createdAt) && job.status === 'APPROVED').length} this week`}
              helperColor="#01A982"
            />
            <TopCard accent="#3B82F6" title="ACTIVE VENDORS" value={loading ? '...' : activeVendors} helper="All active" helperColor="#94A3B8" />
            <TopCard accent="#7C6CF2" title="TOTAL CANDIDATES" value={loading ? '...' : totalCandidates} helper={`${candidatesThisWeek} this week`} helperColor="#01A982" />
          </Grid>
        </CardBody>
      </Card>

      <Grid columns={['flex', 'flex']} gap="24px">
        <DashboardCard title="Job status distribution">
          {pieData.length ? (
            <Grid columns={['flex', '220px']} gap="20px">
              <Box height="300px">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={68} outerRadius={118} paddingAngle={3}>
                      {pieData.map((entry, index) => (
                        <Cell key={`${entry.name}-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
              <Box justify="center" gap="12px">
                {pieData.map((entry, index) => (
                  <Box key={entry.name} direction="row" align="center" gap="12px" background="#F8FAFC" round="14px" pad={{ horizontal: '12px', vertical: '8px' }}>
                    <Box width="12px" height="12px" round="50%" background={CHART_COLORS[index % CHART_COLORS.length]} />
                    <Box flex>
  <Text size="small" color="#475569">
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
            <EmptyState message="No job status data available yet." />
          )}
        </DashboardCard>

        <DashboardCard
          title="Jobs pending your approval"
          action={<Button plain label="View all" onClick={() => navigate('/vendor-manager-head/jobs')} />}
        >
          <Box gap="12px">
            {pendingJobs.length ? (
              pendingJobs.slice(0, 4).map((job) => (
                <Box
                  key={job.id}
                  direction="row"
                  align="center"
                  justify="between"
                  gap="12px"
                  background="#F1F5F9"
                  round="18px"
                  pad={{ horizontal: '20px', vertical: '16px' }}
                  onClick={() => navigate(`/vendor-manager-head/jobs/${job.id}`)}
                >
                 <Text
  color="#01A982"
  style={{ fontFamily: 'monospace' }}
>
  {`JOB-${String(job.id).padStart(3, '0')}`}
</Text>
                  <Box flex>
  <Text weight={500} truncate>
    {job.title}
  </Text>
</Box>
                  <Text color="#64748B">{job.createdAt ? formatShortDate(job.createdAt) : '-'}</Text>
                  <Box pad={{ horizontal: '16px', vertical: '8px' }} round="999px" background="#FEE2E2">
                    <Text size="small" color="#B91C1C">
                      Pending
                    </Text>
                  </Box>
                </Box>
              ))
            ) : (
              <EmptyState message="No pending approvals right now." />
            )}
          </Box>
        </DashboardCard>
      </Grid>

      <Grid columns={['flex', 'flex']} gap="24px">
        <DashboardCard title="Candidate inflow">
          {barData.length ? (
            <Box gap="16px">
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
              <Box background="#F8FAFC" round="14px" pad={{ horizontal: '16px', vertical: '12px' }}>
                <Text size="small" color="#475569">
                  Total candidates in view: <Text weight={600}>{totalCandidates}</Text>
                </Text>
              </Box>
            </Box>
          ) : (
            <EmptyState message="No candidate inflow data available yet." />
          )}
        </DashboardCard>

        <DashboardCard title="Vendor performance">
          {vendorPerformance.length ? (
            <DataTable
              data={vendorPerformance}
              onClickRow={({ datum }) => navigate(`/vendor-manager-head/vendors/${datum.id}`)}
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
            <EmptyState message="No vendor performance data available yet." />
          )}
        </DashboardCard>
      </Grid>

      <DashboardCard title="Pipeline overview">
        {pipelineOverview.length ? (
          <DataTable
            data={pipelineOverview}
            onClickRow={({ datum }) => navigate(`/vendor-manager-head/candidates/${datum.id}`)}
            columns={[
              { property: 'name', header: 'CANDIDATE', render: (datum) => <Text color="#01A982" weight={500}>{datum.name}</Text> },
              { property: 'job', header: 'JOB', render: (datum) => datum.job?.title || '-' },
              { property: 'vendor', header: 'VENDOR', render: (datum) => datum.vendor?.name || '-' },
              {
                property: 'status',
                header: 'STATUS',
                render: (datum) => (
                  <Box as="span" pad={{ horizontal: '16px', vertical: '8px' }} round="999px" background={candidateStatusColors(datum.status).background}>
                    <Text size="small" color={candidateStatusColors(datum.status).color}>
                      {formatStageLabel(datum.status)}
                    </Text>
                  </Box>
                ),
              },
            ]}
          />
        ) : (
          <EmptyState message="No pipeline candidates available yet." />
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
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) => (
  <Card round="24px" border={{ color: 'border-weak' }} background="white">
    <CardBody pad="24px" gap="20px">
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

const EmptyState = ({ message }: { message: string }) => (
  <Box height="300px" align="center" justify="center">
    <Text size="small" color="#94A3B8">
      {message}
    </Text>
  </Box>
);

const formatStageLabel = (value: string) =>
  value.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());

const formatShortDate = (value: string) =>
  new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });

const rateColors = (rate: number) => {
  if (rate >= 20) return { background: '#DDFBF2', color: '#0F766E' };
  if (rate >= 10) return { background: '#DBEAFE', color: '#1D4ED8' };
  return { background: '#E5E7EB', color: '#6B7280' };
};

const candidateStatusColors = (status: string) => {
  if (['SCREEN_REJECTED', 'TECH_REJECTED', 'OPS_REJECTED', 'REJECTED', 'DROPPED'].includes(status)) {
    return { background: '#FEE2E2', color: '#B91C1C' };
  }
  if (['SCREEN_SELECTED', 'TECH_SELECTED', 'IDENTIFIED', 'SELECTED', 'ONBOARDED', 'OPS_SELECTED'].includes(status)) {
    return { background: '#DDFBF2', color: '#0F766E' };
  }
  if (status === 'YET_TO_JOIN') {
    return { background: '#FEF3C7', color: '#B45309' };
  }
  return { background: '#DBEAFE', color: '#1D4ED8' };
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
