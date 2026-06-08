import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Box,
  Button,
  Grid,
  Heading,
  Layer,
  Paragraph,
  RadioButton,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
  Text,
  TextArea,
  TextInput,
} from 'grommet';
import {
  CalendarDays,
  Filter,
  X,
} from 'lucide-react';
import api from '../api/api';
import {
  createPartnerSlot,
  getEligiblePartnerCandidates,
  getPartnerSlots,
  respondToPartnerSlot,
  updatePartnerSlotAttendance,
  type EligibleSlotCandidate,
  type PartnerSlot,
  type SlotAttendanceStatus,
} from '../services/partnerSlotService';

type RoleView =
  | 'HIRING_MANAGER'
  | 'VENDOR'
  | 'VENDOR_MANAGER'
  | 'VENDOR_MANAGER_HEAD';

type Props = {
  role: RoleView;
};

type CandidateStatus =
  | 'NEW'
  | 'SUBMITTED'
  | 'SCREENING'
  | 'SCREEN_SELECTED'
  | 'SCREEN_REJECTED'
  | 'TECH'
  | 'TECH_SELECTED'
  | 'TECH_REJECTED'
  | 'OPS'
  | 'OPS_SELECTED'
  | 'OPS_REJECTED'
  | 'SELECTED'
  | 'REJECTED'
  | 'ONBOARDED'
  | 'DROPPED';

type CandidateRecord = {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  experience?: number;
  status: CandidateStatus;
  createdAt?: string;
  vendor?: {
    id?: string | number;
    name?: string;
  };
  job?: {
    id?: number;
    title?: string;
  };
};

type TabKey =
  | 'feedbackPending'
  | 'awaitingSlots'
  | 'acceptSlots'
  | 'scheduledInterviews';

