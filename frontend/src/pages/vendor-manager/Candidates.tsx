import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardBody,
  Grid,
  Heading,
  Layer,
  Paragraph,
  Text,
  TextArea,
  TextInput,
} from 'grommet';
import { Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api';
import ResumeModal from '../../components/ResumeModal';
import StageBadge from '../../components/StageBadge';

type CandidateStatus =
  | 'SUBMITTED'
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
  | 'NEW'
  | 'SCREENING'
  | 'TECH'
  | 'OPS'
  | 'SELECTED'
  | 'REJECTED';

interface Candidate {
  id: number;
  name: string;
  email: string;
  phone?: string;
  experience?: number;
  dateOfJoining?: string;
  ytjJustification?: string;
  resumePath?: string | null;
  vendor?: {
    name: string;
  };
  job?: {
    title: string;
  };
  status: CandidateStatus;
}

const STATUS_LABELS: Record<CandidateStatus, string> = {
  SUBMITTED: 'Submitted',
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
  NEW: 'New',
  SCREENING: 'Screening',
  TECH: 'Tech',
  OPS: 'Ops',
  SELECTED: 'Selected',
  REJECTED: 'Rejected',
};

const Candidates = () => {
  const navigate = useNavigate();
  const today = new Date().toLocaleDateString('en-CA');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [resumeCandidate, setResumeCandidate] = useState<Candidate | null>(null);
  const [dropCandidate, setDropCandidate] = useState<Candidate | null>(null);
  const [dropJustification, setDropJustification] = useState('');
  const [ytjCandidate, setYtjCandidate] = useState<Candidate | null>(null);
  const [ytjDateOfJoining, setYtjDateOfJoining] = useState('');
  const [ytjJustification, setYtjJustification] = useState('');
  const [finalizeCandidate, setFinalizeCandidate] = useState<Candidate | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [autoPromptedCandidateIds, setAutoPromptedCandidateIds] = useState<number[]>([]);

  const loadCandidates = async () => {
    try {
      const res = await api.get('/candidates');
      setCandidates(res.data || []);
    } catch {
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCandidates();
  }, []);

  useEffect(() => {
    const dueCandidate = candidates.find(
      (candidate) =>
        candidate.status === 'YET_TO_JOIN' &&
        candidate.dateOfJoining === today &&
        !autoPromptedCandidateIds.includes(candidate.id),
    );

    if (dueCandidate && !finalizeCandidate) {
      setFinalizeCandidate(dueCandidate);
      setAutoPromptedCandidateIds((prev) => [...prev, dueCandidate.id]);
    }
  }, [autoPromptedCandidateIds, candidates, finalizeCandidate, today]);

  const openResume = (candidate: Candidate, e: React.MouseEvent) => {
    e.stopPropagation();
    setResumeCandidate(candidate);
  };

  const closeModal = () => {
    setResumeCandidate(null);
  };

  const updateCandidateStatus = async (
    candidateId: number,
    status: 'YET_TO_JOIN' | 'ONBOARDED' | 'DROPPED',
    options?: { dropJustification?: string; dateOfJoining?: string; ytjJustification?: string },
  ) => {
    try {
      setUpdatingId(candidateId);
      await api.patch(`/candidates/${candidateId}/status`, {
        status,
        dropJustification: options?.dropJustification,
        dateOfJoining: options?.dateOfJoining,
        ytjJustification: options?.ytjJustification,
      });
      await loadCandidates();
    } catch (error) {
      console.error('Failed to update candidate status', error);
      alert(`Failed to mark candidate as ${status.toLowerCase()}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const canMarkYtj = (status: CandidateStatus) =>
    ['IDENTIFIED', 'OPS_SELECTED', 'SELECTED'].includes(status);
  const canFinalize = (candidate: Candidate) =>
    candidate.status === 'YET_TO_JOIN' && candidate.dateOfJoining === today;

  return (
    <Box gap="24px">
      <Heading level={2} margin="none" size="32px" color="#1F2937">
        Candidate Pipeline
      </Heading>

      <Box gap="16px">
        {loading && (
          <Card background="white" round="20px" pad="32px" elevation="small">
            <Text>Loading candidates...</Text>
          </Card>
        )}

        {!loading &&
          candidates.map((candidate) => (
            <Card
              key={candidate.id}
              background="white"
              round="24px"
              border={{ color: 'rgba(15,23,42,0.08)' }}
              elevation="small"
              onClick={() => navigate(`/vendor-manager/candidates/${candidate.id}`)}
              style={{ cursor: 'pointer' }}
            >
              <CardBody pad="24px" gap="20px">
                <Box direction="row" justify="between" align="start" gap="16px">
                  <Box gap="12px">
                    <Box direction="row" align="center" gap="12px" wrap>
                      <Text size="xlarge" weight={600} color="#0F172A">
                        {candidate.name}
                      </Text>
                      <StageBadge
  status={candidate.status}
/>
                    </Box>
                    <Text size="small" color="#64748B">
                      {candidate.email}
                    </Text>
                  </Box>

                  <Button
                    type="button"
                    plain={false}
                    onClick={(event) => openResume(candidate, event)}
                    icon={<Eye size={18} />}
                    style={{
                      borderRadius: 12,
                      border: '1px solid #D6DCE5',
                      padding: 8,
                      color: '#64748B',
                    }}
                  />
                </Box>

                <Grid columns={{ count: 'fit', size: ['small', 'medium'] }} gap="16px">
                  <Info label="Contact" value={candidate.phone || '-'} />
                  <Info label="Vendor" value={candidate.vendor?.name || '-'} />
                  <Info label="Job" value={candidate.job?.title || '-'} />
                  <Info
                    label="Experience"
                    value={candidate.experience ? `${candidate.experience} yrs` : '-'}
                  />
                  <Info label="DOJ" value={candidate.dateOfJoining || '-'} />
                </Grid>

                {candidate.status === 'YET_TO_JOIN' && candidate.ytjJustification && (
                  <Text size="small" color="#64748B">
                    {candidate.ytjJustification}
                  </Text>
                )}

                <Box direction="row" wrap gap="8px" onClick={(event) => event.stopPropagation()}>
                  <ActionButton
                    disabled={!canMarkYtj(candidate.status) || updatingId === candidate.id}
                    onClick={() => {
                      setYtjCandidate(candidate);
                      setYtjDateOfJoining(candidate.dateOfJoining || '');
                      setYtjJustification(candidate.ytjJustification || '');
                    }}
                  >
                    YTJ
                  </ActionButton>
                  <ActionButton
                    disabled={!canFinalize(candidate) || updatingId === candidate.id}
                    onClick={async () => {
                      await updateCandidateStatus(candidate.id, 'ONBOARDED');
                    }}
                  >
                    Onboarded
                  </ActionButton>
                  <ActionButton
                    danger
                    disabled={
                      updatingId === candidate.id ||
                      (!canMarkYtj(candidate.status) &&
                        !canFinalize(candidate) &&
                        candidate.status !== 'YET_TO_JOIN')
                    }
                    onClick={() => {
                      setDropCandidate(candidate);
                      setDropJustification('');
                    }}
                  >
                    Drop
                  </ActionButton>
                </Box>
              </CardBody>
            </Card>
          ))}
      </Box>

      {resumeCandidate && (
        <ResumeModal
          candidateId={resumeCandidate.id}
          resumePath={resumeCandidate.resumePath}
          onClose={closeModal}
        />
      )}

      {dropCandidate && (
        <Layer
          modal
          onEsc={() => {
            setDropCandidate(null);
            setDropJustification('');
          }}
          onClickOutside={() => {
            setDropCandidate(null);
            setDropJustification('');
          }}
        >
          <Box width="460px" pad="24px" gap="16px" round="16px" background="white">
            <Heading level={3} margin="none" size="20px">
              Drop Candidate
            </Heading>
            <Paragraph margin="none" size="small" color="#4B5563">
              Enter the justification for dropping {dropCandidate.name}.
            </Paragraph>
            <TextArea
              rows={5}
              value={dropJustification}
              onChange={(event) => setDropJustification(event.currentTarget.value)}
              style={{ borderRadius: 8, fontSize: 14 }}
            />
            <Box direction="row" justify="end" gap="8px">
              <Button
                onClick={() => {
                  setDropCandidate(null);
                  setDropJustification('');
                }}
                label="Cancel"
              />
              <Button
                onClick={async () => {
                  if (dropCandidate.status !== 'YET_TO_JOIN' && !dropJustification.trim()) {
                    alert('Drop justification is required');
                    return;
                  }
                  await updateCandidateStatus(dropCandidate.id, 'DROPPED', { dropJustification });
                  setDropCandidate(null);
                  setDropJustification('');
                }}
                label="Confirm Drop"
                primary
                color="#DC2626"
              />
            </Box>
          </Box>
        </Layer>
      )}

      {ytjCandidate && (
        <Layer
          modal
          onEsc={() => {
            setYtjCandidate(null);
            setYtjDateOfJoining('');
            setYtjJustification('');
          }}
          onClickOutside={() => {
            setYtjCandidate(null);
            setYtjDateOfJoining('');
            setYtjJustification('');
          }}
        >
          <Box width="480px" pad="24px" gap="16px" round="16px" background="white">
            <Heading level={3} margin="none" size="20px">
              Mark Candidate as Yet to Join
            </Heading>
            <Paragraph margin="none" size="small" color="#4B5563">
              Add DOJ and justification for {ytjCandidate.name}.
            </Paragraph>
            <Box>
              <Text margin={{ bottom: '4px' }} size="small" weight={500} color="#374151">
                DOJ
              </Text>
              <TextInput
                type="date"
                value={ytjDateOfJoining}
                onChange={(event) => setYtjDateOfJoining(event.currentTarget.value)}
                style={{ borderRadius: 8, fontSize: 14 }}
              />
            </Box>
            <Box>
              <Text margin={{ bottom: '4px' }} size="small" weight={500} color="#374151">
                Justification
              </Text>
              <TextArea
                rows={4}
                value={ytjJustification}
                onChange={(event) => setYtjJustification(event.currentTarget.value)}
                style={{ borderRadius: 8, fontSize: 14 }}
              />
            </Box>
            <Box direction="row" justify="end" gap="8px">
              <Button
                onClick={() => {
                  setYtjCandidate(null);
                  setYtjDateOfJoining('');
                  setYtjJustification('');
                }}
                label="Cancel"
              />
              <Button
                onClick={async () => {
                  if (!ytjDateOfJoining) return alert('DOJ is required');
                  if (!ytjJustification.trim()) return alert('Justification is required');
                  await updateCandidateStatus(ytjCandidate.id, 'YET_TO_JOIN', {
                    dateOfJoining: ytjDateOfJoining,
                    ytjJustification,
                  });
                  setYtjCandidate(null);
                  setYtjDateOfJoining('');
                  setYtjJustification('');
                }}
                label="Save"
                primary
                color="#059669"
              />
            </Box>
          </Box>
        </Layer>
      )}

      {finalizeCandidate && (
        <Layer
          modal
          onEsc={() => setFinalizeCandidate(null)}
          onClickOutside={() => setFinalizeCandidate(null)}
        >
          <Box width="460px" pad="24px" gap="16px" round="16px" background="white">
            <Heading level={3} margin="none" size="20px">
              Finalize Candidate
            </Heading>
            <Paragraph margin="none" size="small" color="#4B5563">
              DOJ matched for {finalizeCandidate.name}. Mark the final outcome.
            </Paragraph>
            <Box direction="row" justify="end" gap="8px">
              <Button
                onClick={() => setFinalizeCandidate(null)}
                label="Close"
              />
              <Button
                onClick={async () => {
                  await updateCandidateStatus(finalizeCandidate.id, 'ONBOARDED');
                  setFinalizeCandidate(null);
                }}
                label="Onboarded"
                primary
                color="#059669"
              />
              <Button
                onClick={() => {
                  setDropCandidate(finalizeCandidate);
                  setDropJustification('');
                  setFinalizeCandidate(null);
                }}
                label="Drop"
                primary
                color="#DC2626"
              />
            </Box>
          </Box>
        </Layer>
      )}
    </Box>
  );
};

const Info = ({ label, value }: { label: string; value: string }) => (
  <Box round="16px" background="#F8FAFC" pad={{ horizontal: '16px', vertical: '12px' }}>
    <Text size="xsmall" weight={600} color="#94A3B8" style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>
      {label}
    </Text>
    <Text margin={{ top: '4px' }} size="small" weight={500} color="#0F172A">
      {value}
    </Text>
  </Box>
);

const ActionButton = ({
  children,
  onClick,
  disabled,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) => (
  <Button
    type="button"
    disabled={disabled}
    onClick={onClick}
    label={children}
    primary={!danger}
    color={danger ? undefined : '#01A982'}
    style={{
      borderRadius: 12,
      padding: '8px 16px',
      fontSize: 14,
      fontWeight: 500,
      opacity: disabled ? 0.5 : 1,
      border: danger ? '1px solid #FCA5A5' : undefined,
      color: danger ? '#DC2626' : '#FFFFFF',
    }}
  />
);

export default Candidates;
