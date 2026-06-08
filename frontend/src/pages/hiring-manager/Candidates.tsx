import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardBody,
  Grid,
  Heading,
  Paragraph,
  Text,
} from 'grommet';
import { Eye } from 'lucide-react';
import api from '../../api/api';
import ResumeModal from '../../components/ResumeModal';
import StageBadge from '../../components/StageBadge';

export type CandidateStatus =
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
  experience?: number;
  resumePath?: string | null;
  status: CandidateStatus;
  vendor?: {
    name?: string;
  };
  job?: {
    title?: string;
  };
}

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
  SELECTED: 'Selected',
};

const HMCandidates = () => {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [resumeCandidate, setResumeCandidate] = useState<Candidate | null>(null);

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const res = await api.get('/candidates');
      setCandidates(res.data || []);
    } catch {
      alert('Failed to load candidates');
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchCandidates();
  }, []);

  return (
    <Box gap="24px">
      <Box>
        <Heading level={2} margin="none" size="32px">
          Candidate Pipeline
        </Heading>
        <Paragraph margin={{ top: '4px', bottom: 'none' }} size="small" color="#6B7280">
          Review submitted candidates and open profiles
        </Paragraph>
      </Box>

      <Box gap="16px">
        {loading && (
          <Card round="20px" background="white" elevation="small">
            <CardBody pad="32px">
              <Text>Loading candidates...</Text>
            </CardBody>
          </Card>
        )}

        {!loading &&
          candidates.map((candidate) => (
            <Card
              key={candidate.id}
              round="24px"
              background="white"
              border={{ color: 'rgba(15,23,42,0.08)' }}
              elevation="small"
              onClick={() => navigate(`/hiring-manager/candidates/${candidate.id}`)}
            >
              <CardBody pad="24px" gap="20px">
                <Box direction="row" justify="between" align="start" gap="16px">
                  <Box gap="12px">
                    <Box direction="row" align="center" gap="12px" wrap>
                      <Text size="xlarge" weight={600} color="#0F172A">
                        {candidate.name}
                      </Text>
                      <StageBadge status={STATUS_LABELS[candidate.status] || candidate.status} />
                    </Box>
                    <Text size="small" color="#64748B">
                      {candidate.email || '-'}
                    </Text>
                  </Box>

                  <Button
                    plain
                    onClick={(event) => {
                      event.stopPropagation();
                      setResumeCandidate(candidate);
                    }}
                    icon={
                      <Box
                        round="12px"
                        border={{ color: '#D6DCE5' }}
                        pad="8px"
                        style={{ color: '#64748B' }}
                      >
                        <Eye size={18} />
                      </Box>
                    }
                  />
                </Box>

                <Grid columns={{ count: 'fit', size: '160px' }} gap="16px">
                <Info label="Contact" value={candidate.phone || '-'} />
                <Info label="Vendor" value={candidate.vendor?.name || '-'} />
                <Info label="Job" value={candidate.job?.title || '-'} />
                <Info
                  label="Experience"
                  value={
                    candidate.experience !== undefined && candidate.experience !== null
                      ? `${candidate.experience} yrs`
                      : '-'
                  }
                />
                <Info label="Status" value={STATUS_LABELS[candidate.status] || candidate.status} />
                </Grid>
              </CardBody>
            </Card>
          ))}

        {!loading && candidates.length === 0 && (
          <Card round="20px" background="white" elevation="small">
            <CardBody pad="40px" align="center">
              <Text size="small" color="#6B7280">
                No candidates found.
              </Text>
            </CardBody>
          </Card>
        )}
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

const Info = ({ label, value }: { label: string; value: string }) => (
  <Box round="16px" background="#F8FAFC" pad={{ horizontal: '16px', vertical: '12px' }}>
    <Text size="xsmall" weight={600} style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }} color="#94A3B8">
      {label}
    </Text>
    <Text margin={{ top: '4px' }} size="small" weight={500} color="#0F172A">
      {value}
    </Text>
  </Box>
);

export default HMCandidates;
