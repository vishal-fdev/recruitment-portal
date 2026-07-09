import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import {
  Box,
  Button,
  Card,
  CardBody,
  CheckBox,
  Heading,
  Layer,
  Paragraph,
  Text,
} from 'grommet';
import { getJobs } from '../../services/jobService';
import type { Job } from '../../services/jobService';
import api from '../../api/api';
import StageBadge from '../../components/StageBadge';

interface Vendor {
  id: string;
  name: string;
}

const Jobs = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [openMenu, setOpenMenu] = useState<number | null>(null);
  const [selectedJob, setSelectedJob] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
  const [originalAssigned, setOriginalAssigned] = useState<string[]>([]);

  const fetchJobs = async () => {
    try {
      const data = await getJobs();
      setJobs(data || []);
    } catch (err) {
      console.error('Failed to fetch jobs', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchVendors = async () => {
    const res = await api.get('/vendors');
    setVendors(res.data?.data || res.data || []);
  };

  useEffect(() => {
    void fetchJobs();
    void fetchVendors();
  }, []);

  const updateJobStatus = async (jobId: number, action: string) => {
    try {
      await api.patch(`/jobs/${jobId}/${action}`);
      await fetchJobs();
    } catch (err) {
      console.error(`${action} failed`, err);
      alert(`Failed to ${action} job`);
    }
  };

  const handleDownload = async (jobId: number, fileName?: string) => {
    const res = await api.get(`/jobs/${jobId}/jd/download`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName || `JOB-${jobId}.pdf`;
    link.click();
  };

  const openAssignModal = async (jobId: number) => {
    const res = await api.get(`/jobs/${jobId}`);
    const job = res.data;
    const assigned = job.vendors?.filter((v: any) => v.isEnabled).map((v: any) => v.id) || [];
    setSelectedJob(jobId);
    setOriginalAssigned(assigned);
    setSelectedVendors(assigned);
    setShowModal(true);
    setOpenMenu(null);
  };

  const toggleVendor = (id: string) => {
    setSelectedVendors((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));
  };

  const assignVendors = async () => {
    if (!selectedJob) return;
    const toAssign = selectedVendors.filter((v) => !originalAssigned.includes(v));
    const toRemove = originalAssigned.filter((v) => !selectedVendors.includes(v));

    for (const v of toAssign) {
      await api.patch(`/jobs/${selectedJob}/vendors/${v}`, { isEnabled: true });
    }
    for (const v of toRemove) {
      await api.patch(`/jobs/${selectedJob}/vendors/${v}`, { isEnabled: false });
    }

    await fetchJobs();
    setShowModal(false);
    setSelectedJob(null);
    setOriginalAssigned([]);
    setSelectedVendors([]);
  };

  return (
    <Box gap="medium">
      <Card background="white" round="20px" elevation="xsmall">
        <CardBody pad="medium">
          <Heading level={2} margin="none" style={{ fontSize: 25, fontWeight: 600, lineHeight: 1.15 }}>
            Jobs
          </Heading>
          <Paragraph margin={{ top: 'xsmall', bottom: 'none' }} color="#111827" style={{ fontWeight: 400 }}>
            Manage requisitions, assignments, and job status.
          </Paragraph>
        </CardBody>
      </Card>

      <Box gap="medium">
        {loading ? <Card background="white" round="20px" pad="large" elevation="xsmall"><Text>Loading...</Text></Card> : null}

        {!loading &&
          jobs.map((job) => {
            const totalPositions =
              Number(job.numberOfPositions || 0) +
              (job.positions?.reduce((sum, position) => sum + Number(position.openings || 0), 0) || 0);
            const currentPositions =
              Number(job.currentNumberOfPositions ?? job.numberOfPositions ?? 0) +
              (job.positions?.reduce(
                (sum, position) => sum + Number(position.currentOpenings ?? position.openings ?? 0),
                0,
              ) || 0);

            return (
              <Card
                key={job.id}
                background="white"
                round="24px"
                border={{ color: 'border-weak' }}
                elevation="xsmall"
                onClick={() => navigate(`/vendor-manager/jobs/${job.id}`)}
              >
                <CardBody pad="large" gap="medium">
                  <Box direction="row" justify="between" align="start" gap="medium" wrap>
                    <Box gap="small">
                      <Box direction="row" align="center" gap="small">
                        <Text size="small" weight={600} color="brand">{`HRQ${job.id}`}</Text>
                        <StageBadge status={job.status} />
                      </Box>
                      <Box>
                        <Heading level={3} size="small" margin="none" style={{ fontWeight: 600, lineHeight: 1.2 }}>
                          {job.title}
                        </Heading>
                        <Text color="text-paragraph">{job.location} · Level {job.level || '-'}</Text>
                      </Box>
                    </Box>

                    <Box direction="row" align="center" gap="small" onClick={(event) => event.stopPropagation()}>
                      {job.status === 'APPROVED' ? (
                        <Button
                          label="Assign Vendors"
                          primary
                          color="brand"
                          onClick={() => void openAssignModal(job.id)}
                          style={assignButtonStyle}
                        />
                      ) : null}

                      <Box style={{ position: 'relative' }}>
                        <Button
                          icon={<ChevronDown size={14} />}
                          onClick={() => setOpenMenu(openMenu === job.id ? null : job.id)}
                        />

                        {openMenu === job.id ? (
                          <Card
                            background="white"
                            round="14px"
                            border={{ color: 'border-weak' }}
                            elevation="medium"
                            style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', zIndex: 10, minWidth: 176 }}
                          >
                            <CardBody pad="xsmall" gap="xxsmall">
                              {job.status === 'APPROVED' ? (
                                <MenuButton onClick={() => void openAssignModal(job.id)}>Assign</MenuButton>
                              ) : null}
                              {job.status === 'APPROVED' ? (
                                <MenuButton onClick={() => void updateJobStatus(job.id, 'hold')}>Put on Hold</MenuButton>
                              ) : null}
                              {job.status === 'ON_HOLD' ? (
                                <MenuButton onClick={() => void updateJobStatus(job.id, 'reopen')}>Reopen</MenuButton>
                              ) : null}
                              {job.status !== 'CLOSED' ? (
                                <MenuButton danger onClick={() => void updateJobStatus(job.id, 'close')}>
                                  Close
                                </MenuButton>
                              ) : null}
                            </CardBody>
                          </Card>
                        ) : null}
                      </Box>
                    </Box>
                  </Box>

                  <Box direction="row" wrap gap="small">
                    <Info label="Total Positions" value={String(totalPositions)} />
                    <Info label="Current Positions" value={String(currentPositions)} />
                    <Info
                      label="Assigned Date"
                      value={job.createdAt ? new Date(job.createdAt).toLocaleDateString('en-GB') : '-'}
                    />
                    <Info label="Status" value={formatStatus(job.status)} />
                    <Info
                      label="JD"
                      value={
                        job.jdFileName ? (
                          <Button
                            plain
                            color="brand"
                            label="Download JD"
                            style={downloadButtonStyle}
                            onClick={(event) => {
                              event.stopPropagation();
                              void handleDownload(job.id);
                            }}
                          />
                        ) : (
                          '-'
                        )
                      }
                    />
                  </Box>
                </CardBody>
              </Card>
            );
          })}
      </Box>

      {showModal ? (
        <Layer
          onEsc={() => setShowModal(false)}
          onClickOutside={() => setShowModal(false)}
          responsive={false}
          modal
        >
          <Box pad="large" gap="medium" width="400px">
            <Heading level={3} size="small" margin="none">
              Assign Vendors
            </Heading>
            <Box gap="small">
              {vendors.map((v) => (
                <CheckBox
                  key={v.id}
                  label={v.name}
                  checked={selectedVendors.includes(v.id)}
                  onChange={() => toggleVendor(v.id)}
                />
              ))}
            </Box>
            <Box direction="row" gap="small" justify="end">
              <Button label="Cancel" onClick={() => setShowModal(false)} />
              <Button label="Save" primary color="brand" onClick={() => void assignVendors()} style={assignButtonStyle} />
            </Box>
          </Box>
        </Layer>
      ) : null}
    </Box>
  );
};

const MenuButton = ({
  children,
  onClick,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}) => (
  <Button plain onClick={onClick}>
    <Box pad={{ horizontal: 'small', vertical: 'small' }} round="10px">
      <Text size="small" weight={500} color={danger ? 'status-critical' : 'text-strong'}>
        {children}
      </Text>
    </Box>
  </Button>
);

const Info = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <Box background="#F8FAFC" round="16px" pad={{ horizontal: 'medium', vertical: 'small' }} width="220px">
    <Text size="xsmall" weight={600} color="#94A3B8">
      {label}
    </Text>
    <Box margin={{ top: 'xsmall' }}>
      {typeof value === 'string' ? <Text weight={600} color="#0F172A">{value}</Text> : value}
    </Box>
  </Box>
);

const assignButtonStyle = {
  color: '#FFFFFF',
  background: '#00A982',
  border: 'none',
  borderRadius: '999px',
  fontWeight: 600,
  padding: '9px 20px',
} as const;

const downloadButtonStyle = {
  color: '#0B1220',
  fontWeight: 500,
  padding: 0,
} as const;

const formatStatus = (status: string) =>
  status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());

export default Jobs;
