import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Anchor,
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Grid,
  Heading,
  Layer,
  Paragraph,
  Text,
  TextArea,
  TextInput,
} from 'grommet';
import {
  Briefcase,
  Building2,
  CalendarDays,
  Calendar,
  Clock3,
  FileText,
  IdCard,
  Link2,
  Mail,
  MapPin,
  Phone,
  User,
  Users,
} from 'lucide-react';
import api from '../../api/api';
import StageBadge from '../../components/StageBadge';
import ResumeModal from '../../components/ResumeModal';
import { authService } from '../../auth/authService';
import {
  createPartnerSlot,
  getPartnerSlots,
  type PartnerSlot,
} from '../../services/partnerSlotService';

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

const HM_FLOW: CandidateStatus[] = [
  'SUBMITTED',
  'SCREEN_SELECTED',
  'TECH_SELECTED',
];

const LEGACY_FLOW_MAP: Partial<Record<CandidateStatus, CandidateStatus>> = {
  NEW: 'SUBMITTED',
  SCREENING: 'SUBMITTED',
  TECH: 'SCREEN_SELECTED',
  OPS: 'TECH_SELECTED',
  SELECTED: 'IDENTIFIED',
};

const ROUND_COLORS = [
  '#10B981',
  '#06B6D4',
  '#14B8A6',
  '#0EA5E9',
];

const CandidateDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const role = authService.getRole();
  const pathname = window.location.pathname;
  const today = new Date().toLocaleDateString('en-CA');

  const [candidate, setCandidate] = useState<any>(null);
  const [feedback, setFeedback] = useState('');
  const [pendingHmDecision, setPendingHmDecision] = useState<
    'SELECT' | 'REJECT' | null
  >(null);
  const [showRejectBox, setShowRejectBox] = useState(false);
  const [showDropBox, setShowDropBox] = useState(false);
  const [showYtjBox, setShowYtjBox] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hmSlotGateMessage, setHmSlotGateMessage] = useState('');
  const [ytjDateOfJoining, setYtjDateOfJoining] = useState('');
  const [ytjJustification, setYtjJustification] = useState('');
  const [partnerSlotLoading, setPartnerSlotLoading] = useState(false);
  const [showScheduleBox, setShowScheduleBox] = useState(false);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [slotForm, setSlotForm] = useState({
    interviewDate: '',
    interviewTime: '',
    hmComment: '',
  });
  const [latestSlot, setLatestSlot] = useState<PartnerSlot | null>(null);

  const backRoute = useMemo(() => {
    const pathname = window.location.pathname;

    if (pathname.startsWith('/vendor-manager/')) {
      return '/vendor-manager/candidates';
    }

    if (pathname.startsWith('/vendor/')) {
      return '/vendor/candidates';
    }

    if (pathname.startsWith('/vendor-manager-head/')) {
      return '/vendor-manager-head/jobs';
    }

    if (pathname.startsWith('/hiring-manager/')) {
      return '/hiring-manager/candidates';
    }

    if (pathname.startsWith('/panel/')) {
      return '/panel/candidates';
    }

    switch (role) {
      case 'VENDOR':
        return '/vendor/candidates';
      case 'VENDOR_MANAGER':
        return '/vendor-manager/candidates';
      case 'VENDOR_MANAGER_HEAD':
        return '/vendor-manager-head/jobs';
      case 'PANEL':
        return '/panel/candidates';
      default:
        return '/hiring-manager/candidates';
    }
  }, [role]);

  useEffect(() => {
    if (id) {
      void loadCandidate(id);
    }
  }, [id]);

  const loadCandidate = async (candidateId: string | number) => {
    const res = await api.get(`/candidates/${candidateId}`);
    setCandidate(res.data);

    if (pathname.startsWith('/hiring-manager/')) {
      setHmSlotGateMessage('');
      try {
        const slots = await getPartnerSlots();
        const candidateSlots = slots
          .filter((slot) => slot.candidate?.id === Number(candidateId))
          .sort(
            (a, b) =>
              new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
          );
        setLatestSlot(candidateSlots[0] || null);
      } catch (error) {
        console.error('Failed to load candidate slot details', error);
        setLatestSlot(null);
      }
    } else {
      setLatestSlot(null);
    }
  };

  if (!candidate) {
    return (
      <Box pad="24px">
        <Text>Loading...</Text>
      </Box>
    );
  }

  const normalizedStatus =
    LEGACY_FLOW_MAP[candidate.status as CandidateStatus] ||
    candidate.status;

  const currentStageIndex = HM_FLOW.findIndex(
    (stage) => stage === normalizedStatus,
  );

  const nextStage =
    normalizedStatus === 'TECH_SELECTED'
      ? 'OPS_SELECTED'
      : currentStageIndex >= 0
        ? HM_FLOW[currentStageIndex + 1]
        : null;

  const hmFinalStatuses: CandidateStatus[] = [
    'SCREEN_REJECTED',
    'TECH_REJECTED',
    'OPS_REJECTED',
    'OPS_SELECTED',
    'IDENTIFIED',
    'YET_TO_JOIN',
    'ONBOARDED',
    'DROPPED',
    'REJECTED',
    'SELECTED',
  ];

  const isHiringManagerView = pathname.startsWith('/hiring-manager/');
  const isHiringManagerContext = isHiringManagerView || role === 'HIRING_MANAGER';
  const isVendorManagerView = pathname.startsWith('/vendor-manager/');
  const statusKey = String(candidate.status || '').toUpperCase();
  const isFinalForHm = hmFinalStatuses.includes(candidate.status);
  const canVmFinalize =
    isVendorManagerView &&
    ['IDENTIFIED', 'OPS_SELECTED', 'SELECTED', 'YET_TO_JOIN', 'ONBOARDED'].includes(candidate.status);

  const hmSelectLabel =
    normalizedStatus === 'SUBMITTED'
      ? 'Screen Select'
      : normalizedStatus === 'SCREEN_SELECTED'
        ? 'Tech Select'
        : normalizedStatus === 'TECH_SELECTED'
          ? 'Ops Select'
          : 'Select';

  const hmRejectLabel =
    normalizedStatus === 'SUBMITTED'
      ? 'Screen Reject'
      : normalizedStatus === 'SCREEN_SELECTED'
        ? 'Tech Reject'
        : normalizedStatus === 'TECH_SELECTED'
        ? 'Ops Reject'
          : 'Reject';

  const hasOpenInterviewSlot =
    latestSlot &&
    ['PENDING_VENDOR', 'SCHEDULED'].includes(latestSlot.status);

  const hasAttendedInterviewAwaitingHmFeedback =
    latestSlot?.status === 'CLOSED' &&
    latestSlot?.attendanceStatus === 'ATTENDED' &&
    !latestSlot?.hmFeedbackSubmitted;

  const canScheduleInterview =
    isHiringManagerView &&
    ['SCREEN_SELECTED', 'TECH_SELECTED'].includes(normalizedStatus) &&
    !hasOpenInterviewSlot &&
    !hasAttendedInterviewAwaitingHmFeedback;

  const canHmSubmitStageDecision =
    normalizedStatus === 'SUBMITTED' ||
    statusKey === 'SUBMITTED' ||
    hasAttendedInterviewAwaitingHmFeedback;

  const canHmEdit =
    isHiringManagerContext &&
    !isFinalForHm &&
    !hmSlotGateMessage &&
    canHmSubmitStageDecision;

  const shouldShowHiringManagerAction =
    isHiringManagerContext && ['SUBMITTED', 'NEW', 'SCREENING'].includes(statusKey);

  const interviewGateMessage =
    normalizedStatus === 'SCREEN_SELECTED'
      ? hasOpenInterviewSlot
        ? 'Waiting for vendor response on the scheduled screening interview.'
        : latestSlot?.status === 'REJECTED'
          ? 'The last screening slot was rejected. Please schedule the screening interview again.'
          : latestSlot?.status === 'CLOSED' &&
              latestSlot?.attendanceStatus !== 'ATTENDED'
            ? 'The screening interview was not completed. Please schedule the screening interview again.'
            : 'Schedule the screening interview to continue this candidate.'
      : normalizedStatus === 'TECH_SELECTED'
        ? hasOpenInterviewSlot
          ? 'Waiting for vendor response on the scheduled technical interview.'
          : latestSlot?.status === 'REJECTED'
            ? 'The last technical slot was rejected. Please schedule the technical interview again.'
            : latestSlot?.status === 'CLOSED' &&
                latestSlot?.attendanceStatus !== 'ATTENDED'
              ? 'The technical interview was not completed. Please schedule the technical interview again.'
              : 'Schedule the technical interview to continue this candidate.'
        : '';

  const submitHmDecision = async (decision: 'SELECT' | 'REJECT') => {
    let status: CandidateStatus | null = null;

    if (!feedback.trim()) {
      alert('Feedback is mandatory');
      return;
    }

    if (decision === 'REJECT') {
      if (normalizedStatus === 'SUBMITTED') status = 'SCREEN_REJECTED';
      if (normalizedStatus === 'SCREEN_SELECTED') status = 'TECH_REJECTED';
      if (normalizedStatus === 'TECH_SELECTED') status = 'OPS_REJECTED';
    } else {
      status = nextStage;
    }

    if (!status) {
      alert('No further status update is available');
      return;
    }

    setLoading(true);

    await api.patch(`/candidates/${candidate.id}/status`, {
      status,
      feedback,
    });

    await loadCandidate(candidate.id);
    setFeedback('');
    setShowRejectBox(false);
    setPendingHmDecision(null);
    if (decision === 'SELECT' && ['SCREEN_SELECTED', 'TECH_SELECTED'].includes(status)) {
      setShowScheduleBox(true);
    }
    setLoading(false);
  };

  const submitScheduleInterview = async () => {
    if (!candidate?.id) return;
    if (!slotForm.interviewDate || !slotForm.interviewTime) {
      alert('Interview date and time are required');
      return;
    }

    setPartnerSlotLoading(true);
    try {
      await createPartnerSlot({
        candidateId: candidate.id,
        interviewDate: slotForm.interviewDate,
        interviewTime: slotForm.interviewTime,
        hmComment: slotForm.hmComment,
      });

      await loadCandidate(candidate.id);
      setShowScheduleBox(false);
      setSlotForm({
        interviewDate: '',
        interviewTime: '',
        hmComment: '',
      });
    } catch (error: any) {
      console.error(error);
      alert(error?.response?.data?.message || 'Failed to schedule interview');
    } finally {
      setPartnerSlotLoading(false);
    }
  };

  const submitVendorManagerDecision = async (
    status: 'YET_TO_JOIN' | 'ONBOARDED' | 'DROPPED',
  ) => {
    if (status === 'YET_TO_JOIN') {
      if (!ytjDateOfJoining) {
        alert('DOJ is required');
        return;
      }
      if (!ytjJustification.trim()) {
        alert('YTJ justification is mandatory');
        return;
      }
    }

    if (status === 'DROPPED' && candidate.status !== 'YET_TO_JOIN' && !feedback.trim()) {
      alert('Drop justification is mandatory');
      return;
    }

    setLoading(true);

    await api.patch(`/candidates/${candidate.id}/status`, {
      status,
      dropJustification: feedback,
      dateOfJoining: ytjDateOfJoining,
      ytjJustification,
    });

    await loadCandidate(candidate.id);
    setFeedback('');
    setYtjDateOfJoining('');
    setYtjJustification('');
    setShowYtjBox(false);
    setShowDropBox(false);
    setLoading(false);
  };

  const formatDate = (date?: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatDateTime = (date?: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const candidateLocation = [
    candidate.city,
    candidate.state,
    candidate.country,
  ]
    .filter(Boolean)
    .join(', ');

  const interviewHistory = [...(candidate.interviews || [])].sort(
    (a, b) =>
      new Date(b.feedbackDate || 0).getTime() -
      new Date(a.feedbackDate || 0).getTime(),
  );
  return (
    <Box gap="medium">
      <Button
        label="Back"
        primary
        color="brand"
        onClick={() => navigate(backRoute)}
        alignSelf="start"
        style={{
          color: '#FFFFFF',
          fontWeight: 600,
          fontSize: 12,
          borderRadius: 6,
          minHeight: 32,
          padding: '8px 16px',
        }}
      />

      <Card round="16px" border={{ color: '#B8F6E6' }} background="white" style={{ minHeight: 354 }}>
        <CardHeader pad={{ horizontal: '20px', vertical: '16px' }} border={{ side: 'bottom', color: '#B8F6E6' }}>
          <Box direction="row" justify="between" align="start" width="100%">
            <Heading level={3} margin="none" size="18px" weight={600}>
              Candidate Details
            </Heading>
            <StageBadge status={candidate.status} />
          </Box>
        </CardHeader>
        <CardBody pad={{ horizontal: '20px', vertical: '18px' }} gap="medium" style={{ minHeight: 292 }}>
          <Box
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
              columnGap: 36,
              rowGap: 18,
              alignItems: 'start',
            }}
          >
            <InfoColumn
              items={[
                { icon: <User size={13} />, label: 'Candidate Name', value: candidate.name },
                { icon: <Mail size={13} />, label: 'Email', value: candidate.email },
                { icon: <Phone size={13} />, label: 'Phone', value: candidate.phone },
                { icon: <IdCard size={13} />, label: 'Aadhaar No', value: candidate.aadharNo || '-' },
              ]}
            />
            <InfoColumn
              items={[
                { icon: <MapPin size={13} />, label: 'Location', value: candidateLocation || '-' },
                { icon: <IdCard size={13} />, label: 'Candidate ID', value: `CA${candidate.id}` },
                { icon: <Building2 size={13} />, label: 'Current Organization', value: candidate.currentOrg || '-' },
                { icon: <Briefcase size={13} />, label: 'Education', value: candidate.education || '-' },
              ]}
            />
            <InfoColumn
              items={[
                { icon: <Calendar size={13} />, label: 'Last Working Date', value: formatDate(candidate.lastWorkingDay) },
                {
                  icon: <Clock3 size={13} />,
                  label: 'Notice Period',
                  value:
                    candidate.noticePeriod !== undefined && candidate.noticePeriod !== null
                      ? `${candidate.noticePeriod} days`
                      : '-',
                },
                {
                  icon: <Briefcase size={13} />,
                  label: 'Experience',
                  value:
                    candidate.experience !== undefined && candidate.experience !== null
                      ? `${candidate.experience} years`
                      : '-',
                },
                { icon: <User size={13} />, label: 'Gender', value: candidate.gender || '-' },
              ]}
            />
            <InfoColumn
              items={[
                { icon: <User size={13} />, label: 'Currently Working', value: candidate.currentlyWorking ?? '-' },
                { icon: <Users size={13} />, label: 'Diversity', value: candidate.diversity ?? '-' },
                { icon: <Calendar size={13} />, label: 'Date of Joining', value: formatDate(candidate.dateOfJoining) },
                {
                  icon: <Link2 size={13} />,
                  label: 'Video Profile',
                  value: candidate.videoLink ? (
                    <Anchor
                      href={candidate.videoLink}
                      target="_blank"
                      rel="noreferrer"
                      color="#334155"
                      label={
                        <Box direction="row" gap="xsmall" align="center">
                          <Text size="small">Open Video</Text>
                          <Link2 size={12} />
                        </Box>
                      }
                    />
                  ) : (
                    '-'
                  ),
                },
              ]}
            />
            <InfoColumn
              items={[
                { icon: <IdCard size={13} />, label: 'Employee ID', value: candidate.employeeId ?? '-' },
                {
                  icon: <FileText size={13} />,
                  label: 'Resume',
                  value: (
                    <Button
                      plain
                      onClick={() => setShowResumeModal(true)}
                      label={
                        <Box direction="row" gap="xsmall" align="center">
                          <Text size="small" color="#334155">
                            Resume
                          </Text>
                          <FileText size={12} />
                        </Box>
                      }
                    />
                  ),
                },
                { icon: <Calendar size={13} />, label: 'Resume Upload Date', value: formatDate(candidate.createdAt) },
              ]}
            />
          </Box>

          <Box border={{ side: 'top', color: '#B8F6E6' }} pad={{ top: '12px' }}>
            <Grid columns={['1fr', '1fr']} gap="large">
              <SkillSection title="Primary Skills" skills={candidate.primarySkills} />
              <SkillSection title="Secondary Skills" skills={candidate.secondarySkills} />
            </Grid>
          </Box>
        </CardBody>
      </Card>

      <Card
        round="16px"
        border={{ color: '#B8F6E6' }}
        background="white"
        style={{ overflow: 'visible', flex: '0 0 auto' }}
      >
        <CardHeader pad={{ horizontal: '20px', vertical: '12px' }} background="#F0FFF9" border={{ side: 'bottom', color: '#B8F6E6' }}>
          <Heading level={4} margin="none" size="15px" weight={600}>
            Interview History
          </Heading>
        </CardHeader>
        <CardBody pad="16px" gap="medium" style={{ overflow: 'visible', flex: '0 0 auto' }}>
          <Box
            round="14px"
            border={{ color: '#B8F6E6' }}
            background="#F0FFF9"
            pad="16px"
            gap="small"
            style={{ minHeight: 72, overflow: 'visible', flex: '0 0 auto' }}
          >
            <Box direction="row" wrap justify="between" align="center" gap="small">
              <Box direction="row" wrap gap="small" align="center">
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: 24,
                    padding: '4px 12px',
                    borderRadius: 999,
                    background: '#34D399',
                    color: '#FFFFFF',
                    fontSize: 12,
                    fontWeight: 700,
                    lineHeight: '16px',
                  }}
                >
                  {candidate.job?.id ? `HRQ${candidate.job.id}` : '-'}
                </span>
                <Text weight={500} color="#0F172A">
                  {candidate.job?.title || '-'}
                </Text>
              </Box>
              <Text size="xsmall" color="#64748B">
                {interviewHistory.length} interview rounds
              </Text>
            </Box>
            <Box direction="row" wrap gap="medium" pad={{ left: '16px' }} style={{ lineHeight: '18px' }}>
              <Text size="xsmall" color="#475569">HRQ Status: {candidate.job?.status || '-'}</Text>
              <Text size="xsmall" color="#475569">Partner: {candidate.vendor?.name || '-'}</Text>
            </Box>
          </Box>

          {interviewHistory.length ? (
            interviewHistory.map((interview, index) => (
              <Card key={interview.id} round="20px" border={{ color: '#B8F6E6' }} background="white">
                <CardBody pad="16px" gap="medium">
                  <Box direction="row" wrap justify="between" align="start" gap="small">
                    <Box direction="row" gap="small" align="center">
                      <Box
                        width="24px"
                        height="24px"
                        round="full"
                        align="center"
                        justify="center"
                        background={ROUND_COLORS[index % ROUND_COLORS.length]}
                      >
                        <Text size="xsmall" weight={700} color="white">
                          {interviewHistory.length - index}
                        </Text>
                      </Box>
                      <Heading level={5} margin="none" size="16px">
                        {formatRoundName(interview.round?.roundName)}
                      </Heading>
                    </Box>
                    <Box gap="xsmall">
                      <TinyStatus label="Slot" value="Selected" />
                      <TinyStatus
                        label="Decision"
                        value={interview.decision === 'SELECT' ? 'Selected' : 'Rejected'}
                      />
                    </Box>
                  </Box>

                  <Grid columns={{ count: 'fit', size: '160px' }} gap="medium">
                    <MiniInfo icon={<Users size={12} />} label="Panel Members" value={interview.panelMembers || '-'} />
                    <MiniInfo icon={<Calendar size={12} />} label="Interview Date/Time" value={formatDateTime(interview.feedbackDate)} />
                    <MiniInfo icon={<Briefcase size={12} />} label="Interview Mode" value={interview.round?.mode || '-'} />
                    <MiniInfo icon={<User size={12} />} label="Feedback Given By" value={candidate.job?.hiringManager || 'Hiring Manager'} />
                    <MiniInfo icon={<Calendar size={12} />} label="Feedback Date/Time" value={formatDateTime(interview.feedbackDate)} />
                    <MiniInfo icon={<Clock3 size={12} />} label="TAT (in days)" value={getTatDays(candidate.createdAt, interview.feedbackDate)} />
                  </Grid>

                  <Box round="12px" border={{ color: '#6EE7B7' }} background="#F0FFF9" pad={{ horizontal: '12px', vertical: '10px' }}>
                    <Text size="xsmall" color="#334155">
                      <Text weight={600} color="#047857">
                        INTERVIEW COMMENTS:
                      </Text>{' '}
                      {interview.feedback || 'No feedback shared yet.'}
                    </Text>
                  </Box>
                </CardBody>
              </Card>
            ))
          ) : (
            <Box
              round="14px"
              border={{ color: '#B8F6E6', style: 'dashed' }}
              pad={{ vertical: '34px', horizontal: '16px' }}
              align="center"
              justify="center"
              style={{ minHeight: 104, overflow: 'visible', flex: '0 0 auto' }}
            >
              <Text size="small" color="#94A3B8">
                No interview history available yet.
              </Text>
            </Box>
          )}
        </CardBody>
      </Card>

      {candidate.status === 'DROPPED' && (
        <Card round="16px" border={{ color: '#FECACA' }} background="white">
          <CardBody pad="20px" gap="small">
            <Heading level={4} margin="none" size="16px">
              Drop Justification
            </Heading>
            <Paragraph margin="none" size="small" color="#334155">
              {candidate.dropJustification || '-'}
            </Paragraph>
          </CardBody>
        </Card>
      )}

      {candidate.status === 'YET_TO_JOIN' && candidate.ytjJustification && (
        <Card round="16px" border={{ color: '#FDE68A' }} background="white">
          <CardBody pad="20px" gap="small">
            <Heading level={4} margin="none" size="16px">
              Yet To Join Details
            </Heading>
            <Text size="small" color="#334155">
              <Text weight={600}>DOJ:</Text> {formatDate(candidate.dateOfJoining)}
            </Text>
            <Text size="small" color="#334155">
              <Text weight={600}>Justification:</Text> {candidate.ytjJustification}
            </Text>
          </CardBody>
        </Card>
      )}

      {isHiringManagerView && ['SCREEN_SELECTED', 'TECH_SELECTED'].includes(normalizedStatus) && (
        <Card round="16px" border={{ color: '#B8F6E6' }} background="white">
          <CardBody pad="20px" gap="medium">
            <Box direction="row" wrap justify="between" align="start" gap="medium">
              <Box>
                <Heading level={4} margin="none" size="16px">
                  Interview Scheduling
                </Heading>
                <Paragraph margin={{ top: '6px', bottom: 'none' }} size="small" color="#475569">
                  Schedule the next interview round for this candidate.
                </Paragraph>
              </Box>
              {canScheduleInterview && (
                <Button
                  primary
                  color="brand"
                  icon={<CalendarDays size={16} />}
                  label="Schedule Interview"
                  onClick={() => setShowScheduleBox(true)}
                />
              )}
            </Box>

            {!canScheduleInterview && !hasAttendedInterviewAwaitingHmFeedback && interviewGateMessage && (
              <Text size="small" color="#475569">
                {interviewGateMessage}
              </Text>
            )}

            {hasOpenInterviewSlot && latestSlot && (
              <Box round="20px" border={{ color: '#A7F3D0' }} background="#F0FFF9" pad="16px">
                <Grid columns={{ count: 'fit', size: '160px' }} gap="small">
                  <SlotInfo label="Round" value={formatRoundName(latestSlot.roundName)} />
                  <SlotInfo label="Interview Date" value={formatDate(latestSlot.interviewDate)} />
                  <SlotInfo label="Interview Time" value={latestSlot.interviewTime || '-'} />
                  <SlotInfo
                    label="Vendor Response"
                    value={
                      latestSlot.status === 'PENDING_VENDOR'
                        ? 'Awaiting vendor'
                        : latestSlot.status === 'SCHEDULED'
                          ? 'Accepted'
                          : latestSlot.status
                    }
                  />
                </Grid>
              </Box>
            )}

            {hasAttendedInterviewAwaitingHmFeedback && latestSlot && (
              <Box round="20px" border={{ color: '#A5F3FC' }} background="#ECFEFF" pad="16px" gap="xsmall">
                <Text size="small" weight={600} color="#0F172A">
                  The {formatRoundName(latestSlot.roundName).toLowerCase()} interview has been marked as attended.
                </Text>
                <Text size="small" color="#475569">
                  You can now submit the next stage decision for this candidate.
                </Text>
              </Box>
            )}

            {!hasOpenInterviewSlot && latestSlot?.status === 'REJECTED' && (
              <Box round="20px" border={{ color: '#FDE68A' }} background="#FFFBEB" pad="16px" gap="xsmall">
                <Text size="small" weight={600} color="#0F172A">
                  Last slot was rejected by vendor.
                </Text>
                <Text size="small" color="#475569">
                  <Text weight={600}>Justification:</Text> {latestSlot.vendorJustification || '-'}
                </Text>
              </Box>
            )}
          </CardBody>
        </Card>
      )}

      {isHiringManagerView && canHmEdit && (
        <div
          style={{
            marginTop: 10,
            background: '#FFFFFF',
            border: '1px solid #B8F6E6',
            borderRadius: 16,
            padding: '22px 20px',
            minHeight: 128,
            boxShadow: '0 10px 24px rgba(15, 23, 42, 0.08)',
            position: 'relative',
            zIndex: 1,
            flex: '0 0 auto',
          }}
        >
          <div style={{ color: '#0F172A', fontSize: 15, fontWeight: 600, marginBottom: 18 }}>
            Candidate Action
          </div>
          <div style={{ color: '#475569', fontSize: 14, marginBottom: 16 }}>
            Update candidate status from{' '}
            <span style={{ color: '#334155', fontWeight: 700 }}>{candidate.status}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                setPendingHmDecision('SELECT');
                setShowRejectBox(true);
              }}
              style={{
                appearance: 'none',
                border: 'none',
                borderRadius: 6,
                background: '#00A982',
                color: '#FFFFFF',
                fontSize: 14,
                fontWeight: 700,
                padding: '10px 20px',
                minWidth: 124,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.65 : 1,
              }}
            >
              {hmSelectLabel}
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                setPendingHmDecision('REJECT');
                setShowRejectBox(true);
              }}
              style={{
                appearance: 'none',
                border: 'none',
                borderRadius: 6,
                background: '#F43F5E',
                color: '#FFFFFF',
                fontSize: 14,
                fontWeight: 700,
                padding: '10px 20px',
                minWidth: 124,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.65 : 1,
              }}
            >
              {hmRejectLabel}
            </button>
          </div>

          {showRejectBox && (
            <Box gap="small" margin={{ top: 'medium' }}>
              <TextArea
                rows={4}
                placeholder="Enter feedback / justification..."
                value={feedback}
                onChange={(event) => setFeedback(event.currentTarget.value)}
              />
              <Box direction="row" wrap gap="small">
                <Button
                  label="Cancel"
                  onClick={() => {
                    setShowRejectBox(false);
                    setPendingHmDecision(null);
                    setFeedback('');
                  }}
                />
                <button
                  type="button"
                  disabled={loading || !pendingHmDecision}
                  onClick={() =>
                    pendingHmDecision
                      ? void submitHmDecision(pendingHmDecision)
                      : undefined
                  }
                  style={{
                    appearance: 'none',
                    border: 'none',
                    borderRadius: 6,
                    background: pendingHmDecision === 'REJECT' ? '#F43F5E' : '#00A982',
                    color: '#FFFFFF',
                    fontSize: 14,
                    fontWeight: 700,
                    padding: '10px 20px',
                    cursor: loading || !pendingHmDecision ? 'not-allowed' : 'pointer',
                    opacity: loading || !pendingHmDecision ? 0.65 : 1,
                  }}
                >
                  {pendingHmDecision === 'REJECT'
                    ? `Confirm ${hmRejectLabel}`
                    : `Confirm ${hmSelectLabel}`}
                </button>
              </Box>
            </Box>
          )}
        </div>
      )}

      {(canVmFinalize || (isHiringManagerView && hmSlotGateMessage)) && (
        <Card round="16px" border={{ color: '#B8F6E6' }} background="white">
          <CardBody pad={{ horizontal: '20px', vertical: '22px' }} gap="medium" style={{ minHeight: 128 }}>
            <Heading level={4} margin="none" size="15px" weight={600}>
              Candidate Action
            </Heading>

            {isHiringManagerView && hmSlotGateMessage && (
              <Text size="small" color="status-warning">
                {hmSlotGateMessage}
              </Text>
            )}

            {canVmFinalize && (
              <Box gap="medium">
                <Text size="small" color="#475569">
                  Finalize candidate from <Text weight={600}>{candidate.status}</Text>
                </Text>

                <Box direction="row" wrap gap="small">
                  {['IDENTIFIED', 'OPS_SELECTED', 'SELECTED'].includes(candidate.status) && (
                    <Button
                      primary
                      color="brand"
                      disabled={loading}
                      label={<Text color="white" weight={600} size="small">Yet To Join</Text>}
                      style={{ background: '#00A982', color: '#FFFFFF', border: 'none', borderRadius: 6, padding: '10px 20px' }}
                      onClick={() => setShowYtjBox(true)}
                    />
                  )}

                  {candidate.status === 'YET_TO_JOIN' && candidate.dateOfJoining === today && (
                    <>
                      <Button
                        primary
                        color="brand"
                        disabled={loading}
                        label={<Text color="white" weight={600} size="small">Onboarded</Text>}
                        style={{ background: '#00A982', color: '#FFFFFF', border: 'none', borderRadius: 6, padding: '10px 20px' }}
                        onClick={() => void submitVendorManagerDecision('ONBOARDED')}
                      />
                      <Button
                        primary
                        color="status-critical"
                        disabled={loading}
                        label={<Text color="white" weight={600} size="small">Drop</Text>}
                        style={{ background: '#F43F5E', color: '#FFFFFF', border: 'none', borderRadius: 6, padding: '10px 20px' }}
                        onClick={() => setShowDropBox(true)}
                      />
                    </>
                  )}
                </Box>

                {showYtjBox && (
                  <Box gap="small">
                    <TextInput
                      type="date"
                      value={ytjDateOfJoining}
                      onChange={(event) => setYtjDateOfJoining(event.currentTarget.value)}
                    />
                    <TextArea
                      rows={4}
                      placeholder="Enter YTJ justification..."
                      value={ytjJustification}
                      onChange={(event) => setYtjJustification(event.currentTarget.value)}
                    />
                    <Button
                      primary
                      color="brand"
                      disabled={loading}
                      label="Save YTJ"
                      onClick={() => void submitVendorManagerDecision('YET_TO_JOIN')}
                      alignSelf="start"
                      style={{ color: '#FFFFFF', fontWeight: 600, borderRadius: 6 }}
                    />
                  </Box>
                )}

                {showDropBox && (
                  <Box gap="small">
                    <TextArea
                      rows={4}
                      placeholder={
                        candidate.status === 'YET_TO_JOIN'
                          ? 'Enter drop note (optional)...'
                          : 'Enter drop justification...'
                      }
                      value={feedback}
                      onChange={(event) => setFeedback(event.currentTarget.value)}
                    />
                    <Button
                      primary
                      color="status-critical"
                      disabled={loading}
                      label="Confirm Drop"
                      onClick={() => void submitVendorManagerDecision('DROPPED')}
                      alignSelf="start"
                      style={{ color: '#FFFFFF', fontWeight: 600, borderRadius: 6 }}
                    />
                  </Box>
                )}
              </Box>
            )}
          </CardBody>
        </Card>
      )}

      {showScheduleBox && (
        <Layer onEsc={() => setShowScheduleBox(false)} onClickOutside={() => setShowScheduleBox(false)} modal responsive>
          <Box width="large" pad="24px" gap="medium">
            <Box direction="row" justify="between" align="start" gap="small">
              <Box>
                <Heading level={3} margin="none" size="20px">
                  Schedule Interview
                </Heading>
                <Paragraph margin={{ top: '6px', bottom: 'none' }} size="small" color="#64748B">
                  Set the interview date and time for {candidate.name}.
                </Paragraph>
              </Box>
              <Button plain label="×" onClick={() => setShowScheduleBox(false)} />
            </Box>

            <Box gap="medium">
              <Field label="Interview Date">
                <input
                  type="date"
                  value={slotForm.interviewDate}
                  min={today}
                  onChange={(event) =>
                    setSlotForm((prev) => ({ ...prev, interviewDate: event.currentTarget.value }))
                  }
                  style={nativeFieldStyle}
                />
              </Field>

              <Field label="Interview Time">
                <input
                  type="time"
                  value={slotForm.interviewTime}
                  onChange={(event) =>
                    setSlotForm((prev) => ({ ...prev, interviewTime: event.currentTarget.value }))
                  }
                  style={nativeFieldStyle}
                />
              </Field>

              <Field label="Comments">
                <TextArea
                  rows={4}
                  value={slotForm.hmComment}
                  onChange={(event) =>
                    setSlotForm((prev) => ({ ...prev, hmComment: event.currentTarget.value }))
                  }
                  placeholder="Optional hiring manager note..."
                />
              </Field>
            </Box>

            <Box direction="row" justify="end" gap="small">
              <Button label="Cancel" onClick={() => setShowScheduleBox(false)} />
              <Button
                primary
                color="brand"
                disabled={partnerSlotLoading}
                label="Submit"
                onClick={() => void submitScheduleInterview()}
              />
            </Box>
          </Box>
        </Layer>
      )}

      {showResumeModal && (
        <ResumeModal
          candidateId={candidate.id}
          resumePath={candidate.resumePath}
          onClose={() => setShowResumeModal(false)}
        />
      )}
    </Box>
  );
};