const PartnerSlotManagementView = ({ role }: Props) => {
  const [slots, setSlots] = useState<PartnerSlot[]>([]);
  const [eligibleCandidates, setEligibleCandidates] = useState<EligibleSlotCandidate[]>([]);
  const [candidates, setCandidates] = useState<CandidateRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('feedbackPending');
  const [search, setSearch] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState<
    CandidateRecord | EligibleSlotCandidate | null
  >(null);
  const [selectedSlot, setSelectedSlot] = useState<PartnerSlot | null>(null);
  const [slotForm, setSlotForm] = useState({
    interviewDate: '',
    interviewTime: '',
    hmComment: '',
  });
  const [decisionFeedback, setDecisionFeedback] = useState('');
  const [vendorComment, setVendorComment] = useState('');
  const [attendanceStatus, setAttendanceStatus] =
    useState<SlotAttendanceStatus>('ATTENDED');
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [slotData, candidateData] = await Promise.all([
        getPartnerSlots(),
        role === 'HIRING_MANAGER'
          ? getEligiblePartnerCandidates()
          : api.get('/candidates').then((res) => res.data as CandidateRecord[]),
      ]);

      setSlots(slotData);

      if (role === 'HIRING_MANAGER') {
        setEligibleCandidates(candidateData as EligibleSlotCandidate[]);
        setCandidates([]);
      } else {
        setEligibleCandidates([]);
        setCandidates(candidateData as CandidateRecord[]);
      }
    } catch (error) {
      console.error('Failed to load partner slot data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [role]);

  const tabs = useMemo(() => {
    if (role === 'VENDOR') {
      return [
        { key: 'feedbackPending', label: 'Feedback Pending' },
        { key: 'awaitingSlots', label: 'Awaiting Slots' },
        { key: 'acceptSlots', label: 'Accept Slots' },
        { key: 'scheduledInterviews', label: 'Scheduled Interviews' },
      ] satisfies Array<{ key: TabKey; label: string }>;
    }

    if (role === 'HIRING_MANAGER') {
      return [
        { key: 'feedbackPending', label: 'Feedback Pending' },
        { key: 'awaitingSlots', label: 'Awaiting Slots' },
        { key: 'acceptSlots', label: 'Accept Slots' },
        { key: 'scheduledInterviews', label: 'Scheduled Interviews' },
      ] satisfies Array<{ key: TabKey; label: string }>;
    }

    return [
      { key: 'feedbackPending', label: 'Feedback Pending' },
      { key: 'awaitingSlots', label: 'Awaiting Slots' },
      { key: 'acceptSlots', label: 'Accept Slots' },
      { key: 'scheduledInterviews', label: 'Scheduled Interviews' },
    ] satisfies Array<{ key: TabKey; label: string }>;
  }, [role]);

  const activeSlotCandidateIds = useMemo(
    () =>
      new Set(
        slots
          .filter((slot) => ['PENDING_VENDOR', 'SCHEDULED'].includes(slot.status))
          .map((slot) => slot.candidate?.id),
      ),
    [slots],
  );

  const hmFeedbackCandidates = useMemo(() => {
    if (role !== 'HIRING_MANAGER') {
      return [];
    }

    return eligibleCandidates.filter((candidate) =>
      ['NEW', 'SUBMITTED', 'SCREENING'].includes(candidate.status),
    );
  }, [eligibleCandidates, role]);

  const hmAwaitingSlotCandidates = useMemo(() => {
    if (role !== 'HIRING_MANAGER') {
      return [];
    }

    return eligibleCandidates.filter(
      (candidate) =>
        ['SCREEN_SELECTED', 'TECH_SELECTED'].includes(candidate.status) &&
        !activeSlotCandidateIds.has(candidate.id),
    );
  }, [activeSlotCandidateIds, eligibleCandidates, role]);

  const visibleCandidates = useMemo(() => {
    const source = role === 'HIRING_MANAGER' ? [] : candidates;

    if (activeTab === 'feedbackPending') {
      return source.filter((candidate) =>
        ['NEW', 'SUBMITTED', 'SCREENING'].includes(candidate.status),
      );
    }

    if (activeTab === 'awaitingSlots') {
      return source.filter(
        (candidate) =>
          ['SCREEN_SELECTED', 'TECH_SELECTED'].includes(candidate.status) &&
          !activeSlotCandidateIds.has(candidate.id),
      );
    }

    return [];
  }, [activeSlotCandidateIds, activeTab, candidates, role]);

  const visibleSlots = useMemo(() => {
    if (activeTab === 'acceptSlots') {
      if (role === 'VENDOR') {
        return slots.filter((slot) => slot.status === 'PENDING_VENDOR');
      }

      return slots.filter((slot) =>
        ['PENDING_VENDOR', 'REJECTED', 'SCHEDULED'].includes(slot.status),
      );
    }

    if (activeTab === 'scheduledInterviews') {
      if (role === 'VENDOR') {
        return slots.filter((slot) => slot.status === 'SCHEDULED');
      }

      return slots.filter(
        (slot) =>
          slot.status === 'SCHEDULED' ||
          (slot.status === 'CLOSED' &&
            [
              'ATTENDED',
              'NO_SHOW',
              'RESCHEDULE_REQUESTED_BY_CANDIDATE',
              'RESCHEDULE_REQUESTED_BY_PANEL',
              'DROPPED',
            ].includes(slot.attendanceStatus)),
      );
    }

    return [];
  }, [activeTab, role, slots]);

  const filteredHmCandidates = useMemo(() => {
    const source =
      activeTab === 'feedbackPending' ? hmFeedbackCandidates : hmAwaitingSlotCandidates;
    return source.filter((candidate) => matchesSearch(search, [
      candidate.hrqId,
      candidate.candidateName,
      candidate.contactNumber,
      candidate.role,
      candidate.vendorName,
    ]));
  }, [activeTab, hmAwaitingSlotCandidates, hmFeedbackCandidates, search]);

  const filteredCandidates = useMemo(
    () =>
      visibleCandidates.filter((candidate) =>
        matchesSearch(search, [
          `HRQ${candidate.job?.id || ''}`,
          `CA${candidate.id}`,
          candidate.name,
          candidate.phone,
          candidate.email,
          candidate.job?.title,
          candidate.vendor?.name,
        ]),
      ),
    [search, visibleCandidates],
  );

  const filteredSlots = useMemo(
    () =>
      visibleSlots.filter((slot) =>
        matchesSearch(search, [
          `HRQ${slot.job?.id || ''}`,
          `CA${slot.candidate?.id || ''}`,
          slot.candidate?.name,
          slot.candidate?.phone,
          slot.job?.title,
          slot.vendor?.name,
          slot.roundName,
        ]),
      ),
    [search, visibleSlots],
  );

  const submitSlot = async () => {
    if (!selectedCandidate || !slotForm.interviewDate || !slotForm.interviewTime) {
      alert('Interview date and time are required');
      return;
    }

    setSubmitting(true);
    try {
      await createPartnerSlot({
        candidateId: selectedCandidate.id,
        interviewDate: slotForm.interviewDate,
        interviewTime: slotForm.interviewTime,
        hmComment: slotForm.hmComment,
      });

      closeAllDrawers();
      await loadData();
      setActiveTab('scheduledInterviews');
    } catch (error) {
      console.error(error);
      alert('Failed to create slot');
    } finally {
      setSubmitting(false);
    }
  };

  const submitHmProfileDecision = async (decision: 'SELECT' | 'REJECT') => {
    if (!selectedCandidate) {
      return;
    }

    const currentStatus = getNormalizedCandidateStatus(
      (selectedCandidate as EligibleSlotCandidate).status ||
        (selectedCandidate as CandidateRecord).status,
    );

    const nextStatus =
      decision === 'SELECT'
        ? currentStatus === 'SUBMITTED' || currentStatus === 'SCREENING'
          ? 'SCREEN_SELECTED'
          : null
        : currentStatus === 'SUBMITTED' || currentStatus === 'SCREENING'
          ? 'SCREEN_REJECTED'
          : null;

    if (!nextStatus) {
      alert('This profile cannot be updated from here');
      return;
    }

    if (decision === 'REJECT' && !decisionFeedback.trim()) {
      alert('Rejection justification is required');
      return;
    }

    setSubmitting(true);
    try {
      await api.patch(`/candidates/${selectedCandidate.id}/status`, {
        status: nextStatus,
        feedback: decisionFeedback,
      });
      closeAllDrawers();
      await loadData();
    } catch (error: any) {
      console.error(error);
      alert(error?.response?.data?.message || 'Failed to update candidate');
    } finally {
      setSubmitting(false);
    }
  };

  const submitHmInterviewFeedback = async (decision: 'SELECT' | 'REJECT') => {
    if (!selectedSlot) {
      return;
    }

    const candidateStatus = getNormalizedCandidateStatus(selectedSlot.candidate.status);
    const nextStatus =
      decision === 'SELECT'
        ? candidateStatus === 'SCREEN_SELECTED'
          ? 'TECH_SELECTED'
          : candidateStatus === 'TECH_SELECTED'
            ? 'OPS_SELECTED'
            : null
        : candidateStatus === 'SCREEN_SELECTED'
          ? 'TECH_REJECTED'
          : candidateStatus === 'TECH_SELECTED'
            ? 'OPS_REJECTED'
            : null;

    if (!nextStatus) {
      alert('This candidate is not ready for hiring manager feedback');
      return;
    }

    if (decision === 'REJECT' && !decisionFeedback.trim()) {
      alert('Feedback is required when rejecting');
      return;
    }

    setSubmitting(true);
    try {
      await api.patch(`/candidates/${selectedSlot.candidate.id}/status`, {
        status: nextStatus,
        feedback: decisionFeedback,
      });
      closeAllDrawers();
      await loadData();
    } catch (error: any) {
      console.error(error);
      alert(error?.response?.data?.message || 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  const submitVendorResponse = async (action: 'ACCEPT' | 'REJECT') => {
    if (!selectedSlot) {
      return;
    }

    if (action === 'REJECT' && !vendorComment.trim()) {
      alert('Justification is required when rejecting a slot');
      return;
    }

    setSubmitting(true);
    try {
      await respondToPartnerSlot(selectedSlot.id, {
        action,
        justification: vendorComment,
      });
      closeAllDrawers();
      await loadData();
      setActiveTab(action === 'ACCEPT' ? 'scheduledInterviews' : 'acceptSlots');
    } catch (error: any) {
      console.error(error);
      alert(error?.response?.data?.message || 'Failed to update slot');
    } finally {
      setSubmitting(false);
    }
  };

  const submitAttendance = async () => {
    if (!selectedSlot) {
      return;
    }

    if (
      attendanceStatus !== 'ATTENDED' &&
      !vendorComment.trim()
    ) {
      alert('Comments are required for this outcome');
      return;
    }

    setSubmitting(true);
    try {
      await updatePartnerSlotAttendance(selectedSlot.id, {
        attendanceStatus,
        comment: vendorComment,
      });
      closeAllDrawers();
      await loadData();
    } catch (error: any) {
      console.error(error);
      alert(error?.response?.data?.message || 'Failed to submit interview outcome');
    } finally {
      setSubmitting(false);
    }
  };

  const closeAllDrawers = () => {
    setSelectedCandidate(null);
    setSelectedSlot(null);
    setSlotForm({
      interviewDate: '',
      interviewTime: '',
      hmComment: '',
    });
    setDecisionFeedback('');
    setVendorComment('');
    setAttendanceStatus('ATTENDED');
  };

  return (
    <Box gap="24px">
      <Box>
        <Heading level={2} margin="none" size="32px" color="#0F172A">
          Interview Management
        </Heading>
        <Paragraph margin={{ top: '8px', bottom: '0' }} size="small" color="#64748B">
          Manage screening feedback, panel slots, vendor acceptance, and scheduled interviews.
        </Paragraph>
      </Box>

      <Box
        round="24px"
        border={{ color: '#E5E7EB' }}
        background="white"
        pad="16px"
        elevation="small"
      >
        <Box direction="row" wrap gap="12px">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <Button
                key={tab.key}
                type="button"
                label={tab.label}
                onClick={() => setActiveTab(tab.key)}
                primary={isActive}
                color={isActive ? '#10B981' : '#F5F3FF'}
                style={{
                  borderRadius: 18,
                  padding: '12px 16px',
                  fontSize: 14,
                  fontWeight: 500,
                  color: isActive ? '#FFFFFF' : '#7C3AED',
                  boxShadow: isActive ? '0 14px 30px rgba(16,185,129,0.18)' : 'none',
                }}
              />
            );
          })}
        </Box>
      </Box>

      <Box
        round="24px"
        border={{ color: '#E5E7EB' }}
        background="white"
        pad="16px"
        elevation="small"
        gap="20px"
      >
        <Box direction="row" wrap justify="between" align="center" gap="16px">
          <Box direction="row" wrap align="center" gap="12px">
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
                Candidate Id
              </Text>
              <Filter size={14} color="#10B981" />
            </Box>
            <Box width="320px" style={{ maxWidth: '100%' }}>
              <TextInput
                value={search}
                onChange={(event) => setSearch(event.currentTarget.value)}
                placeholder="Search records..."
                style={{
                  borderRadius: 12,
                  fontSize: 14,
                  minHeight: 44,
                }}
              />
            </Box>
          </Box>

          {role === 'HIRING_MANAGER' && activeTab === 'awaitingSlots' && (
            <Box direction="row" align="center" gap="8px">
              <CalendarDays size={15} color="#047857" />
              <Text size="small" weight={500} color="#047857">
                Create panel slots for screened profiles
              </Text>
            </Box>
          )}
        </Box>

        <Box round="16px" border={{ color: '#E5E7EB' }} overflow="hidden">
          {loading ? (
            <Box pad={{ horizontal: '16px', vertical: '48px' }} align="center">
              <Text size="small" color="#94A3B8">
                Loading interview workflow...
              </Text>
            </Box>
          ) : role === 'HIRING_MANAGER' && ['feedbackPending', 'awaitingSlots'].includes(activeTab) ? (
            <Box overflow="auto">
              <Table>
                <TableHeader background="#96f7e4">
                  <TableRow>
                    <HeaderCell>HRQ ID</HeaderCell>
                    <HeaderCell>Candidate ID</HeaderCell>
                    <HeaderCell>Candidate Name</HeaderCell>
                    <HeaderCell>Role</HeaderCell>
                    <HeaderCell>Experience</HeaderCell>
                    <HeaderCell>Partner</HeaderCell>
                    <HeaderCell>Status</HeaderCell>
                    <HeaderCell>Action</HeaderCell>
                  </TableRow>
                </TableHeader>
                <TableBody background="white">
                  {filteredHmCandidates.map((candidate) => (
                    <TableRow key={candidate.id} border={{ side: 'top', color: '#F3F4F6' }}>
                      <BodyCell>{candidate.hrqId}</BodyCell>
                      <BodyCell>{`CA${candidate.id}`}</BodyCell>
                      <BodyCell>{candidate.candidateName}</BodyCell>
                      <BodyCell>{candidate.role}</BodyCell>
                      <BodyCell>{candidate.relevantExperience}</BodyCell>
                      <BodyCell>{candidate.vendorName}</BodyCell>
                      <BodyCell>
                        <StatusBadge status={candidate.status} />
                      </BodyCell>
                      <BodyCell>
                        <Button
                          type="button"
                          label={activeTab === 'feedbackPending' ? 'Review' : 'Offer Slot'}
                          onClick={() => setSelectedCandidate(candidate)}
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
                  ))}
                  {!filteredHmCandidates.length && (
                    <TableRow>
                      <TableCell colSpan={8} pad={{ horizontal: '16px', vertical: '48px' }}>
                        <Box align="center">
                          <Text size="small" color="#94A3B8">
                            No profiles available in this section.
                          </Text>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Box>
          ) : activeTab === 'feedbackPending' || activeTab === 'awaitingSlots' ? (
            <Box overflow="auto">
              <Table>
                <TableHeader background="#96f7e4">
                  <TableRow>
                    <HeaderCell>HRQ ID</HeaderCell>
                    <HeaderCell>Candidate ID</HeaderCell>
                    <HeaderCell>Candidate Name</HeaderCell>
                    <HeaderCell>Role</HeaderCell>
                    <HeaderCell>Experience</HeaderCell>
                    <HeaderCell>Partner</HeaderCell>
                    <HeaderCell>Status</HeaderCell>
                  </TableRow>
                </TableHeader>
                <TableBody background="white">
                  {filteredCandidates.map((candidate) => (
                    <TableRow key={candidate.id} border={{ side: 'top', color: '#F3F4F6' }}>
                      <BodyCell>{candidate.job?.id ? `HRQ${candidate.job.id}` : '-'}</BodyCell>
                      <BodyCell>{`CA${candidate.id}`}</BodyCell>
                      <BodyCell>{candidate.name}</BodyCell>
                      <BodyCell>{candidate.job?.title || '-'}</BodyCell>
                      <BodyCell>{candidate.experience ?? '-'}</BodyCell>
                      <BodyCell>{candidate.vendor?.name || '-'}</BodyCell>
                      <BodyCell>
                        <StatusBadge status={candidate.status} />
                      </BodyCell>
                    </TableRow>
                  ))}
                  {!filteredCandidates.length && (
                    <TableRow>
                      <TableCell colSpan={7} pad={{ horizontal: '16px', vertical: '48px' }}>
                        <Box align="center">
                          <Text size="small" color="#94A3B8">
                            No profiles available in this section.
                          </Text>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Box>
          ) : role === 'VENDOR' && ['acceptSlots', 'scheduledInterviews'].includes(activeTab) ? (
            <Grid columns={{ count: 'fit', size: ['medium', 'large'] }} gap="16px" pad="16px">
              {filteredSlots.map((slot) => (
                <Box
                  key={slot.id}
                  round="24px"
                  border={{ color: '#E5E7EB' }}
                  background="white"
                  pad="20px"
                  elevation="small"
                  gap="16px"
                >
                  <Box direction="row" justify="between" align="start" gap="12px">
                    <Box gap="4px">
                      <Text
                        size="xsmall"
                        weight={600}
                        color="#94A3B8"
                        style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}
                      >
                        {`HRQ${slot.job?.id}`} / {`CA${slot.candidate?.id}`}
                      </Text>
                      <Text size="large" weight={600} color="#1E293B">
                        {slot.candidate?.name || '-'}
                      </Text>
                      <Text size="small" color="#64748B">
                        {slot.job?.title || '-'}
                      </Text>
                    </Box>
                    <StatusBadge status={slot.status} />
                  </Box>

                  <Grid columns={['1/2', '1/2']} gap="12px">
                    <SlotInfo label="Partner" value={slot.vendor?.name || '-'} />
                    <SlotInfo label="Round" value={formatRoundName(slot.roundName)} />
                    <SlotInfo label="Date" value={formatDate(slot.interviewDate)} />
                    <SlotInfo label="Time" value={slot.interviewTime || '-'} />
                    <SlotInfo label="Attendance" value={getHumanStatus(slot.attendanceStatus)} />
                    <SlotInfo
                      label="Vendor Response"
                      value={
                        slot.status === 'PENDING_VENDOR'
                          ? 'Awaiting Response'
                          : slot.status === 'SCHEDULED'
                            ? 'Accepted'
                            : getHumanStatus(slot.status)
                      }
                    />
                  </Grid>

                  {slot.vendorJustification && (
                    <Box
                      round="12px"
                      border={{ color: '#FCD34D' }}
                      background="#FFFBEB"
                      pad={{ horizontal: '12px', vertical: '10px' }}
                    >
                      <Text size="small" color="#334155">
                        <Text weight={600}>Justification:</Text> {slot.vendorJustification}
                      </Text>
                    </Box>
                  )}

                  <Box>{renderActionButton(role, activeTab, slot, setSelectedSlot)}</Box>
                </Box>
              ))}

              {!filteredSlots.length && (
                <Box gridArea={undefined} pad={{ horizontal: '16px', vertical: '48px' }} align="center">
                  <Text size="small" color="#94A3B8">
                    No records available in this section yet.
                  </Text>
                </Box>
              )}
            </Grid>
          ) : (
            <Box overflow="auto">
              <Table>
                <TableHeader background="#96f7e4">
                  <TableRow>
                    <HeaderCell>HRQ ID</HeaderCell>
                    <HeaderCell>Candidate ID</HeaderCell>
                    <HeaderCell>Candidate Name</HeaderCell>
                    <HeaderCell>Role</HeaderCell>
                    <HeaderCell>Partner</HeaderCell>
                    <HeaderCell>Interview Date</HeaderCell>
                    <HeaderCell>Interview Time</HeaderCell>
                    <HeaderCell>Round Name</HeaderCell>
                    <HeaderCell>Status</HeaderCell>
                    <HeaderCell>Attendance</HeaderCell>
                    <HeaderCell>Justification</HeaderCell>
                    <HeaderCell>Action</HeaderCell>
                  </TableRow>
                </TableHeader>
                <TableBody background="white">
                  {filteredSlots.map((slot) => (
                    <TableRow key={slot.id} border={{ side: 'top', color: '#F3F4F6' }}>
                      <BodyCell>{`HRQ${slot.job?.id}`}</BodyCell>
                      <BodyCell>{`CA${slot.candidate?.id}`}</BodyCell>
                      <BodyCell>{slot.candidate?.name || '-'}</BodyCell>
                      <BodyCell>{slot.job?.title || '-'}</BodyCell>
                      <BodyCell>{slot.vendor?.name || '-'}</BodyCell>
                      <BodyCell>{formatDate(slot.interviewDate)}</BodyCell>
                      <BodyCell>{slot.interviewTime}</BodyCell>
                      <BodyCell>{formatRoundName(slot.roundName)}</BodyCell>
                      <BodyCell>
                        <StatusBadge status={slot.status} />
                      </BodyCell>
                      <BodyCell>
                        <StatusBadge status={slot.attendanceStatus} />
                      </BodyCell>
                      <BodyCell>{slot.vendorJustification || '-'}</BodyCell>
                      <BodyCell>
                        {renderActionButton(role, activeTab, slot, setSelectedSlot)}
                      </BodyCell>
                    </TableRow>
                  ))}

                  {!filteredSlots.length && (
                    <TableRow>
                      <TableCell colSpan={12} pad={{ horizontal: '16px', vertical: '48px' }}>
                        <Box align="center">
                          <Text size="small" color="#94A3B8">
                            No records available in this section yet.
                          </Text>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Box>
          )}
        </Box>
      </Box>

      {selectedCandidate &&
        role === 'HIRING_MANAGER' &&
        activeTab === 'feedbackPending' && (
          <RightDrawer title="Review Candidate" onClose={closeAllDrawers}>
            <DrawerInfo candidate={selectedCandidate} />

            <Field label="Comments">
              <TextArea
                rows={4}
                value={decisionFeedback}
                onChange={(event) => setDecisionFeedback(event.currentTarget.value)}
                placeholder="Enter your comments here..."
                style={{ borderRadius: 12, fontSize: 14 }}
              />
            </Field>

            <Box direction="row" gap="12px" margin={{ top: '24px' }}>
              <Button
                type="button"
                disabled={submitting}
                onClick={() => void submitHmProfileDecision('SELECT')}
                label="Select Profile"
                primary
                color="#10B981"
                fill
                style={{ borderRadius: 8, padding: '12px 16px', fontSize: 14, fontWeight: 500 }}
              />
              <Button
                type="button"
                disabled={submitting}
                onClick={() => void submitHmProfileDecision('REJECT')}
                label="Reject Profile"
                primary
                color="#DC2626"
                fill
                style={{ borderRadius: 8, padding: '12px 16px', fontSize: 14, fontWeight: 500 }}
              />
            </Box>
          </RightDrawer>
        )}

      {selectedCandidate &&
        role === 'HIRING_MANAGER' &&
        activeTab === 'awaitingSlots' && (
          <RightDrawer title="Create Interview Slot" onClose={closeAllDrawers}>
            <DrawerInfo candidate={selectedCandidate} />

            <Box margin={{ top: '24px' }} gap="16px">
              <Field label="Interview Date">
                <TextInput
                  type="date"
                  value={slotForm.interviewDate}
                  onChange={(event) =>
                    setSlotForm((prev) => ({
                      ...prev,
                      interviewDate: event.currentTarget.value,
                    }))
                  }
                  style={{ borderRadius: 12, fontSize: 14 }}
                />
              </Field>

              <Field label="Interview Time">
                <TextInput
                  type="time"
                  value={slotForm.interviewTime}
                  onChange={(event) =>
                    setSlotForm((prev) => ({
                      ...prev,
                      interviewTime: event.currentTarget.value,
                    }))
                  }
                  style={{ borderRadius: 12, fontSize: 14 }}
                />
              </Field>

              <Field label="Comments">
                <TextArea
                  rows={4}
                  value={slotForm.hmComment}
                  onChange={(event) =>
                    setSlotForm((prev) => ({
                      ...prev,
                      hmComment: event.currentTarget.value,
                    }))
                  }
                  placeholder="Enter your comment here..."
                  style={{ borderRadius: 12, fontSize: 14 }}
                />
              </Field>
            </Box>

            <Button
              type="button"
              disabled={submitting}
              onClick={() => void submitSlot()}
              label="Create Slot"
              primary
              color="#10B981"
              fill
              margin={{ top: '24px' }}
              style={{ borderRadius: 8, padding: '12px 16px', fontSize: 14, fontWeight: 500 }}
            />
          </RightDrawer>
        )}

      {selectedSlot &&
        role === 'VENDOR' &&
        activeTab === 'acceptSlots' && (
          <RightDrawer title="Accept/Reject Slot" onClose={closeAllDrawers}>
            <DrawerInfo slot={selectedSlot} />

            <Field label="Comments *">
              <TextArea
                rows={4}
                value={vendorComment}
                onChange={(event) => setVendorComment(event.currentTarget.value)}
                placeholder="Enter your comment here..."
                style={{ borderRadius: 12, fontSize: 14 }}
              />
            </Field>

            <Text margin={{ top: '16px' }} size="small" color="#94A3B8" style={{ fontStyle: 'italic' }}>
              Note: Please confirm after scheduling
            </Text>

            <Box direction="row" gap="12px" margin={{ top: '24px' }}>
              <Button
                type="button"
                disabled={submitting}
                onClick={() => void submitVendorResponse('ACCEPT')}
                label="Accept Slot"
                primary
                color="#10B981"
                fill
                style={{ borderRadius: 8, padding: '12px 16px', fontSize: 14, fontWeight: 500 }}
              />
              <Button
                type="button"
                disabled={submitting}
                onClick={() => void submitVendorResponse('REJECT')}
                label="Reject Slot"
                primary
                color="#DC2626"
                fill
                style={{ borderRadius: 8, padding: '12px 16px', fontSize: 14, fontWeight: 500 }}
              />
            </Box>
          </RightDrawer>
        )}

      {selectedSlot &&
        role === 'VENDOR' &&
        activeTab === 'scheduledInterviews' && (
          <RightDrawer title="Update Interview Outcome" onClose={closeAllDrawers}>
            <DrawerInfo slot={selectedSlot} />

            <Box margin={{ top: '24px' }} gap="12px">
              <OptionRow
                checked={attendanceStatus === 'ATTENDED'}
                onChange={() => setAttendanceStatus('ATTENDED')}
                label="Candidate has been interviewed"
              />
              <OptionRow
                checked={attendanceStatus === 'NO_SHOW'}
                onChange={() => setAttendanceStatus('NO_SHOW')}
                label="Candidate did not attend"
              />
              <OptionRow
                checked={attendanceStatus === 'RESCHEDULE_REQUESTED_BY_CANDIDATE'}
                onChange={() => setAttendanceStatus('RESCHEDULE_REQUESTED_BY_CANDIDATE')}
                label="Reschedule requested by candidate"
              />
              <OptionRow
                checked={attendanceStatus === 'RESCHEDULE_REQUESTED_BY_PANEL'}
                onChange={() => setAttendanceStatus('RESCHEDULE_REQUESTED_BY_PANEL')}
                label="Reschedule requested by panel"
              />
              <OptionRow
                checked={attendanceStatus === 'DROPPED'}
                onChange={() => setAttendanceStatus('DROPPED')}
                label="Drop candidature"
              />
            </Box>

            <Field label="Comments">
              <TextArea
                rows={4}
                value={vendorComment}
                onChange={(event) => setVendorComment(event.currentTarget.value)}
                placeholder="Required for no-show, reschedule, or drop"
                style={{ borderRadius: 12, fontSize: 14 }}
              />
            </Field>

            <Button
              type="button"
              disabled={submitting}
              onClick={() => void submitAttendance()}
              label="Submit"
              primary
              color="#10B981"
              fill
              margin={{ top: '24px' }}
              style={{ borderRadius: 8, padding: '12px 16px', fontSize: 14, fontWeight: 500 }}
            />
          </RightDrawer>
        )}

      {selectedSlot &&
        role === 'HIRING_MANAGER' &&
        activeTab === 'scheduledInterviews' &&
        selectedSlot.status === 'CLOSED' &&
        selectedSlot.attendanceStatus === 'ATTENDED' &&
        !selectedSlot.hmFeedbackSubmitted && (
          <RightDrawer title="Submit Hiring Manager Feedback" onClose={closeAllDrawers}>
            <DrawerInfo slot={selectedSlot} />

            <Field label="Interview Feedback">
              <TextArea
                rows={5}
                value={decisionFeedback}
                onChange={(event) => setDecisionFeedback(event.currentTarget.value)}
                placeholder="Share the interview feedback here..."
                style={{ borderRadius: 12, fontSize: 14 }}
              />
            </Field>

            <Box direction="row" gap="12px" margin={{ top: '24px' }}>
              <Button
                type="button"
                disabled={submitting}
                onClick={() => void submitHmInterviewFeedback('SELECT')}
                label="Select"
                primary
                color="#10B981"
                fill
                style={{ borderRadius: 8, padding: '12px 16px', fontSize: 14, fontWeight: 500 }}
              />
              <Button
                type="button"
                disabled={submitting}
                onClick={() => void submitHmInterviewFeedback('REJECT')}
                label="Reject"
                primary
                color="#DC2626"
                fill
                style={{ borderRadius: 8, padding: '12px 16px', fontSize: 14, fontWeight: 500 }}
              />
            </Box>
          </RightDrawer>
        )}
    </Box>
  );
};

export default PartnerSlotManagementView;

const HeaderCell = ({ children }: { children: ReactNode }) => (
  <TableCell pad={{ horizontal: '16px', vertical: '16px' }}>
    <Text
      size="xsmall"
      weight={600}
      style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}
    >
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

const RightDrawer = ({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) => (
  <Layer
    onEsc={onClose}
    onClickOutside={onClose}
    modal
    position="right"
    full="vertical"
    responsive
  >
    <Box width="min(100vw, 560px)" fill="vertical" background="white" overflow="auto">
      <Box
        direction="row"
        justify="between"
        align="center"
        pad={{ horizontal: '24px', vertical: '20px' }}
        border={{ side: 'bottom', color: 'border' }}
        background="white"
        style={{ position: 'sticky', top: 0, zIndex: 1 }}
      >
        <Text size="xlarge" weight={600} color="#047857">
          {title}
        </Text>
        <Button plain icon={<X size={18} />} onClick={onClose} />
      </Box>
      <Box pad="24px">{children}</Box>
    </Box>
  </Layer>
);

const DrawerInfo = ({
  candidate,
  slot,
}: {
  candidate?: CandidateRecord | EligibleSlotCandidate | null;
  slot?: PartnerSlot | null;
}) => {
  const panelMembers = slot
    ? (
        slot.job?.interviewRounds?.find(
          (round) =>
            (round.roundName || '').trim().toUpperCase() ===
            (slot.roundName || '').trim().toUpperCase(),
        )?.panels || []
      )
        .map((panel) => panel.name?.trim())
        .filter(Boolean)
        .join(', ')
    : '';

  const data = slot
    ? {
        hrqId: `HRQ${slot.job?.id}`,
        candidateName: slot.candidate?.name,
        role: slot.job?.title,
        status: slot.status.replace(/_/g, ' '),
        panel: panelMembers || formatRoundName(slot.roundName),
      }
    : {
        hrqId:
          'hrqId' in (candidate || {}) ? (candidate as EligibleSlotCandidate).hrqId : `HRQ${(candidate as CandidateRecord)?.job?.id || ''}`,
        candidateName:
          'candidateName' in (candidate || {})
            ? (candidate as EligibleSlotCandidate).candidateName
            : (candidate as CandidateRecord)?.name,
        role:
          'role' in (candidate || {})
            ? (candidate as EligibleSlotCandidate).role
            : (candidate as CandidateRecord)?.job?.title,
        status:
          'status' in (candidate || {})
            ? getHumanStatus(
                ('status' in (candidate || {}) && (candidate as any).status) || '-',
              )
            : '-',
        panel:
          slot?.roundName ||
          ('nextRoundName' in (candidate || {})
            ? (candidate as EligibleSlotCandidate).nextRoundName
            : '-'),
  };

  return (
    <Box round="12px" background="#F8FAFC" pad="16px">
      <InfoLine label="HRQID" value={data.hrqId || '-'} />
      <InfoLine label="Candidate Name" value={data.candidateName || '-'} />
      <InfoLine label="Role Hired For" value={data.role || '-'} />
      <InfoLine label="Status" value={data.status || '-'} />
      <InfoLine label="Panel Member" value={data.panel || '-'} />
    </Box>
  );
};

const InfoLine = ({ label, value }: { label: string; value: ReactNode }) => (
  <Box
    direction="row"
    justify="between"
    gap="16px"
    pad={{ vertical: '8px' }}
    border={false}
  >
    <Text size="small" weight={500} color="#64748B">
      {label}
    </Text>
    <Text size="small" weight={500} color="#334155" textAlign="end">
      {value}
    </Text>
  </Box>
);

const OptionRow = ({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) => (
  <Box
    as="label"
    direction="row"
    align="center"
    gap="12px"
    round="12px"
    border={{ color: 'border' }}
    pad={{ horizontal: '12px', vertical: '12px' }}
  >
    <RadioButton checked={checked} onChange={onChange} name={label} />
    <Text size="small" color="#334155">
      {label}
    </Text>
  </Box>
);

const StatusBadge = ({ status }: { status: string }) => {
  return (
    <Box
      as="span"
      round="full"
      pad={{ horizontal: '12px', vertical: '4px' }}
      background={getStatusStyle(status).background}
    >
      <Text size="xsmall" weight={500} color={getStatusStyle(status).color}>
        {getHumanStatus(status)}
      </Text>
    </Box>
  );
};

const renderActionButton = (
  role: RoleView,
  activeTab: TabKey,
  slot: PartnerSlot,
  setSelectedSlot: (slot: PartnerSlot) => void,
) => {
  if (role === 'VENDOR' && activeTab === 'acceptSlots' && slot.status === 'PENDING_VENDOR') {
    return (
      <Button
        type="button"
        onClick={() => setSelectedSlot(slot)}
        primary
        color="brand"
        label="Manage"
      />
    );
  }

  if (role === 'VENDOR' && activeTab === 'scheduledInterviews' && slot.status === 'SCHEDULED') {
    return (
      <Button
        type="button"
        onClick={() => setSelectedSlot(slot)}
        primary
        color="brand"
        label="Manage"
      />
    );
  }

  if (
    role === 'HIRING_MANAGER' &&
    activeTab === 'scheduledInterviews' &&
    slot.status === 'CLOSED' &&
    slot.attendanceStatus === 'ATTENDED' &&
    !slot.hmFeedbackSubmitted
  ) {
    return (
      <Button
        type="button"
        onClick={() => setSelectedSlot(slot)}
        primary
        color="brand"
        label="Feedback"
      />
    );
  }

  return (
    <Text size="xsmall" color="#94A3B8">
      -
    </Text>
  );
};

const matchesSearch = (query: string, values: Array<string | number | undefined>) => {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return true;
  }

  return values.some((value) =>
    String(value || '')
      .toLowerCase()
      .includes(normalized),
  );
};

const getNormalizedCandidateStatus = (status: string) => {
  if (status === 'SELECTED') {
    return 'OPS_SELECTED';
  }
  if (status === 'NEW') {
    return 'SUBMITTED';
  }
  return status;
};

const getHumanStatus = (status: string) => {
  const map: Record<string, string> = {
    SUBMITTED: 'Submitted',
    SCREENING: 'Screening',
    SCREEN_SELECTED: 'Screen Select',
    SCREEN_REJECTED: 'Screen Reject',
    TECH_SELECTED: 'Tech Select',
    TECH_REJECTED: 'Tech Reject',
    OPS_SELECTED: 'Ops Select',
    OPS_REJECTED: 'Ops Reject',
    PENDING_VENDOR: 'Awaiting Vendor',
    SCHEDULED: 'Scheduled',
    CLOSED: 'Closed',
    ATTENDED: 'Interviewed',
    NO_SHOW: 'Not Interviewed',
    RESCHEDULE_REQUESTED_BY_CANDIDATE: 'Reschedule by Candidate',
    RESCHEDULE_REQUESTED_BY_PANEL: 'Reschedule by Panel',
    DROPPED: 'Dropped',
  };

  return map[status] || status.replace(/_/g, ' ');
};

const getStatusStyle = (status: string) => {
  if (['SCHEDULED', 'ATTENDED', 'SCREEN_SELECTED', 'TECH_SELECTED', 'OPS_SELECTED'].includes(status)) {
    return {
      background: '#ECFDF5',
      color: '#047857',
    };
  }
  if (
    [
      'SCREEN_REJECTED',
      'TECH_REJECTED',
      'OPS_REJECTED',
      'REJECTED',
      'NO_SHOW',
      'DROPPED',
    ].includes(status)
  ) {
    return {
      background: '#FEF2F2',
      color: '#B91C1C',
    };
  }
  if (
    [
      'SUBMITTED',
      'SCREENING',
      'PENDING_VENDOR',
      'PENDING',
      'RESCHEDULE_REQUESTED_BY_CANDIDATE',
      'RESCHEDULE_REQUESTED_BY_PANEL',
    ].includes(status)
  ) {
    return {
      background: '#FFFBEB',
      color: '#B45309',
    };
  }
  return {
    background: '#F1F5F9',
    color: '#334155',
  };
};

const formatRoundName = (roundName?: string) => {
  if (!roundName) return '-';
  if (roundName.toUpperCase() === 'OPS') return 'Technical Ops Evaluation';
  if (roundName.toUpperCase() === 'TECH') return 'Technical Evaluation';
  if (roundName.toUpperCase() === 'SCREENING') return 'Screening';
  return roundName;
};

const formatDate = (value?: string) => {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};
