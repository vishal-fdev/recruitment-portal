import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Grid,
  Heading,
  Paragraph,
  Spinner,
  Text,
} from 'grommet';
import api from '../../api/api';
import { authService } from '../../auth/authService';
import { downloadJD, downloadPSQ } from '../../services/jobService';

interface Job {
  id: number;
  title: string;
  location: string;
  level?: string;
  createdAt: string;
  status: string;
  numberOfPositions?: number;
  currentNumberOfPositions?: number;
  jdFileName?: string;
  psqFileName?: string;
  jdFiles?: { fileName: string; path: string; mimeType: string }[];
  psqFiles?: { fileName: string; path: string; mimeType: string }[];
}

const HMJobs = () => {
  const navigate = useNavigate();
  const role = authService.getRole();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchJobs = async () => {
    try {
      const res = await api.get('/jobs');
      setJobs(res.data || []);
    } catch {
      alert('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchJobs();
  }, []);

  const triggerDownload = (link: string) => {
    const anchor = document.createElement('a');
    anchor.href = link;
    anchor.target = '_blank';
    anchor.rel = 'noreferrer';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  };

  return (
    <Box gap="large">
      <Box direction="row" justify="between" align="center" gap="medium" wrap>
        <Box gap="xsmall">
          <Heading level={2} margin="none">
            My job openings
          </Heading>
          <Paragraph size="small" color="dark-4" margin="none">
            Create and manage job openings
          </Paragraph>
        </Box>

        {role === 'HIRING_MANAGER' && (
          <Button
            primary
            color="brand"
            label="+ Create Job"
            onClick={() => navigate('/hiring-manager/jobs/create')}
          />
        )}
      </Box>

      <Box gap="medium">
        {loading && (
          <Card
            background="white"
            round="large"
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
          jobs.map((job) => (
            <Card
              key={job.id}
              background="white"
              round="24px"
              border={{ color: 'rgba(0,0,0,0.08)', size: 'xsmall' }}
              elevation="xsmall"
              onClick={() => navigate(`/hiring-manager/jobs/${job.id}`)}
            >
              <CardBody pad="large" gap="medium">
                <Box direction="row" justify="between" align="start" gap="medium" wrap>
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

                  <Box direction="row" gap="small" wrap>
                    <Button
                      label="Download JD"
                      color="dark-1"
                      primary
                      disabled={!((job.jdFiles?.length ?? 0) > 0 || job.jdFileName)}
                      onClick={(event) => {
                        event.stopPropagation();
                        triggerDownload(downloadJD(job.id));
                      }}
                    />
                    <Button
                      label="Download PSQ"
                      color="dark-1"
                      primary
                      disabled={!((job.psqFiles?.length ?? 0) > 0 || job.psqFileName)}
                      onClick={(event) => {
                        event.stopPropagation();
                        triggerDownload(downloadPSQ(job.id));
                      }}
                    />
                    {(job.status === 'PENDING_APPROVAL' || job.status === 'REJECTED') && (
                      <Button
                        label="Resubmit"
                        primary
                        color="brand"
                        onClick={(event) => {
                          event.stopPropagation();
                          navigate(`/hiring-manager/edit-job/${job.id}`, {
                            state: { job },
                          });
                        }}
                      />
                    )}
                  </Box>
                </Box>

                <Grid columns={{ count: 'fit', size: 'small' }} gap="small">
                  <Info
                    label="Assigned Date"
                    value={new Date(job.createdAt).toLocaleDateString('en-IN')}
                  />
                  <Info label="Total Positions" value={String(job.numberOfPositions ?? 0)} />
                  <Info
                    label="Current Positions"
                    value={String(job.currentNumberOfPositions ?? job.numberOfPositions ?? 0)}
                  />
                  <Info label="Status" value={formatStatus(job.status)} />
                </Grid>
              </CardBody>
            </Card>
          ))}

        {!loading && jobs.length === 0 && (
          <Card
            background="white"
            round="20px"
            pad="large"
            border={{ color: 'border', size: 'xsmall' }}
            elevation="xsmall"
          >
            <Text textAlign="center" size="small" color="dark-4">
              No jobs found.
            </Text>
          </Card>
        )}
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

export default HMJobs;
