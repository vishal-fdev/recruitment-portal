import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Button,
  Grid,
  Heading,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
  Text,
  TextInput,
} from 'grommet';
import {
  Eye,
  Filter,
  ListChecks,
  Plus,
  ReceiptText,
} from 'lucide-react';
import api from '../../api/api';
import ResumeModal from '../../components/ResumeModal';
import StageBadge from '../../components/StageBadge';

type CandidateStatus =
  | 'NEW'
  | 'SUBMITTED'
  | 'SCREENING'
  | 'SCREEN_SELECTED'
  | 'SCREEN_REJECTED'
  | 'TECH_SELECTED'
  | 'TECH_REJECTED'
  | 'IDENTIFIED'
  | 'YET_TO_JOIN'
  | 'OPS_SELECTED'
  | 'OPS_REJECTED'
  | 'ONBOARDED'
  | 'DROPPED'
  | 'REJECTED'
  | 'SELECTED';

interface Candidate {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  experience: number;
  resumePath?: string | null;
  status: CandidateStatus;
  createdAt: string;
  vendor?: {
    id?: string | number;
    name?: string;
  };
  job?: {
    id?: number;
    title?: string;
  };
}

interface Job {
  id: number;
  title: string;
  location: string;
  experience: string;
  status: string;
  numberOfPositions?: number;
  currentNumberOfPositions?: number;
  jdFileName?: string;
  psqFileName?: string;
  jdFiles?: {
    fileName: string;
  }[];
  psqFiles?: {
    fileName: string;
  }[];
  positions?: {
    id: number;
    openings?: number;
    currentOpenings?: number;
  }[];
}

type VendorTab = 'CANDIDATES' | 'HRQ';
type CandidateFilterField =
  | 'candidateCode'
  | 'candidateName'
  | 'candidateContact';

const STATUS_LABELS: Record<CandidateStatus, string> = {
  NEW: 'New',
  SUBMITTED: 'Submitted',
  SCREENING: 'Screening',
  SCREEN_SELECTED: 'Screen Select',
  SCREEN_REJECTED: 'Screen Reject',
  TECH_SELECTED: 'Tech Select',
  TECH_REJECTED: 'Tech Reject',
  IDENTIFIED: 'Identified',
  YET_TO_JOIN: 'YTJ',
  OPS_SELECTED: 'Ops Select',
  OPS_REJECTED: 'Ops Reject',
  ONBOARDED: 'Onboarded',
  DROPPED: 'Drop',
  REJECTED: 'Rejected',
  SELECTED: 'Ops Select',
};