export default CandidateDetails;

const nativeFieldStyle: CSSProperties = {
  width: '100%',
  minHeight: 44,
  border: '1px solid #CBD5E1',
  borderRadius: 6,
  padding: '10px 12px',
  fontSize: 14,
  color: '#0F172A',
  background: '#FFFFFF',
  outline: 'none',
  boxSizing: 'border-box',
};

const Field = ({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) => (
  <Box margin={{ top: '24px' }}>
    <Text margin={{ bottom: '8px' }} size="small" weight={500} color="#334155">
      {label}
    </Text>
    {children}
  </Box>
);

const SlotInfo = ({ label, value }: { label: string; value: ReactNode }) => (
  <Box round="12px" background="#F8FAFC" pad={{ horizontal: '12px', vertical: '10px' }}>
    <Text size="11px" color="#94A3B8" style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>
      {label}
    </Text>
    <Text margin={{ top: '4px' }} size="small" weight={500} color="#334155">
      {value}
    </Text>
  </Box>
);

const InfoColumn = ({ items }: { items: Array<{ icon: ReactNode; label: string; value: ReactNode }> }) => (
  <Box gap="16px" style={{ minWidth: 0 }}>
    {items.map((item) => (
      <Box key={item.label} direction="row" align="start" gap="8px" style={{ minHeight: 36, minWidth: 0 }}>
        <Box margin={{ top: '2px' }} style={{ color: '#34D399', flex: '0 0 auto' }}>
          {item.icon}
        </Box>
        <Box gap="3px" style={{ minWidth: 0 }}>
          <Text
            size="10px"
            style={{ display: 'block', textTransform: 'uppercase', letterSpacing: '0.08em', lineHeight: '12px' }}
            color="#94A3B8"
          >
            {item.label}
          </Text>
          <Text
            size="small"
            weight={600}
            color="#0F172A"
            style={{ display: 'block', lineHeight: '18px', overflowWrap: 'anywhere' }}
          >
            {item.value || '-'}
          </Text>
        </Box>
      </Box>
    ))}
  </Box>
);

const SkillSection = ({
  title,
  skills,
}: {
  title: string;
  skills?: string;
}) => (
  <Box>
    <Text size="xsmall" weight={500} color="#64748B" margin={{ bottom: '8px' }} style={{ lineHeight: '16px' }}>
      {title}
    </Text>
    <Box direction="row" wrap gap="8px">
      {(skills || '')
        .split(',')
        .map((skill) => skill.trim())
        .filter(Boolean)
        .map((skill) => (
          <Box
            key={skill}
            round="6px"
            border={{ color: '#A7F3D0' }}
            background="#ECFDF5"
            pad={{ horizontal: '8px', vertical: '4px' }}
          >
            <Text size="11px" weight={500} color="#047857">
              {skill}
            </Text>
          </Box>
        ))}
      {!skills && (
        <Text size="small" color="#94A3B8">
          -
        </Text>
      )}
    </Box>
  </Box>
);

const MiniInfo = ({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
}) => (
  <Box>
    <Box direction="row" align="center" gap="4px">
      <Box style={{ color: '#34D399' }}>{icon}</Box>
      <Text size="10px" style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }} color="#94A3B8">
        {label}
      </Text>
    </Box>
    <Text margin={{ top: '4px' }} size="xsmall" weight={500} color="#334155">
      {value || '-'}
    </Text>
  </Box>
);

const TinyStatus = ({ label, value }: { label: string; value: string }) => (
  <Box direction="row" align="center" justify="end" gap="8px">
    <Box width="8px" height="8px" round="full" background="#34D399" />
    <Text size="11px" color="#64748B">
      {label}
      {': '}
      <Text as="span" weight={500} color="#334155">
        {value}
      </Text>
    </Text>
  </Box>
);

const formatRoundName = (roundName?: string) => {
  if (!roundName) return '-';

  const normalized = roundName.toUpperCase();
  if (normalized === 'OPS') return 'OPS Discussion';
  if (normalized === 'TECH') return 'Technical Evaluation';
  if (normalized === 'SCREENING') return 'Screening';
  return roundName;
};

const getTatDays = (candidateCreatedAt?: string, feedbackDate?: string) => {
  if (!candidateCreatedAt || !feedbackDate) return '-';

  const start = new Date(candidateCreatedAt).getTime();
  const end = new Date(feedbackDate).getTime();
  const diff = Math.max(0, end - start);
  return `${Math.ceil(diff / (1000 * 60 * 60 * 24))} Days`;
};
