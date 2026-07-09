import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardBody,
  Grid,
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
    <Box gap="26px">
      <Box direction="row" justify="between" align="center" gap="medium" wrap>
        <Box gap="2px">
          <Text size="26px" weight={700} color="#0B1220" style={{ lineHeight: 1.12 }}>
            My job openings
          </Text>
          <Text size="13px" color="#526179">
            Create and manage job openings
          </Text>
        </Box>

        {role === 'HIRING_MANAGER' && (
          <Button
            primary
            color="#00A982"
            label="+ Create Job"
            onClick={() => navigate('/hiring-manager/jobs/create')}
            style={{
              borderRadius: '14px',
              padding: '13px 22px',
              fontSize: '13px',
              fontWeight: 700,
              color: '#FFFFFF',
              boxShadow: '0 12px 22px rgba(1, 169, 130, 0.18)',
            }}
          />
        )}
      </Box>

      <Box gap="16px">
        {loading && (
          <Box
            background="white"
            round="20px"
            pad={{ horizontal: '28px', vertical: '34px' }}
            border={{ color: '#DDE3EB' }}
            style={{ boxShadow: '0 2px 6px rgba(15, 23, 42, 0.06)' }}
          >
            <Box direction="row" gap="small" align="center">
              <Spinner size="small" />
              <Text size="14px" color="#526179">Loading...</Text>
            </Box>
          </Box>
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
                    <button
                      type="button"
                      disabled={!((job.jdFiles?.length ?? 0) > 0 || job.jdFileName)}
                      onClick={(event) => {
                        event.stopPropagation();
                        if (!((job.jdFiles?.length ?? 0) > 0 || job.jdFileName)) return;
                        triggerDownload(downloadJD(job.id));
                      }}
                      style={actionButtonStyle(!((job.jdFiles?.length ?? 0) > 0 || job.jdFileName))}
                    >
                      Download JD
                    </button>
                    <button
                      type="button"
                      disabled={!((job.psqFiles?.length ?? 0) > 0 || job.psqFileName)}
                      onClick={(event) => {
                        event.stopPropagation();
                        if (!((job.psqFiles?.length ?? 0) > 0 || job.psqFileName)) return;
                        triggerDownload(downloadPSQ(job.id));
                      }}
                      style={actionButtonStyle(!((job.psqFiles?.length ?? 0) > 0 || job.psqFileName))}
                    >
                      Download PSQ
                    </button>
                    {(job.status === 'PENDING_APPROVAL' || job.status === 'REJECTED') && (
                      <Button
                        label="Resubmit"
                        primary
                        color="brand"
                        style={{
                          borderRadius: '999px',
                          minHeight: '37px',
                          padding: '8px 20px',
                          color: '#FFFFFF',
                          fontSize: '16px',
                          fontWeight: 700,
                          background: '#00A982',
                          border: 'none',
                        }}
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
          <Box
            background="white"
            round="20px"
            border={{ color: '#DDE3EB' }}
            height="102px"
            align="center"
            justify="center"
            style={{ boxShadow: '0 2px 6px rgba(15, 23, 42, 0.06)' }}
          >
            <Text textAlign="center" size="14px" color="#526179">
              No jobs found.
            </Text>
          </Box>
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

const actionButtonStyle = (isDisabled: boolean) => ({
  minHeight: '37px',
  minWidth: '156px',
  padding: '8px 18px',
  border: 'none',
  borderRadius: '999px',
  background: isDisabled ? '#333333' : '#1F2937',
  color: '#FFFFFF',
  opacity: isDisabled ? 0.92 : 1,
  fontSize: '16px',
  fontWeight: 700,
  lineHeight: 1,
  cursor: isDisabled ? 'not-allowed' : 'pointer',
});

const StatusBadge = ({ status }: { status: string }) => {
  const colors = getStatusColors(status);

  return (
    <Box
      direction="row"
      align="center"
      gap="xsmall"
      background={colors.background}
      round="full"
      pad={{ horizontal: '12px', vertical: '5px' }}
      style={{
        minHeight: 28,
        boxShadow: `inset 0 0 0 1px ${colors.border}`,
      }}
    >
      <Box width="9px" height="9px" round="full" background={colors.dot} />
      <Text size="12px" weight={700} color={colors.text}>
        {formatStatus(status)}
      </Text>
    </Box>
  );
};

const formatStatus = (status: string) =>
  status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());

const getStatusColors = (status: string) => {
  if (status === 'APPROVED') {
    return { background: '#DDFBF2', text: '#007C65', dot: '#01A982', border: '#C9F8EA' };
  }
  if (status === 'REJECTED') {
    return { background: '#FEE2E2', text: '#B91C1C', dot: '#EF4444', border: '#FECACA' };
  }
  if (status === 'PENDING_APPROVAL') {
    return { background: '#FFF1C7', text: '#B46000', dot: '#F59E0B', border: '#FFE5A3' };
  }
  return { background: '#E5E7EB', text: '#64748B', dot: '#94A3B8', border: '#D9DEE7' };
};

export default HMJobs;
