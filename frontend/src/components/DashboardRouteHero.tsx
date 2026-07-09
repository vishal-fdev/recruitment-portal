import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, Button, Card, CardBody, Grid, Heading, Text } from 'grommet';
import api from '../api/api';
import { getJobs, type Job } from '../services/jobService';
import { getVendorCandidates } from '../services/candidateService';

type CandidateRecord = {
  id: number;
  status: string;
  createdAt?: string;
};

type VendorRecord = {
  id: string;
  isActive: boolean;
};

const heroButtonStyle = {
  borderRadius: '16px',
  padding: '12px 22px',
  fontWeight: 700,
  boxShadow: '0 8px 20px rgba(1, 169, 130, 0.18)',
} as const;

const secondaryButtonStyle = {
  borderRadius: '16px',
  border: '1px solid #D7DEE9',
  padding: '12px 20px',
  fontWeight: 600,
  background: '#FFFFFF',
} as const;

const DashboardRouteHero = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [candidates, setCandidates] = useState<CandidateRecord[]>([]);
  const [vendors, setVendors] = useState<VendorRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const isHiringManagerDashboard = location.pathname === '/hiring-manager';
  const isVendorDashboard = location.pathname === '/vendor';
  const isVendorManagerDashboard = location.pathname === '/vendor-manager';
  const isVendorManagerHeadDashboard = location.pathname === '/vendor-manager-head';

  useEffect(() => {
    if (
      !isHiringManagerDashboard &&
      !isVendorDashboard &&
      !isVendorManagerDashboard &&
      !isVendorManagerHeadDashboard
    ) {
      return;
    }

    let mounted = true;

    const loadData = async () => {
      try {
        if (isVendorDashboard) {
          const [vendorJobs, vendorCandidates] = await Promise.all([
            getJobs(),
            getVendorCandidates(),
          ]);
          if (!mounted) return;
          setJobs(vendorJobs || []);
          setCandidates(vendorCandidates || []);
          setVendors([]);
          return;
        }

        const [allJobs, candidateResponse, vendorResponse] = await Promise.all([
          getJobs(),
          api.get('/candidates'),
          isVendorManagerDashboard || isVendorManagerHeadDashboard ? api.get('/vendors') : Promise.resolve({ data: [] }),
        ]);

        if (!mounted) return;

        setJobs(allJobs || []);
        setCandidates(candidateResponse.data || []);
        setVendors(vendorResponse.data || []);
      } catch (error) {
        console.error('Failed to load route dashboard hero', error);
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
  }, [
    isHiringManagerDashboard,
    isVendorDashboard,
    isVendorManagerDashboard,
    isVendorManagerHeadDashboard,
  ]);

  const cards = useMemo(() => {
    if (isHiringManagerDashboard) {
      const createdThisWeek = jobs.filter((job) => isThisWeek(job.createdAt)).length;
      const pendingApprovals = jobs.filter((job) => job.status === 'PENDING_APPROVAL').length;
      const activeCandidates = candidates.length;
      const activeCandidatesThisWeek = candidates.filter((candidate) => isThisWeek(candidate.createdAt)).length;
      const offersExtended = candidates.filter((candidate) =>
        ['IDENTIFIED', 'YET_TO_JOIN', 'ONBOARDED'].includes(candidate.status),
      ).length;
      const offersToday = candidates.filter(
        (candidate) =>
          ['IDENTIFIED', 'YET_TO_JOIN', 'ONBOARDED'].includes(candidate.status) && isToday(candidate.createdAt),
      ).length;

      return [
        { accent: '#01A982', title: 'JOBS CREATED', value: loading ? '...' : jobs.length, helper: `${createdThisWeek} this week`, helperColor: '#01A982' },
        { accent: '#4E86F7', title: 'PENDING APPROVAL', value: loading ? '...' : pendingApprovals, helper: 'Awaiting VM Head', helperColor: '#94A3B8' },
        { accent: '#7C6CF2', title: 'ACTIVE CANDIDATES', value: loading ? '...' : activeCandidates, helper: `${activeCandidatesThisWeek} this week`, helperColor: '#01A982' },
        { accent: '#F59E0B', title: 'OFFERS EXTENDED', value: loading ? '...' : offersExtended, helper: `${offersToday} today`, helperColor: '#01A982' },
      ];
    }

    if (isVendorManagerDashboard) {
      const activeJobs = jobs.filter((job) => !['CLOSED', 'REJECTED'].includes(job.status)).length;
      const activeVendors = vendors.filter((vendor) => vendor.isActive).length;
      const candidatesInPool = candidates.length;
      return [
        { accent: '#01A982', title: 'ACTIVE JOBS', value: loading ? '...' : activeJobs, helper: 'Approved & live', helperColor: '#94A3B8' },
        { accent: '#3B82F6', title: 'VENDORS ASSIGNED', value: loading ? '...' : activeVendors, helper: 'Across all jobs', helperColor: '#01A982' },
        { accent: '#7C6CF2', title: 'CANDIDATES IN POOL', value: loading ? '...' : candidatesInPool, helper: `${candidates.filter((candidate) => isThisWeek(candidate.createdAt)).length} this week`, helperColor: '#01A982' },
        { accent: '#F59E0B', title: 'AVG. TIME TO FILL', value: loading ? '...' : `${getAverageDays(candidates.map((candidate) => candidate.createdAt))}d`, helper: 'Live average', helperColor: '#EF4444' },
      ];
    }

    if (isVendorManagerHeadDashboard) {
      const pendingJobs = jobs.filter((job) => job.status === 'PENDING_APPROVAL').length;
      const approvedJobs = jobs.filter((job) => job.status === 'APPROVED').length;
      const activeVendors = vendors.filter((vendor) => vendor.isActive).length;
      const totalCandidates = candidates.length;
      return [
        { accent: '#EF4444', title: 'PENDING APPROVALS', value: loading ? '...' : pendingJobs, helper: 'Action needed', helperColor: '#EF4444' },
        { accent: '#01A982', title: 'APPROVED JOBS', value: loading ? '...' : approvedJobs, helper: `${jobs.filter((job) => isThisWeek(job.createdAt) && job.status === 'APPROVED').length} this week`, helperColor: '#01A982' },
        { accent: '#3B82F6', title: 'ACTIVE VENDORS', value: loading ? '...' : activeVendors, helper: 'All active', helperColor: '#94A3B8' },
        { accent: '#7C6CF2', title: 'TOTAL CANDIDATES', value: loading ? '...' : totalCandidates, helper: `${candidates.filter((candidate) => isThisWeek(candidate.createdAt)).length} this week`, helperColor: '#01A982' },
      ];
    }

    if (isVendorDashboard) {
      const submittedThisWeek = candidates.filter((candidate) => isThisWeek(candidate.createdAt)).length;
      const interviewCandidates = candidates.filter((candidate) =>
        ['SCREEN_SELECTED', 'TECH_SELECTED', 'IDENTIFIED', 'SELECTED', 'YET_TO_JOIN'].includes(candidate.status),
      ).length;
      const interviewJobsCount = new Set(
        jobs.filter((job) => job.id).map((job) => job.id),
      ).size;
      const offersPlaced = candidates.filter((candidate) => candidate.status === 'ONBOARDED').length;
      return [
        { accent: '#01A982', title: 'ASSIGNED JOBS', value: loading ? '...' : jobs.length, helper: `${jobs.filter((job) => isToday(job.createdAt)).length} new today`, helperColor: '#01A982' },
        { accent: '#3B82F6', title: 'CANDIDATES SUBMITTED', value: loading ? '...' : candidates.length, helper: `${submittedThisWeek} this week`, helperColor: '#01A982' },
        { accent: '#7C6CF2', title: 'IN INTERVIEW STAGE', value: loading ? '...' : interviewCandidates, helper: `Across ${interviewJobsCount} jobs`, helperColor: '#94A3B8' },
        { accent: '#F59E0B', title: 'OFFERS / PLACED', value: loading ? '...' : offersPlaced, helper: 'This quarter', helperColor: '#01A982' },
      ];
    }

    return [];
  }, [
    candidates,
    isHiringManagerDashboard,
    isVendorDashboard,
    isVendorManagerDashboard,
    isVendorManagerHeadDashboard,
    jobs,
    loading,
    vendors,
  ]);

  if (
    !isHiringManagerDashboard &&
    !isVendorDashboard &&
    !isVendorManagerDashboard &&
    !isVendorManagerHeadDashboard
  ) {
    return null;
  }

  const title = isHiringManagerDashboard
    ? 'Hiring manager dashboard'
    : isVendorManagerDashboard
      ? 'Vendor manager dashboard'
      : isVendorManagerHeadDashboard
        ? 'Vendor manager head dashboard'
        : 'Vendor dashboard';

  const subtitle = isHiringManagerDashboard
    ? 'Q2 2026 - HPE India - Welcome back'
    : isVendorManagerDashboard
      ? 'Q2 2026 - Live vendor operations - Welcome back'
      : isVendorManagerHeadDashboard
        ? 'Q2 2026 - HPE India - Welcome back'
        : 'Live recruitment activity';

  return (
    <Card
      round="24px"
      border={{ color: 'rgba(17,24,39,0.08)' }}
      background="white"
      margin={{ bottom: '24px' }}
      style={{ boxShadow: '0 10px 30px rgba(15, 23, 42, 0.06)' }}
    >
      <CardBody pad="32px" gap="24px">
        <Box direction="row" justify="between" align="start" wrap gap="24px">
          <Box gap="8px">
            <Heading level={1} margin="none" size="medium" color="#0B1F44">
              {title}
            </Heading>
            <Text color="#64748B">{subtitle}</Text>
          </Box>

          <Box direction="row" gap="12px">
            {isHiringManagerDashboard && (
              <>
                <Button label="Export" style={secondaryButtonStyle} />
                <Button
                  primary
                  color="#01A982"
                  label="+ Create job opening"
                  onClick={() => navigate('/hiring-manager/jobs/create')}
                  style={heroButtonStyle}
                />
              </>
            )}

            {isVendorManagerDashboard && (
              <Button
                primary
                color="#01A982"
                label="+ Create vendor"
                onClick={() => navigate('/vendor-manager/vendors')}
                style={heroButtonStyle}
              />
            )}
          </Box>
        </Box>

        <Grid columns={['flex', 'flex', 'flex', 'flex']} gap="16px">
          {cards.map((card) => (
            <Card key={card.title} round="20px" border={{ color: 'border-weak' }} background="white" overflow="hidden">
              <Box height="4px" background={card.accent} />
              <CardBody pad="28px" gap="12px">
                <Text size="small" weight="bold" color="#A0A8B8" style={{ letterSpacing: '0.08em' }}>
                  {card.title}
                </Text>
                <Text size="48px" weight="bold" color="#0B1F44">
                  {card.value}
                </Text>
                <Text color={card.helperColor}>{card.helper}</Text>
              </CardBody>
            </Card>
          ))}
        </Grid>
      </CardBody>
    </Card>
  );
};

const isToday = (value?: string) => {
  if (!value) return false;
  const date = new Date(value);
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
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

export default DashboardRouteHero;
