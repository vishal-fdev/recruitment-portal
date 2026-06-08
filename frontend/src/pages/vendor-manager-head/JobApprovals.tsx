import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardBody,
  Grid,
  Heading,
  Paragraph,
  Spinner,
  Text,
} from 'grommet';
import { getJobs } from '../../services/jobService';
import type { Job } from '../../services/jobService';

const JobApprovals = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    void loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      const all = await getJobs();
      const sorted = all.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      setJobs(sorted);
    } catch {
      console.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const getTotalPositions = (job: Job) => {
    const main = job.numberOfPositions || 0;
    const child = job.positions?.reduce((sum, p) => sum + (p.openings || 0), 0) || 0;
    return main + child;
  };

  const getClosedPositions = (job: Job) => {
    const mainClosed =
      Number(job.numberOfPositions || 0) -
      Number(job.currentNumberOfPositions ?? job.numberOfPositions ?? 0);
    const childClosed =
      job.positions?.reduce(
        (sum, p) => sum + (Number(p.openings || 0) - Number(p.currentOpenings ?? p.openings ?? 0)),
        0,
      ) || 0;
    return mainClosed + childClosed;
  };

  const getCurrentPositions = (job: Job) => getTotalPositions(job) - getClosedPositions(job);

  return (
    <Box gap="large">
      <Box gap="xsmall">
        <Heading level={2} margin="none">
          Job Approval Queue
        </Heading>
        <Paragraph size="small" color="dark-4" margin="none">
          Review, approve or reject job requisitions
        </Paragraph>
      </Box>

      <Box gap="medium">
        {loading && (
          <Card
            background="white"
            round="20px"
            pad="large"
            border={{ color: 'border', size: 'xsmall' }}
            elevation="xsmall"
          >
            <Box direction="row" gap="small" align="center">
              <Spinner size="small" />
              <Text>Loading...</Text>
            </Box>
          </Card>
        )}

        {!loading &&
          jobs.map((job) => {
            const totalPositions = getTotalPositions(job);
            const currentPositions = getCurrentPositions(job);
            const progress = totalPositions
              ? Math.round(((totalPositions - currentPositions) / totalPositions) * 100)
              : 0;

            return (
              <Card
                key={job.id}
                background="white"
                round="24px"
                border={{ color: 'rgba(0,0,0,0.08)', size: 'xsmall' }}
                elevation="xsmall"
                onClick={() => navigate(`/vendor-manager-head/jobs/${job.id}`)}
              >
                <CardBody pad="large" gap="medium">
                  <Box direction="row" justify="between" gap="medium" wrap>
                    <Box gap="small">
                      <Box direction="row" align="center" gap="small" wrap>
                        <Text size="small" weight={600} color="brand">
                          HRQ{job.id}
                        </Text>
                        <StatusBadge status={job.status} />
                      </Box>
                      <Box gap="xxsmall">
                        <Text size="xlarge" weight={600} color="#0F172A">
                          {job.title}
                        </Text>
                        <Text size="small" color="#64748B">
                          {job.location} · Level {job.level || '-'}
                        </Text>
                      </Box>
                    </Box>
                  </Box>

                  <Grid columns={{ count: 'fit', size: 'small' }} gap="small">
                    <Info label="Total Positions" value={String(totalPositions)} />
                    <Info label="Current Positions" value={String(currentPositions)} />
                    <Info
                      label="Created Date"
                      value={job.createdAt ? job.createdAt.split('T')[0] : '-'}
                    />
                    <Info label="Progress" value={`${progress}%`} />
                    <Info label="Status" value={formatStatus(job.status)} />
                  </Grid>
                </CardBody>
              </Card>
            );
          })}
      </Box>
    </Box>
  );
};

const Info = ({ label, value }: { label: string; value: string }) => (
  <Box background="#F8FAFC" round="16px" pad={{ horizontal: 'medium', vertical: 'small' }}>
    <Text size="xsmall" weight={600} color="#94A3B8">
      {label.toUpperCase()}
    </Text>
    <Text margin={{ top: 'xsmall' }} size="small" weight={500} color="#0F172A">
      {value}
    </Text>
  </Box>
);

const StatusBadge = ({ status }: { status: string }) => {
  const colors = getStatusColors(status);

  return (
    <Box
      direction="row"
      align="center"
      gap="xsmall"
      background={colors.background}
      round="full"
      pad={{ horizontal: 'small', vertical: 'xsmall' }}
    >
      <Box width="10px" height="10px" round="full" background={colors.dot} />
      <Text size="xsmall" weight={500} color={colors.text}>
        {formatStatus(status)}
      </Text>
    </Box>
  );
};

const formatStatus = (status: string) =>
  status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());

const getStatusColors = (status: string) => {
  if (status === 'APPROVED') {
    return { background: '#DDFBF2', text: '#0F766E', dot: '#01A982' };
  }
  if (status === 'REJECTED') {
    return { background: '#FEE2E2', text: '#B91C1C', dot: '#EF4444' };
  }
  if (status === 'PENDING_APPROVAL') {
    return { background: '#FEF3C7', text: '#B45309', dot: '#F59E0B' };
  }
  return { background: '#E5E7EB', text: '#64748B', dot: '#94A3B8' };
};

export default JobApprovals;
