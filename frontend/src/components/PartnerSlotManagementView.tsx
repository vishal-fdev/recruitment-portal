import { useEffect, useMemo, useState, type ReactNode } from 'react';
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
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">
          Interview Management
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Manage screening feedback, panel slots, vendor acceptance, and scheduled interviews.
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-3">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-2xl px-4 py-3 text-sm font-medium transition ${
                activeTab === tab.key
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                  : 'bg-violet-50 text-violet-600 hover:bg-violet-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-slate-700">
              Candidate Id
              <Filter size={14} className="text-emerald-500" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search records..."
              className="h-11 w-full rounded-xl border border-gray-200 px-4 text-sm outline-none placeholder:text-slate-400 focus:border-emerald-300 lg:w-[320px]"
            />
          </div>

          {role === 'HIRING_MANAGER' && activeTab === 'awaitingSlots' && (
            <div className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700">
              <CalendarDays size={15} />
              Create panel slots for screened profiles
            </div>
          )}
        </div>

        <div className="mt-5 overflow-x-auto rounded-xl border border-gray-200">
          {loading ? (
            <div className="px-4 py-12 text-center text-sm text-slate-400">
              Loading interview workflow...
            </div>
          ) : role === 'HIRING_MANAGER' && ['feedbackPending', 'awaitingSlots'].includes(activeTab) ? (
            <table className="min-w-full text-sm">
              <thead className="bg-[#96f7e4] text-slate-700">
                <tr>
                  <HeaderCell>HRQ ID</HeaderCell>
                  <HeaderCell>Candidate ID</HeaderCell>
                  <HeaderCell>Candidate Name</HeaderCell>
                  <HeaderCell>Role</HeaderCell>
                  <HeaderCell>Experience</HeaderCell>
                  <HeaderCell>Partner</HeaderCell>
                  <HeaderCell>Status</HeaderCell>
                  <HeaderCell>Action</HeaderCell>
                </tr>
              </thead>
              <tbody className="bg-white">
                {filteredHmCandidates.map((candidate) => (
                  <tr key={candidate.id} className="border-t border-gray-100 text-slate-700">
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
                      {activeTab === 'feedbackPending' ? (
                        <button
                          type="button"
                          onClick={() => setSelectedCandidate(candidate)}
                          className="rounded-lg bg-emerald-500 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-600"
                        >
                          Review
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setSelectedCandidate(candidate)}
                          className="rounded-lg bg-emerald-500 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-600"
                        >
                          Offer Slot
                        </button>
                      )}
                    </BodyCell>
                  </tr>
                ))}

                {!filteredHmCandidates.length && (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-sm text-slate-400">
                      No profiles available in this section.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : activeTab === 'feedbackPending' || activeTab === 'awaitingSlots' ? (
            <table className="min-w-full text-sm">
              <thead className="bg-[#96f7e4] text-slate-700">
                <tr>
                  <HeaderCell>HRQ ID</HeaderCell>
                  <HeaderCell>Candidate ID</HeaderCell>
                  <HeaderCell>Candidate Name</HeaderCell>
                  <HeaderCell>Role</HeaderCell>
                  <HeaderCell>Experience</HeaderCell>
                  <HeaderCell>Partner</HeaderCell>
                  <HeaderCell>Status</HeaderCell>
                </tr>
              </thead>
              <tbody className="bg-white">
                {filteredCandidates.map((candidate) => (
                  <tr key={candidate.id} className="border-t border-gray-100 text-slate-700">
                    <BodyCell>{candidate.job?.id ? `HRQ${candidate.job.id}` : '-'}</BodyCell>
                    <BodyCell>{`CA${candidate.id}`}</BodyCell>
                    <BodyCell>{candidate.name}</BodyCell>
                    <BodyCell>{candidate.job?.title || '-'}</BodyCell>
                    <BodyCell>{candidate.experience ?? '-'}</BodyCell>
                    <BodyCell>{candidate.vendor?.name || '-'}</BodyCell>
                    <BodyCell>
                      <StatusBadge status={candidate.status} />
                    </BodyCell>
                  </tr>
                ))}

                {!filteredCandidates.length && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-400">
                      No profiles available in this section.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : role === 'VENDOR' && ['acceptSlots', 'scheduledInterviews'].includes(activeTab) ? (
            <div className="grid gap-4 p-4 md:grid-cols-2">
              {filteredSlots.map((slot) => (
                <div
                  key={slot.id}
                  className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        {`HRQ${slot.job?.id}`} / {`CA${slot.candidate?.id}`}
                      </p>
                      <h3 className="mt-1 text-lg font-semibold text-slate-800">
                        {slot.candidate?.name || '-'}
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        {slot.job?.title || '-'}
                      </p>
                    </div>
                    <StatusBadge status={slot.status} />
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <SlotInfo label="Partner" value={slot.vendor?.name || '-'} />
                    <SlotInfo label="Round" value={formatRoundName(slot.roundName)} />
                    <SlotInfo label="Date" value={formatDate(slot.interviewDate)} />
                    <SlotInfo label="Time" value={slot.interviewTime || '-'} />
                    <SlotInfo
                      label="Attendance"
                      value={getHumanStatus(slot.attendanceStatus)}
                    />
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
                  </div>

                  {slot.vendorJustification && (
                    <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-slate-700">
                      <span className="font-medium">Justification:</span>{' '}
                      {slot.vendorJustification}
                    </div>
                  )}

                  <div className="mt-5">
                    {renderActionButton(role, activeTab, slot, setSelectedSlot)}
                  </div>
                </div>
              ))}

              {!filteredSlots.length && (
                <div className="col-span-full px-4 py-12 text-center text-sm text-slate-400">
                  No records available in this section yet.
                </div>
              )}
            </div>
          ) : (
            <table className="min-w-full text-sm">
              <thead className="bg-[#96f7e4] text-slate-700">
                <tr>
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
                </tr>
              </thead>
              <tbody className="bg-white">
                {filteredSlots.map((slot) => (
                  <tr key={slot.id} className="border-t border-gray-100 text-slate-700">
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
                      {renderActionButton(
                        role,
                        activeTab,
                        slot,
                        setSelectedSlot,
                      )}
                    </BodyCell>
                  </tr>
                ))}

                {!filteredSlots.length && (
                  <tr>
                    <td colSpan={12} className="px-4 py-12 text-center text-sm text-slate-400">
                      No records available in this section yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {selectedCandidate &&
        role === 'HIRING_MANAGER' &&
        activeTab === 'feedbackPending' && (
          <RightDrawer title="Review Candidate" onClose={closeAllDrawers}>
            <DrawerInfo candidate={selectedCandidate} />

            <label className="mt-6 block text-sm font-medium text-slate-700">
              Comments
            </label>
            <textarea
              rows={4}
              value={decisionFeedback}
              onChange={(event) => setDecisionFeedback(event.target.value)}
              className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-emerald-300"
              placeholder="Enter your comments here..."
            />

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                disabled={submitting}
                onClick={() => void submitHmProfileDecision('SELECT')}
                className="flex-1 rounded-lg bg-emerald-500 px-4 py-3 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-60"
              >
                Select Profile
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => void submitHmProfileDecision('REJECT')}
                className="flex-1 rounded-lg bg-red-600 px-4 py-3 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
              >
                Reject Profile
              </button>
            </div>
          </RightDrawer>
        )}

      {selectedCandidate &&
        role === 'HIRING_MANAGER' &&
        activeTab === 'awaitingSlots' && (
          <RightDrawer title="Create Interview Slot" onClose={closeAllDrawers}>
            <DrawerInfo candidate={selectedCandidate} />

            <div className="mt-6 space-y-4">
              <Field label="Interview Date">
                <input
                  type="date"
                  value={slotForm.interviewDate}
                  onChange={(event) =>
                    setSlotForm((prev) => ({
                      ...prev,
                      interviewDate: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
                />
              </Field>

              <Field label="Interview Time">
                <input
                  type="time"
                  value={slotForm.interviewTime}
                  onChange={(event) =>
                    setSlotForm((prev) => ({
                      ...prev,
                      interviewTime: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
                />
              </Field>

              <Field label="Comments">
                <textarea
                  rows={4}
                  value={slotForm.hmComment}
                  onChange={(event) =>
                    setSlotForm((prev) => ({
                      ...prev,
                      hmComment: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
                  placeholder="Enter your comment here..."
                />
              </Field>
            </div>

            <button
              type="button"
              disabled={submitting}
              onClick={() => void submitSlot()}
              className="mt-6 w-full rounded-lg bg-emerald-500 px-4 py-3 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-60"
            >
              Create Slot
            </button>
          </RightDrawer>
        )}

      {selectedSlot &&
        role === 'VENDOR' &&
        activeTab === 'acceptSlots' && (
          <RightDrawer title="Accept/Reject Slot" onClose={closeAllDrawers}>
            <DrawerInfo slot={selectedSlot} />

            <Field label="Comments *">
              <textarea
                rows={4}
                value={vendorComment}
                onChange={(event) => setVendorComment(event.target.value)}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
                placeholder="Enter your comment here..."
              />
            </Field>

            <p className="mt-4 text-sm italic text-slate-400">
              Note: Please confirm after scheduling
            </p>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                disabled={submitting}
                onClick={() => void submitVendorResponse('ACCEPT')}
                className="flex-1 rounded-lg bg-emerald-500 px-4 py-3 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-60"
              >
                Accept Slot
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => void submitVendorResponse('REJECT')}
                className="flex-1 rounded-lg bg-red-600 px-4 py-3 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
              >
                Reject Slot
              </button>
            </div>
          </RightDrawer>
        )}

      {selectedSlot &&
        role === 'VENDOR' &&
        activeTab === 'scheduledInterviews' && (
          <RightDrawer title="Update Interview Outcome" onClose={closeAllDrawers}>
            <DrawerInfo slot={selectedSlot} />

            <div className="mt-6 space-y-3">
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
            </div>

            <Field label="Comments">
              <textarea
                rows={4}
                value={vendorComment}
                onChange={(event) => setVendorComment(event.target.value)}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
                placeholder="Required for no-show, reschedule, or drop"
              />
            </Field>

            <button
              type="button"
              disabled={submitting}
              onClick={() => void submitAttendance()}
              className="mt-6 w-full rounded-lg bg-emerald-500 px-4 py-3 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-60"
            >
              Submit
            </button>
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
              <textarea
                rows={5}
                value={decisionFeedback}
                onChange={(event) => setDecisionFeedback(event.target.value)}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
                placeholder="Share the interview feedback here..."
              />
            </Field>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                disabled={submitting}
                onClick={() => void submitHmInterviewFeedback('SELECT')}
                className="flex-1 rounded-lg bg-emerald-500 px-4 py-3 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-60"
              >
                Select
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => void submitHmInterviewFeedback('REJECT')}
                className="flex-1 rounded-lg bg-red-600 px-4 py-3 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
              >
                Reject
              </button>
            </div>
          </RightDrawer>
        )}
    </div>
  );
};

export default PartnerSlotManagementView;

const HeaderCell = ({ children }: { children: ReactNode }) => (
  <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wide">
    {children}
  </th>
);

const BodyCell = ({ children }: { children: ReactNode }) => (
  <td className="px-4 py-4 align-middle">{children}</td>
);

const Field = ({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) => (
  <div className="mt-6">
    <label className="mb-2 block text-sm font-medium text-slate-700">{label}</label>
    {children}
  </div>
);

const SlotInfo = ({ label, value }: { label: string; value: ReactNode }) => (
  <div className="rounded-xl bg-slate-50 px-3 py-2">
    <p className="text-[11px] uppercase tracking-wide text-slate-400">{label}</p>
    <p className="mt-1 font-medium text-slate-700">{value}</p>
  </div>
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
  <div className="fixed inset-0 z-50 bg-black/30">
    <div className="absolute inset-y-0 right-0 w-full max-w-xl overflow-y-auto bg-white shadow-2xl">
      <div className="sticky top-0 flex items-center justify-between border-b bg-white px-6 py-5">
        <h3 className="text-2xl font-semibold text-emerald-700">{title}</h3>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-slate-700"
        >
          <X size={18} />
        </button>
      </div>
      <div className="px-6 py-6">{children}</div>
    </div>
  </div>
);

const DrawerInfo = ({
  candidate,
  slot,
}: {
  candidate?: CandidateRecord | EligibleSlotCandidate | null;
  slot?: PartnerSlot | null;
}) => {
  const data = slot
    ? {
        hrqId: `HRQ${slot.job?.id}`,
        candidateName: slot.candidate?.name,
        role: slot.job?.title,
        status: slot.status.replace(/_/g, ' '),
        panel: slot.roundName,
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
    <div className="rounded-xl bg-slate-50 px-4 py-4">
      <InfoLine label="HRQID" value={data.hrqId || '-'} />
      <InfoLine label="Candidate Name" value={data.candidateName || '-'} />
      <InfoLine label="Role Hired For" value={data.role || '-'} />
      <InfoLine label="Status" value={data.status || '-'} />
      <InfoLine label="Panel Member" value={data.panel || '-'} />
    </div>
  );
};

const InfoLine = ({ label, value }: { label: string; value: ReactNode }) => (
  <div className="grid grid-cols-[150px_1fr] gap-4 py-2 text-sm">
    <span className="font-medium text-slate-500">{label}</span>
    <span className="text-right font-medium text-slate-700">{value}</span>
  </div>
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
  <label className="flex items-center gap-3 rounded-xl border border-gray-200 px-3 py-3 text-sm text-slate-700">
    <input type="radio" checked={checked} onChange={onChange} />
    <span>{label}</span>
  </label>
);

const StatusBadge = ({ status }: { status: string }) => {
  const styles = getStatusStyle(status);

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${styles}`}>
      {getHumanStatus(status)}
    </span>
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
      <button
        type="button"
        onClick={() => setSelectedSlot(slot)}
        className="rounded-lg bg-emerald-500 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-600"
      >
        Manage
      </button>
    );
  }

  if (role === 'VENDOR' && activeTab === 'scheduledInterviews' && slot.status === 'SCHEDULED') {
    return (
      <button
        type="button"
        onClick={() => setSelectedSlot(slot)}
        className="rounded-lg bg-emerald-500 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-600"
      >
        Manage
      </button>
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
      <button
        type="button"
        onClick={() => setSelectedSlot(slot)}
        className="rounded-lg bg-emerald-500 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-600"
      >
        Feedback
      </button>
    );
  }

  return <span className="text-xs text-slate-400">-</span>;
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
    return 'bg-emerald-50 text-emerald-700';
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
    return 'bg-red-50 text-red-700';
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
    return 'bg-amber-50 text-amber-700';
  }
  return 'bg-slate-100 text-slate-700';
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