const VendorCandidateManagement = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState<VendorTab>(
    searchParams.get('tab')?.toLowerCase() === 'hrq' ? 'HRQ' : 'CANDIDATES',
  );
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(true);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [resumeCandidate, setResumeCandidate] = useState<Candidate | null>(null);
  const [search, setSearch] = useState('');
  const [candidateFilterField, setCandidateFilterField] =
    useState<CandidateFilterField>('candidateCode');
  const [candidateStatusFilter, setCandidateStatusFilter] = useState('ALL');

  const vendorId = localStorage.getItem('vendorId');

  useEffect(() => {
    void loadCandidates();
    void loadJobs();
  }, []);

  useEffect(() => {
    const tab = searchParams.get('tab')?.toLowerCase();
    if (tab === 'hrq' && activeTab !== 'HRQ') {
      setActiveTab('HRQ');
    }
    if ((!tab || tab === 'candidates') && activeTab !== 'CANDIDATES') {
      setActiveTab('CANDIDATES');
    }
  }, [activeTab, searchParams]);

  const handleTabChange = (tab: VendorTab) => {
    setActiveTab(tab);
    setSearchParams(tab === 'HRQ' ? { tab: 'hrq' } : {});
  };

  const loadCandidates = async () => {
    try {
      setLoadingCandidates(true);
      const res = await api.get('/candidates');
      const filtered = vendorId
        ? res.data.filter(
            (candidate: Candidate) =>
              String(candidate.vendor?.id) === String(vendorId),
          )
        : res.data;
      setCandidates(filtered);
    } catch (error) {
      console.error('Failed to load candidates', error);
      setCandidates([]);
    } finally {
      setLoadingCandidates(false);
    }
  };

  const loadJobs = async () => {
    try {
      setLoadingJobs(true);
      const res = await api.get('/jobs');
      setJobs((res.data || []).sort((a: Job, b: Job) => b.id - a.id));
    } catch (error) {
      console.error('Failed to load jobs', error);
      setJobs([]);
    } finally {
      setLoadingJobs(false);
    }
  };

  const filteredCandidates = useMemo(() => {
    const query = search.trim().toLowerCase();

    return [...candidates]
      .filter((candidate) => {
        if (candidateStatusFilter !== 'ALL') {
          const normalizedStatus =
            candidate.status === 'SELECTED' ? 'IDENTIFIED' : candidate.status;
          if (normalizedStatus !== candidateStatusFilter) {
            return false;
          }
        }

        if (!query) {
          return true;
        }

        const code = `CA${candidate.id}`.toLowerCase();
        const name = candidate.name.toLowerCase();
        const contact = (candidate.phone || '').toLowerCase();
        const email = (candidate.email || '').toLowerCase();
        const role = (candidate.job?.title || '').toLowerCase();

        switch (candidateFilterField) {
          case 'candidateCode':
            return code.includes(query);
          case 'candidateName':
            return name.includes(query) || email.includes(query);
          case 'candidateContact':
            return contact.includes(query);
          default:
            return (
              code.includes(query) ||
              name.includes(query) ||
              contact.includes(query) ||
              email.includes(query) ||
              role.includes(query)
            );
        }
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime(),
      );
  }, [candidateFilterField, candidateStatusFilter, candidates, search]);

  const filteredJobs = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return jobs;

    return jobs.filter(
      (job) =>
        `HRQ${job.id}`.toLowerCase().includes(query) ||
        job.title?.toLowerCase().includes(query) ||
        job.location?.toLowerCase().includes(query),
    );
  }, [jobs, search]);

  const handleFileDownload = async (
    event: React.MouseEvent,
    jobId: number,
    fileType: 'jd' | 'psq',
    fileName?: string,
    fileIndex?: number,
  ) => {
    event.stopPropagation();

    const downloadPath =
      typeof fileIndex === 'number'
        ? `/jobs/${jobId}/${fileType}/download/${fileIndex}`
        : `/jobs/${jobId}/${fileType}/download`;

    const response = await api.get(downloadPath, {
      responseType: 'blob',
    });

    const blob = new Blob([response.data]);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName || `JOB-${jobId}-${fileType.toUpperCase()}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const getVendorJobStatusLabel = (status: string) => {
    if (status === 'APPROVED' || status === 'PENDING_APPROVAL') {
      return 'OPEN';
    }
    if (status === 'ON_HOLD') {
      return 'HOLD';
    }
    if (status === 'CLOSED') {
      return 'CLOSED';
    }
    return status.replace(/_/g, ' ');
  };

  const getVendorJobStatusClass = (status: string) => {
    const label = getVendorJobStatusLabel(status);
    if (label === 'OPEN') {
      return 'bg-emerald-50 text-emerald-700';
    }
    if (label === 'HOLD') {
      return 'bg-amber-100 text-amber-700';
    }
    if (label === 'CLOSED') {
      return 'bg-slate-100 text-slate-600';
    }
    return 'bg-slate-100 text-slate-600';
  };

  return (
    <Box gap="24px">
      <Box>
        <Heading level={2} margin="none" size="32px" color="#1E293B">
          Candidate Management
        </Heading>
        <Text margin={{ top: '4px' }} size="small" color="#64748B">
          Manage candidates, hiring requests, and review processes
        </Text>
      </Box>

      <Box
        round="24px"
        border={{ color: '#E5E7EB' }}
        background="white"
        pad="12px"
        elevation="small"
      >
        <Box direction="row" wrap gap="12px">
          <TabButton
            active={activeTab === 'CANDIDATES'}
            icon={<ListChecks size={16} />}
            label="Candidates List"
            onClick={() => handleTabChange('CANDIDATES')}
          />
          <TabButton
            active={activeTab === 'HRQ'}
            icon={<ReceiptText size={16} />}
            label="All HRQID"
            onClick={() => handleTabChange('HRQ')}
          />
        </Box>
      </Box>

      <Box
        round="24px"
        border={{ color: '#E5E7EB' }}
        background="white"
        pad="16px"
        elevation="small"
        gap="16px"
      >
        <Box direction="row" wrap justify="between" align="center" gap="16px">
          <Box direction="row" wrap align="center" gap="12px">
            {activeTab === 'CANDIDATES' ? (
              <Box width={{ min: '220px', max: '260px' }}>
                <Select
                value={candidateFilterField}
                options={[
                  { label: 'Candidate Code', value: 'candidateCode' },
                  { label: 'Candidate Name', value: 'candidateName' },
                  { label: 'Candidate Contact', value: 'candidateContact' },
                ]}
                labelKey="label"
                valueKey={{ key: 'value', reduce: true }}
                onChange={({ value }) =>
                  setCandidateFilterField(value as CandidateFilterField)
                }
              />
              </Box>
            ) : (
              <Box
                direction="row"
                align="center"
                gap="8px"
                round="12px"
                border={{ color: '#E5E7EB' }}
                background="white"
                pad={{ horizontal: '16px', vertical: '10px' }}
              >
                <Text size="small" weight={500} color="#334155">
                  HRQ ID
                </Text>
                <Filter size={15} color="#10B981" />
              </Box>
            )}

            <Box width={{ min: '260px', max: '320px' }}>
              <TextInput
              value={search}
              onChange={(event) => setSearch(event.currentTarget.value)}
              placeholder="Search records..."
              style={{ borderRadius: 12, fontSize: 14, minHeight: 44 }}
            />
            </Box>
          </Box>

          <Box direction="row" wrap align="center" gap="12px">
            {activeTab === 'CANDIDATES' ? (
              <Box width={{ min: '220px', max: '240px' }}>
                <Select
                value={candidateStatusFilter}
                onChange={({ value }) => setCandidateStatusFilter(value)}
                options={[
                  { label: 'All Status', value: 'ALL' },
                  { label: 'Submitted', value: 'SUBMITTED' },
                  { label: 'Screen Select', value: 'SCREEN_SELECTED' },
                  { label: 'Screen Reject', value: 'SCREEN_REJECTED' },
                  { label: 'Tech Select', value: 'TECH_SELECTED' },
                  { label: 'Tech Reject', value: 'TECH_REJECTED' },
                  { label: 'Identified', value: 'IDENTIFIED' },
                  { label: 'YTJ', value: 'YET_TO_JOIN' },
                  { label: 'Ops Select', value: 'OPS_SELECTED' },
                  { label: 'Ops Reject', value: 'OPS_REJECTED' },
                  { label: 'Onboarded', value: 'ONBOARDED' },
                  { label: 'Drop', value: 'DROPPED' },
                ]}
                labelKey="label"
                valueKey={{ key: 'value', reduce: true }}
              />
              </Box>
            ) : null}

            <Button
              type="button"
              onClick={() => navigate('/vendor/candidates/create')}
              icon={<Plus size={15} />}
              label="Create"
              style={{
                borderRadius: 12,
                padding: '8px 12px',
                color: '#047857',
                fontSize: 14,
                fontWeight: 500,
              }}
            />
          </Box>
        </Box>

        <Box round="12px" border={{ color: '#E5E7EB' }} overflow="auto">
          {activeTab === 'CANDIDATES' ? (
            <Table>
              <TableHeader background="#96f7e4">
                <TableRow>
                  <HeaderCell>Candidate Code</HeaderCell>
                  <HeaderCell>Candidate Name</HeaderCell>
                  <HeaderCell>Candidate Email</HeaderCell>
                  <HeaderCell>Candidate Contact</HeaderCell>
                  <HeaderCell>Created Date</HeaderCell>
                  <HeaderCell>Role Hired For</HeaderCell>
                  <HeaderCell>Experience</HeaderCell>
                  <HeaderCell>Resume</HeaderCell>
                  <HeaderCell>Partner</HeaderCell>
                  <HeaderCell>Acknowledged</HeaderCell>
                  <HeaderCell>Status</HeaderCell>
                </TableRow>
              </TableHeader>
              <TableBody background="white">
                {loadingCandidates && (
                  <TableRow>
                    <TableCell colSpan={11} pad={{ horizontal: '16px', vertical: '40px' }}>
                      <Box align="center">
                        <Text color="#94A3B8">Loading candidates...</Text>
                      </Box>
                    </TableCell>
                  </TableRow>
                )}

                {!loadingCandidates &&
                  filteredCandidates.map((candidate) => (
                    <TableRow
                      key={candidate.id}
                      border={{ side: 'top', color: '#F3F4F6' }}
                    >
                      <BodyLinkCell
                        onClick={() => navigate(`/vendor/candidates/${candidate.id}`)}
                      >
                        {`CA${candidate.id}`}
                      </BodyLinkCell>
                      <BodyCell>{candidate.name}</BodyCell>
                      <BodyCell>{candidate.email || '-'}</BodyCell>
                      <BodyCell>{candidate.phone || '-'}</BodyCell>
                      <BodyCell>{formatDate(candidate.createdAt)}</BodyCell>
                      <BodyCell>{candidate.job?.title || '-'}</BodyCell>
                      <BodyCell>{candidate.experience}</BodyCell>
                      <BodyCell>
                        <Button
                          type="button"
                          onClick={() => setResumeCandidate(candidate)}
                          plain
                          icon={<Eye size={17} color="#64748B" />}
                        />
                      </BodyCell>
                      <BodyCell>{candidate.vendor?.name || '-'}</BodyCell>
                      <BodyCell>No</BodyCell>
                      <BodyCell>
                        <StageBadge
                          label={STATUS_LABELS[candidate.status]}
                          status={candidate.status}
                        />
                      </BodyCell>
                    </TableRow>
                  ))}

                {!loadingCandidates && filteredCandidates.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={11} pad={{ horizontal: '16px', vertical: '40px' }}>
                      <Box align="center">
                        <Text color="#94A3B8">No candidates found.</Text>
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          ) : (
            <Table>
              <TableHeader background="#96f7e4">
                <TableRow>
                  <HeaderCell>HRQ ID</HeaderCell>
                  <HeaderCell>Role Hired For</HeaderCell>
                  <HeaderCell>Location</HeaderCell>
                  <HeaderCell>Experience</HeaderCell>
                  <HeaderCell>Total Positions</HeaderCell>
                  <HeaderCell>Current Positions</HeaderCell>
                  <HeaderCell>Status</HeaderCell>
                  <HeaderCell>JD</HeaderCell>
                  <HeaderCell>PSQ</HeaderCell>
                  <HeaderCell>Action</HeaderCell>
                </TableRow>
              </TableHeader>
              <TableBody background="white">
                {loadingJobs && (
                  <TableRow>
                    <TableCell colSpan={10} pad={{ horizontal: '16px', vertical: '40px' }}>
                      <Box align="center">
                        <Text color="#94A3B8">Loading HRQ IDs...</Text>
                      </Box>
                    </TableCell>
                  </TableRow>
                )}

                {!loadingJobs &&
                  filteredJobs.map((job) => {
                    const additionalTotal =
                      job.positions?.reduce(
                        (sum, position) => sum + Number(position.openings || 0),
                        0,
                      ) || 0;
                    const additionalCurrent =
                      job.positions?.reduce(
                        (sum, position) =>
                          sum + Number(position.currentOpenings ?? position.openings ?? 0),
                        0,
                      ) || 0;

                    return (
                      <TableRow
                        key={job.id}
                        border={{ side: 'top', color: '#F3F4F6' }}
                      >
                        <BodyLinkCell
                          onClick={() => navigate(`/vendor/jobs/${job.id}`)}
                        >
                          {`HRQ${job.id}`}
                        </BodyLinkCell>
                        <BodyCell>{job.title}</BodyCell>
                        <BodyCell>{job.location}</BodyCell>
                        <BodyCell>{job.experience}</BodyCell>
                        <BodyCell>
                          {Number(job.numberOfPositions || 0) + additionalTotal}
                        </BodyCell>
                        <BodyCell>
                          {Number(job.currentNumberOfPositions ?? job.numberOfPositions ?? 0) +
                            additionalCurrent}
                        </BodyCell>
                        <BodyCell>
                          <VendorJobStatusBadge status={job.status} />
                        </BodyCell>
                        <BodyCell>
                          {(job.jdFiles?.length || job.jdFileName) ? (
                            <Box gap="4px" align="center">
                              {(job.jdFiles?.length ? job.jdFiles : [{ fileName: job.jdFileName! }]).map(
                                (file, index) => (
                                  <Button
                                    key={`jd-${job.id}-${file.fileName}-${index}`}
                                    type="button"
                                    onClick={(event) =>
                                      void handleFileDownload(
                                        event,
                                        job.id,
                                        'jd',
                                        file.fileName,
                                        job.jdFiles?.length ? index : undefined,
                                      )
                                    }
                                    plain
                                    label={job.jdFiles?.length ? `Download JD ${index + 1}` : 'Download JD'}
                                    style={{ fontWeight: 500, color: '#059669' }}
                                  />
                                ),
                              )}
                            </Box>
                          ) : (
                            '-'
                          )}
                        </BodyCell>
                        <BodyCell>
                          {(job.psqFiles?.length || job.psqFileName) ? (
                            <Box gap="4px" align="center">
                              {(job.psqFiles?.length ? job.psqFiles : [{ fileName: job.psqFileName! }]).map(
                                (file, index) => (
                                  <Button
                                    key={`psq-${job.id}-${file.fileName}-${index}`}
                                    type="button"
                                    onClick={(event) =>
                                      void handleFileDownload(
                                        event,
                                        job.id,
                                        'psq',
                                        file.fileName,
                                        job.psqFiles?.length ? index : undefined,
                                      )
                                    }
                                    plain
                                    label={job.psqFiles?.length ? `Download PSQ ${index + 1}` : 'Download PSQ'}
                                    style={{ fontWeight: 500, color: '#059669' }}
                                  />
                                ),
                              )}
                            </Box>
                          ) : (
                            '-'
                          )}
                        </BodyCell>
                        <BodyCell>
                          <Button
                            type="button"
                            onClick={() =>
                              navigate(`/vendor/candidates/create?jobId=${job.id}`)
                            }
                            label="Create"
                            primary
                            color="#10B981"
                            style={{
                              borderRadius: 8,
                              padding: '8px 16px',
                              fontSize: 12,
                              fontWeight: 500,
                            }}
                          />
                        </BodyCell>
                      </TableRow>
                    );
                  })}

                {!loadingJobs && filteredJobs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} pad={{ horizontal: '16px', vertical: '40px' }}>
                      <Box align="center">
                        <Text color="#94A3B8">No HRQ IDs found.</Text>
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </Box>
      </Box>

      {resumeCandidate && (
        <ResumeModal
          candidateId={resumeCandidate.id}
          resumePath={resumeCandidate.resumePath}
          onClose={() => setResumeCandidate(null)}
        />
      )}
    </Box>
  );
};

export default VendorCandidateManagement;

const TabButton = ({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) => (
  <Button
    type="button"
    onClick={onClick}
    icon={icon}
    label={label}
    primary={active}
    color={active ? '#10B981' : '#F5F3FF'}
    style={{
      borderRadius: 18,
      padding: '12px 16px',
      fontSize: 14,
      fontWeight: 500,
      color: active ? '#FFFFFF' : '#7C3AED',
      boxShadow: active ? '0 14px 30px rgba(16,185,129,0.18)' : 'none',
    }}
  />
);

const HeaderCell = ({ children }: { children: ReactNode }) => (
  <TableCell pad={{ horizontal: '16px', vertical: '16px' }}>
    <Text size="xsmall" weight={600} style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>
      {children}
    </Text>
  </TableCell>
);

const BodyCell = ({ children }: { children: ReactNode }) => (
  <TableCell pad={{ horizontal: '16px', vertical: '16px' }} verticalAlign="middle">
    <Text size="small" color="#334155">
      {children}
    </Text>
  </TableCell>
);

const BodyLinkCell = ({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) => (
  <TableCell pad={{ horizontal: '16px', vertical: '16px' }} verticalAlign="middle">
    <Button
      type="button"
      onClick={onClick}
      plain
      label={children}
      style={{ fontWeight: 500, color: '#059669' }}
    />
  </TableCell>
);

const VendorJobStatusBadge = ({ status }: { status: string }) => {
  const label = getVendorJobStatusLabel(status);
  const colors =
    label === 'OPEN'
      ? { background: '#ECFDF5', color: '#047857' }
      : label === 'HOLD'
        ? { background: '#FEF3C7', color: '#B45309' }
        : { background: '#F1F5F9', color: '#475569' };

  return (
    <Box alignSelf="center" round="999px" background={colors.background} pad={{ horizontal: '12px', vertical: '6px' }}>
      <Text size="xsmall" weight={600} color={colors.color}>
        {label}
      </Text>
    </Box>
  );
};

const formatDate = (value?: string) => {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('en-GB');
};
