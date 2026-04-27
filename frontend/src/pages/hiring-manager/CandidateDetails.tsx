import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  'bg-emerald-500',
  'bg-cyan-500',
  'bg-teal-500',
  'bg-sky-500',
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
    return <div className="p-6">Loading...</div>;
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
  const isVendorManagerView = pathname.startsWith('/vendor-manager/');
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
    normalizedStatus === 'SUBMITTED' || hasAttendedInterviewAwaitingHmFeedback;

  const canHmEdit =
    isHiringManagerView &&
    !isFinalForHm &&
    !hmSlotGateMessage &&
    canHmSubmitStageDecision;

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

  const resumeUrl = `${import.meta.env.VITE_API_URL}/candidates/${candidate.id}/resume`;

  return (
    <div className="space-y-5">
      <button
        onClick={() => navigate(backRoute)}
        className="inline-flex items-center rounded-md bg-emerald-500 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-600"
      >
        Back
      </button>

      <section className="overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm">
        <div className="border-b border-emerald-100 px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-lg font-semibold text-slate-800">
                Candidate Details
              </h1>
            </div>
            <StageBadge status={candidate.status} />
          </div>
        </div>

        <div className="space-y-5 px-5 py-4">
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-5">
            <InfoColumn
              items={[
                {
                  icon: <User size={13} />,
                  label: 'Candidate Name',
                  value: candidate.name,
                },
                {
                  icon: <Mail size={13} />,
                  label: 'Email',
                  value: candidate.email,
                },
                {
                  icon: <Phone size={13} />,
                  label: 'Phone',
                  value: candidate.phone,
                },
                {
                  icon: <IdCard size={13} />,
                  label: 'Aadhaar No',
                  value: candidate.aadharNo || '-',
                },
              ]}
            />

            <InfoColumn
              items={[
                {
                  icon: <MapPin size={13} />,
                  label: 'Location',
                  value: candidateLocation || '-',
                },
                {
                  icon: <IdCard size={13} />,
                  label: 'Candidate ID',
                  value: `CA${candidate.id}`,
                },
                {
                  icon: <Building2 size={13} />,
                  label: 'Current Organization',
                  value: candidate.currentOrg || '-',
                },
                {
                  icon: <Briefcase size={13} />,
                  label: 'Education',
                  value: candidate.education || '-',
                },
              ]}
            />

            <InfoColumn
              items={[
                {
                  icon: <Calendar size={13} />,
                  label: 'Last Working Date',
                  value: formatDate(candidate.lastWorkingDay),
                },
                {
                  icon: <Clock3 size={13} />,
                  label: 'Notice Period',
                  value:
                    candidate.noticePeriod !== undefined &&
                    candidate.noticePeriod !== null
                      ? `${candidate.noticePeriod} days`
                      : '-',
                },
                {
                  icon: <Briefcase size={13} />,
                  label: 'Experience',
                  value:
                    candidate.experience !== undefined &&
                    candidate.experience !== null
                      ? `${candidate.experience} years`
                      : '-',
                },
                {
                  icon: <User size={13} />,
                  label: 'Gender',
                  value: candidate.gender || '-',
                },
              ]}
            />

            <InfoColumn
              items={[
                {
                  icon: <User size={13} />,
                  label: 'Currently Working',
                  value: candidate.currentlyWorking ?? '-',
                },
                {
                  icon: <Users size={13} />,
                  label: 'Diversity',
                  value: candidate.diversity ?? '-',
                },
                {
                  icon: <Calendar size={13} />,
                  label: 'Date of Joining',
                  value: formatDate(candidate.dateOfJoining),
                },
                {
                  icon: <Link2 size={13} />,
                  label: 'Video Profile',
                  value: candidate.videoLink ? (
                    <a
                      href={candidate.videoLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-slate-700 hover:text-emerald-600"
                    >
                      Open Video
                      <Link2 size={12} />
                    </a>
                  ) : (
                    '-'
                  ),
                },
              ]}
            />

            <InfoColumn
              items={[
                {
                  icon: <IdCard size={13} />,
                  label: 'Employee ID',
                  value: candidate.employeeId ?? '-',
                },
                {
                  icon: <FileText size={13} />,
                  label: 'Resume',
                  value: (
                    <a
                      href={resumeUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-slate-700 hover:text-emerald-600"
                    >
                      Resume
                      <FileText size={12} />
                    </a>
                  ),
                },
                {
                  icon: <Calendar size={13} />,
                  label: 'Resume Upload Date',
                  value: formatDate(candidate.createdAt),
                },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 border-t border-emerald-100 pt-3 lg:grid-cols-2">
            <SkillSection title="Primary Skills" skills={candidate.primarySkills} />
            <SkillSection title="Secondary Skills" skills={candidate.secondarySkills} />
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm">
        <div className="border-b border-emerald-100 bg-emerald-50/50 px-5 py-3">
          <h2 className="text-sm font-semibold text-slate-800">
            Interview History
          </h2>
        </div>

        <div className="space-y-4 px-4 py-4">
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 px-4 py-3 text-sm text-slate-700">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-emerald-400 px-3 py-1 text-xs font-semibold text-white">
                  {candidate.job?.id ? `HRQ${candidate.job.id}` : '-'}
                </span>
                <span className="font-medium text-slate-800">
                  {candidate.job?.title || '-'}
                </span>
              </div>
              <span className="text-xs text-slate-500">
                {interviewHistory.length} interview rounds
              </span>
            </div>

            <div className="mt-2 flex flex-wrap gap-5 text-xs text-slate-600">
              <span>HRQ Status: {candidate.job?.status || '-'}</span>
              <span>Partner: {candidate.vendor?.name || '-'}</span>
            </div>
          </div>

          {interviewHistory.length ? (
            interviewHistory.map((interview, index) => (
              <article
                key={interview.id}
                className="rounded-xl border border-emerald-100 bg-white px-4 py-4 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white ${
                        ROUND_COLORS[index % ROUND_COLORS.length]
                      }`}
                    >
                      {interviewHistory.length - index}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-800">
                        {formatRoundName(interview.round?.roundName)}
                      </h3>
                    </div>
                  </div>

                  <div className="space-y-1 text-right text-xs">
                    <TinyStatus label="Slot" value="Selected" />
                    <TinyStatus
                      label="Decision"
                      value={interview.decision === 'SELECT' ? 'Selected' : 'Rejected'}
                    />
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-4 text-sm xl:grid-cols-6">
                  <MiniInfo
                    icon={<Users size={12} />}
                    label="Panel Members"
                    value={interview.panelMembers || '-'}
                  />
                  <MiniInfo
                    icon={<Calendar size={12} />}
                    label="Interview Date/Time"
                    value={formatDateTime(interview.feedbackDate)}
                  />
                  <MiniInfo
                    icon={<Briefcase size={12} />}
                    label="Interview Mode"
                    value={interview.round?.mode || '-'}
                  />
                  <MiniInfo
                    icon={<User size={12} />}
                    label="Feedback Given By"
                    value={candidate.job?.hiringManager || 'Hiring Manager'}
                  />
                  <MiniInfo
                    icon={<Calendar size={12} />}
                    label="Feedback Date/Time"
                    value={formatDateTime(interview.feedbackDate)}
                  />
                  <MiniInfo
                    icon={<Clock3 size={12} />}
                    label="TAT (in days)"
                    value={getTatDays(candidate.createdAt, interview.feedbackDate)}
                  />
                </div>

                <div className="mt-4 rounded-lg border border-emerald-300 bg-emerald-50/60 px-3 py-2 text-xs text-slate-700">
                  <span className="font-semibold text-emerald-700">
                    INTERVIEW COMMENTS:
                  </span>{' '}
                  {interview.feedback || 'No feedback shared yet.'}
                </div>
              </article>
            ))
          ) : (
            <div className="rounded-xl border border-dashed border-emerald-200 bg-white px-4 py-10 text-center text-sm text-slate-400">
              No interview history available yet.
            </div>
          )}
        </div>
      </section>

      {candidate.status === 'DROPPED' && (
        <section className="rounded-2xl border border-rose-100 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-800">
            Drop Justification
          </h2>
          <p className="mt-3 text-sm text-slate-700">
            {candidate.dropJustification || '-'}
          </p>
        </section>
      )}

      {candidate.status === 'YET_TO_JOIN' && candidate.ytjJustification && (
        <section className="rounded-2xl border border-amber-100 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-800">
            Yet To Join Details
          </h2>
          <div className="mt-3 space-y-2 text-sm text-slate-700">
            <p>
              <span className="font-medium">DOJ:</span>{' '}
              {formatDate(candidate.dateOfJoining)}
            </p>
            <p>
              <span className="font-medium">Justification:</span>{' '}
              {candidate.ytjJustification}
            </p>
          </div>
        </section>
      )}

      {isHiringManagerView && ['SCREEN_SELECTED', 'TECH_SELECTED'].includes(normalizedStatus) && (
        <section className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-800">
                Interview Scheduling
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Schedule the next interview round for this candidate.
              </p>
            </div>

            {canScheduleInterview && (
              <button
                type="button"
                onClick={() => setShowScheduleBox(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600"
              >
                <CalendarDays size={16} />
                Schedule Interview
              </button>
            )}
          </div>

          {!canScheduleInterview && !hasAttendedInterviewAwaitingHmFeedback && interviewGateMessage && (
            <p className="mt-4 text-sm text-slate-600">{interviewGateMessage}</p>
          )}

          {hasOpenInterviewSlot && latestSlot && (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-3 text-sm text-slate-700">
              <div className="grid gap-3 md:grid-cols-4">
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">
                    Round
                  </p>
                  <p className="font-medium text-slate-800">
                    {formatRoundName(latestSlot.roundName)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">
                    Interview Date
                  </p>
                  <p className="font-medium text-slate-800">
                    {formatDate(latestSlot.interviewDate)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">
                    Interview Time
                  </p>
                  <p className="font-medium text-slate-800">
                    {latestSlot.interviewTime || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">
                    Vendor Response
                  </p>
                  <p className="font-medium text-slate-800">
                    {latestSlot.status === 'PENDING_VENDOR'
                      ? 'Awaiting vendor'
                      : latestSlot.status === 'SCHEDULED'
                        ? 'Accepted'
                        : latestSlot.status}
                  </p>
                </div>
              </div>
            </div>
          )}

          {hasAttendedInterviewAwaitingHmFeedback && latestSlot && (
            <div className="mt-4 rounded-xl border border-cyan-200 bg-cyan-50/70 px-4 py-3 text-sm text-slate-700">
              <p className="font-medium text-slate-800">
                The {formatRoundName(latestSlot.roundName).toLowerCase()} interview has been marked as attended.
              </p>
              <p className="mt-1">
                You can now submit the next stage decision for this candidate.
              </p>
            </div>
          )}

          {!hasOpenInterviewSlot && latestSlot?.status === 'REJECTED' && (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3 text-sm text-slate-700">
              <p className="font-medium text-slate-800">Last slot was rejected by vendor.</p>
              <p className="mt-1">
                <span className="font-medium">Justification:</span>{' '}
                {latestSlot.vendorJustification || '-'}
              </p>
            </div>
          )}
        </section>
      )}

      {(canHmEdit || canVmFinalize) && (
        <section className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-800">
            Candidate Action
          </h2>

          {canHmEdit && (
            <div className="mt-4 space-y-4">
              <p className="text-sm text-slate-600">
                Update candidate status from <strong>{candidate.status}</strong>
              </p>

              <div className="flex flex-wrap gap-3">
                <button
                  disabled={loading}
                  onClick={() => {
                    setPendingHmDecision('SELECT');
                    setShowRejectBox(true);
                  }}
                  className="rounded-lg bg-emerald-500 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-60"
                >
                  {hmSelectLabel}
                </button>
                <button
                  disabled={loading}
                  onClick={() => {
                    setPendingHmDecision('REJECT');
                    setShowRejectBox(true);
                  }}
                  className="rounded-lg bg-rose-500 px-5 py-2 text-sm font-medium text-white hover:bg-rose-600 disabled:opacity-60"
                >
                  {hmRejectLabel}
                </button>
              </div>

              {showRejectBox && (
                <div className="space-y-3">
                  <textarea
                    rows={4}
                    placeholder="Enter feedback / justification..."
                    value={feedback}
                    onChange={(event) => setFeedback(event.target.value)}
                    className="w-full rounded-xl border border-emerald-200 p-3 text-sm outline-none ring-0"
                  />
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => {
                        setShowRejectBox(false);
                        setPendingHmDecision(null);
                        setFeedback('');
                      }}
                      className="rounded-lg border border-slate-200 px-5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-60"
                    >
                      Cancel
                    </button>
                    <button
                      disabled={loading || !pendingHmDecision}
                      onClick={() =>
                        pendingHmDecision
                          ? void submitHmDecision(pendingHmDecision)
                          : undefined
                      }
                      className={`rounded-lg px-5 py-2 text-sm font-medium text-white disabled:opacity-60 ${
                        pendingHmDecision === 'REJECT'
                          ? 'bg-rose-600 hover:bg-rose-700'
                          : 'bg-emerald-600 hover:bg-emerald-700'
                      }`}
                    >
                      {pendingHmDecision === 'REJECT'
                        ? `Confirm ${hmRejectLabel}`
                        : `Confirm ${hmSelectLabel}`}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {isHiringManagerView && hmSlotGateMessage && (
            <p className="mt-4 text-sm text-amber-600">{hmSlotGateMessage}</p>
          )}

          {canVmFinalize && (
            <div className="mt-4 space-y-4">
              <p className="text-sm text-slate-600">
                Finalize candidate from <strong>{candidate.status}</strong>
              </p>

              <div className="flex flex-wrap gap-3">
                {['IDENTIFIED', 'OPS_SELECTED', 'SELECTED'].includes(candidate.status) && (
                  <button
                    disabled={loading}
                    onClick={() => setShowYtjBox(true)}
                    className="rounded-lg bg-emerald-500 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-60"
                  >
                    Yet To Join
                  </button>
                )}

                {candidate.status === 'YET_TO_JOIN' &&
                  candidate.dateOfJoining === today && (
                    <>
                      <button
                        disabled={loading}
                        onClick={() => void submitVendorManagerDecision('ONBOARDED')}
                        className="rounded-lg bg-emerald-500 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-60"
                      >
                        Onboarded
                      </button>
                      <button
                        disabled={loading}
                        onClick={() => setShowDropBox(true)}
                        className="rounded-lg bg-rose-500 px-5 py-2 text-sm font-medium text-white hover:bg-rose-600 disabled:opacity-60"
                      >
                        Drop
                      </button>
                    </>
                  )}
              </div>

              {showYtjBox && (
                <div className="space-y-3">
                  <input
                    type="date"
                    value={ytjDateOfJoining}
                    onChange={(event) => setYtjDateOfJoining(event.target.value)}
                    className="w-full rounded-xl border border-emerald-200 p-3 text-sm outline-none ring-0"
                  />
                  <textarea
                    rows={4}
                    placeholder="Enter YTJ justification..."
                    value={ytjJustification}
                    onChange={(event) => setYtjJustification(event.target.value)}
                    className="w-full rounded-xl border border-emerald-200 p-3 text-sm outline-none ring-0"
                  />
                  <button
                    disabled={loading}
                    onClick={() => void submitVendorManagerDecision('YET_TO_JOIN')}
                    className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
                  >
                    Save YTJ
                  </button>
                </div>
              )}

              {showDropBox && (
                <div className="space-y-3">
                  <textarea
                    rows={4}
                    placeholder={
                      candidate.status === 'YET_TO_JOIN'
                        ? 'Enter drop note (optional)...'
                        : 'Enter drop justification...'
                    }
                    value={feedback}
                    onChange={(event) => setFeedback(event.target.value)}
                    className="w-full rounded-xl border border-emerald-200 p-3 text-sm outline-none ring-0"
                  />
                  <button
                    disabled={loading}
                    onClick={() => void submitVendorManagerDecision('DROPPED')}
                    className="rounded-lg bg-rose-600 px-5 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-60"
                  >
                    Confirm Drop
                  </button>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {showScheduleBox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg space-y-4 rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">
                  Schedule Interview
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Set the interview date and time for {candidate.name}.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowScheduleBox(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                x
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Interview Date
                </label>
                <input
                  type="date"
                  value={slotForm.interviewDate}
                  onChange={(event) =>
                    setSlotForm((prev) => ({
                      ...prev,
                      interviewDate: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Interview Time
                </label>
                <input
                  type="time"
                  value={slotForm.interviewTime}
                  onChange={(event) =>
                    setSlotForm((prev) => ({
                      ...prev,
                      interviewTime: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Comments
                </label>
                <textarea
                  rows={4}
                  value={slotForm.hmComment}
                  onChange={(event) =>
                    setSlotForm((prev) => ({
                      ...prev,
                      hmComment: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  placeholder="Optional hiring manager note..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowScheduleBox(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={partnerSlotLoading}
                onClick={() => void submitScheduleInterview()}
                className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-60"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CandidateDetails;

const InfoColumn = ({ items }: { items: Array<{ icon: ReactNode; label: string; value: ReactNode }> }) => (
  <div className="space-y-3">
    {items.map((item) => (
      <div key={item.label} className="flex items-start gap-2">
        <span className="mt-0.5 text-emerald-400">{item.icon}</span>
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-wide text-slate-400">
            {item.label}
          </p>
          <div className="text-sm font-medium text-slate-700">
            {item.value || '-'}
          </div>
        </div>
      </div>
    ))}
  </div>
);

const SkillSection = ({
  title,
  skills,
}: {
  title: string;
  skills?: string;
}) => (
  <div>
    <p className="mb-2 text-xs font-medium text-slate-500">{title}</p>
    <div className="flex flex-wrap gap-2">
      {(skills || '')
        .split(',')
        .map((skill) => skill.trim())
        .filter(Boolean)
        .map((skill) => (
          <span
            key={skill}
            className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-700"
          >
            {skill}
          </span>
        ))}
      {!skills && <span className="text-sm text-slate-400">-</span>}
    </div>
  </div>
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
  <div className="min-w-0">
    <div className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-slate-400">
      <span className="text-emerald-400">{icon}</span>
      <span>{label}</span>
    </div>
    <div className="mt-1 text-xs font-medium text-slate-700">{value || '-'}</div>
  </div>
);

const TinyStatus = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-end gap-2 text-[11px] text-slate-500">
    <span className="h-2 w-2 rounded-full bg-emerald-400" />
    <span>
      {label}
      {': '}
      <span className="font-medium text-slate-700">{value}</span>
    </span>
  </div>
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
