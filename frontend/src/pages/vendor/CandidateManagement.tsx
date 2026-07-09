import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
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
import { Eye, Plus } from 'lucide-react';
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

type CandidateFilterField =
  | 'candidateCode'
  | 'candidateName'
  | 'candidateContact';

const FILTER_FIELDS: { label: string; value: CandidateFilterField }[] = [
  { label: 'Candidate Code', value: 'candidateCode' },
  { label: 'Candidate Name', value: 'candidateName' },
  { label: 'Candidate Contact', value: 'candidateContact' },
];

const STATUS_OPTIONS = [
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
  { label: 'Rejected', value: 'REJECTED' },
];

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
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(true);
  const [resumeCandidate, setResumeCandidate] = useState<Candidate | null>(null);
  const [search, setSearch] = useState('');
  const [candidateFilterField, setCandidateFilterField] =
    useState<CandidateFilterField>('candidateCode');
  const [candidateStatusFilter, setCandidateStatusFilter] = useState('ALL');

  const vendorId = localStorage.getItem('vendorId');

  useEffect(() => {
    void loadCandidates();
  }, []);

  const loadCandidates = async () => {
    try {
      setLoadingCandidates(true);
      const res = await api.get('/candidates');
      const allCandidates = res.data || [];
      const visibleCandidates = vendorId
        ? allCandidates.filter(
            (candidate: Candidate) =>
              !candidate.vendor?.id ||
              String(candidate.vendor.id) === String(vendorId),
          )
        : allCandidates;
      setCandidates(visibleCandidates);
    } catch (error) {
      console.error('Failed to load candidates', error);
      setCandidates([]);
    } finally {
      setLoadingCandidates(false);
    }
  };

  const filteredCandidates = useMemo(() => {
    const query = search.trim().toLowerCase();

    return [...candidates]
      .filter((candidate) => {
        const normalizedStatus =
          candidate.status === 'SELECTED' ? 'IDENTIFIED' : candidate.status;

        if (
          candidateStatusFilter !== 'ALL' &&
          normalizedStatus !== candidateStatusFilter
        ) {
          return false;
        }

        if (!query) {
          return true;
        }

        const searchable = {
          candidateCode: `CA${candidate.id}`,
          candidateName: candidate.name,
          candidateContact: candidate.phone || '',
        };

        return searchable[candidateFilterField].toLowerCase().includes(query);
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime(),
      );
  }, [candidateFilterField, candidateStatusFilter, candidates, search]);

  return (
    <Box gap="24px">
      <Box>
        <Heading level={2} margin="none" size="32px" color="#102A43">
          Candidate Management
        </Heading>
        <Text margin={{ top: '6px' }} size="15px" color="#50668A">
          Manage candidates, hiring requests, and review processes
        </Text>
      </Box>

      <Box
        round="22px"
        border={{ color: '#DDE5EF' }}
        background="white"
        pad="16px"
        elevation="small"
        gap="16px"
      >
        <Box direction="row" wrap justify="between" align="center" gap="16px">
          <Box direction="row" wrap align="center" gap="12px">
            <Box width={{ min: '180px', max: '190px' }}>
              <Select
                value={candidateFilterField}
                options={FILTER_FIELDS}
                labelKey="label"
                valueKey={{ key: 'value', reduce: true }}
                onChange={({ value }) =>
                  setCandidateFilterField(value as CandidateFilterField)
                }
                style={selectStyle}
              />
            </Box>

            <Box width={{ min: '280px', max: '320px' }}>
              <TextInput
                value={search}
                onChange={(event) => setSearch(event.currentTarget.value)}
                placeholder="Search records..."
                style={inputStyle}
              />
            </Box>
          </Box>

          <Box direction="row" wrap align="center" gap="12px">
            <Box width={{ min: '150px', max: '170px' }}>
              <Select
                value={candidateStatusFilter}
                onChange={({ value }) => setCandidateStatusFilter(value)}
                options={STATUS_OPTIONS}
                labelKey="label"
                valueKey={{ key: 'value', reduce: true }}
                style={selectStyle}
              />
            </Box>

            <Button
              type="button"
              onClick={() => navigate('/vendor/candidates/create')}
              icon={<Plus size={15} />}
              label="Create"
              plain
              style={{
                borderRadius: 12,
                color: '#047857',
                fontSize: 14,
                fontWeight: 600,
                padding: '10px 12px',
              }}
            />
          </Box>
        </Box>

        <Box round="10px" border={{ color: '#DDE5EF' }} overflow="auto">
          <Table>
            <TableHeader background="#8CEEDB">
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
                  <TableCell colSpan={11} pad={{ horizontal: '16px', vertical: '44px' }}>
                    <Box align="center">
                      <Text color="#8AA0C3">Loading candidates...</Text>
                    </Box>
                  </TableCell>
                </TableRow>
              )}

              {!loadingCandidates &&
                filteredCandidates.map((candidate) => (
                  <TableRow
                    key={candidate.id}
                    border={{ side: 'top', color: '#EEF2F7' }}
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
                    <BodyCell>{candidate.experience ?? '-'}</BodyCell>
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
                  <TableCell colSpan={11} pad={{ horizontal: '16px', vertical: '48px' }}>
                    <Box align="center">
                      <Text color="#8AA0C3">No candidates found.</Text>
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
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

const selectStyle = {
  borderRadius: 10,
  color: '#0F172A',
  fontSize: 14,
  minHeight: 44,
};

const inputStyle = {
  borderRadius: 10,
  color: '#0F172A',
  fontSize: 14,
  minHeight: 44,
};

const HeaderCell = ({ children }: { children: ReactNode }) => (
  <TableCell pad={{ horizontal: '16px', vertical: '16px' }}>
    <Text
      size="12px"
      weight={600}
      color="#0F2A3F"
      style={{
        letterSpacing: '0.02em',
        lineHeight: 1.2,
        textTransform: 'uppercase',
      }}
    >
      {children}
    </Text>
  </TableCell>
);

const BodyCell = ({ children }: { children: ReactNode }) => (
  <TableCell pad={{ horizontal: '16px', vertical: '15px' }} verticalAlign="middle">
    <Text
      size="13px"
      color="#1F3656"
      weight={400}
      style={{ lineHeight: 1.35 }}
    >
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
  <TableCell pad={{ horizontal: '16px', vertical: '15px' }} verticalAlign="middle">
    <Button
      type="button"
      onClick={onClick}
      plain
      label={children}
      style={{
        color: '#009B77',
        fontSize: 13,
        fontWeight: 600,
        lineHeight: 1.35,
        padding: 0,
      }}
    />
  </TableCell>
);

const formatDate = (value?: string) => {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('en-GB');
};
