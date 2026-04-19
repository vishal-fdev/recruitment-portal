import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Briefcase,
  Building2,
  Calendar,
  Clock3,
  FileText,
  IdCard,
  Mail,
  MapPin,
  Phone,
  User,
  Users,
} from 'lucide-react';
import api from '../../api/api';
import StageBadge from '../../components/StageBadge';
import { authService } from '../../auth/authService';
import { getPartnerSlots, type PartnerSlot } from '../../services/partnerSlotService';

type CandidateStatus =
  | 'SUBMITTED'
  | 'SCREEN_SELECTED'
  | 'SCREEN_REJECTED'
  | 'TECH_SELECTED'
  | 'TECH_REJECTED'
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
  'OPS_SELECTED',
];

const LEGACY_FLOW_MAP: Partial<Record<CandidateStatus, CandidateStatus>> = {
  NEW: 'SUBMITTED',
  SCREENING: 'SUBMITTED',
  TECH: 'SCREEN_SELECTED',
  OPS: 'TECH_SELECTED',
  SELECTED: 'OPS_SELECTED',
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

  const [candidate, setCandidate] = useState<any>(null);
  const [feedback, setFeedback] = useState('');
  const [showRejectBox, setShowRejectBox] = useState(false);
  const [showDropBox, setShowDropBox] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hmSlotGateMessage, setHmSlotGateMessage] = useState('');

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

    switch (role) {
      case 'VENDOR':
        return '/vendor/candidates';
      case 'VENDOR_MANAGER':
        return '/vendor-manager/candidates';
      case 'VENDOR_MANAGER_HEAD':
        return '/vendor-manager-head/jobs';
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

    if (role === 'HIRING_MANAGER') {
      const slotData = await getPartnerSlots();
      const relevantSlots = slotData.filter(
        (slot: PartnerSlot) => slot.candidate?.id === Number(candidateId),
      );

      const needsInterviewCompletion = ['SCREEN_SELECTED', 'TECH', 'TECH_SELECTED', 'OPS'].includes(
        res.data.status,
      );

      if (!needsInterviewCompletion) {
        setHmSlotGateMessage('');
        return;
      }

      const attendedSlotReady = relevantSlots.some(
        (slot) =>
          slot.status === 'CLOSED' &&
          slot.attendanceStatus === 'ATTENDED' &&
          !slot.hmFeedbackSubmitted,
      );

      setHmSlotGateMessage(
        attendedSlotReady
          ? ''
          : 'Hiring manager feedback will unlock after the vendor marks this candidate as interviewed in Partner Slot Management.',
      );
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
    currentStageIndex >= 0 ? HM_FLOW[currentStageIndex + 1] : null;

  const hmFinalStatuses: CandidateStatus[] = [
    'SCREEN_REJECTED',
    'TECH_REJECTED',
    'OPS_REJECTED',
    'OPS_SELECTED',
    'ONBOARDED',
    'DROPPED',
    'REJECTED',
    'SELECTED',
  ];

  const isFinalForHm = hmFinalStatuses.includes(candidate.status);
  const canHmEdit = role === 'HIRING_MANAGER' && !isFinalForHm && !hmSlotGateMessage;
  const canVmFinalize =
    role === 'VENDOR_MANAGER' &&
    ['OPS_SELECTED', 'SELECTED', 'ONBOARDED'].includes(candidate.status);

  const submitHmDecision = async (decision: 'SELECT' | 'REJECT') => {
    let status: CandidateStatus | null = null;

    if (decision === 'REJECT') {
      if (!feedback.trim()) {
        alert('Rejection justification is mandatory');
        return;
      }

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
    setLoading(false);
  };

  const submitVendorManagerDecision = async (
    status: 'ONBOARDED' | 'DROPPED',
  ) => {
    if (status === 'DROPPED' && !feedback.trim()) {
      alert('Drop justification is mandatory');
      return;
    }

    setLoading(true);

    await api.patch(`/candidates/${candidate.id}/status`, {
      status,
      dropJustification: feedback,
    });

    await loadCandidate(candidate.id);
    setFeedback('');
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
                  onClick={() => void submitHmDecision('SELECT')}
                  className="rounded-lg bg-emerald-500 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-60"
                >
                  Select
                </button>
                <button
                  disabled={loading}
                  onClick={() => setShowRejectBox(true)}
                  className="rounded-lg bg-rose-500 px-5 py-2 text-sm font-medium text-white hover:bg-rose-600 disabled:opacity-60"
                >
                  Reject
                </button>
              </div>

              {showRejectBox && (
                <div className="space-y-3">
                  <textarea
                    rows={4}
                    placeholder="Enter rejection justification..."
                    value={feedback}
                    onChange={(event) => setFeedback(event.target.value)}
                    className="w-full rounded-xl border border-emerald-200 p-3 text-sm outline-none ring-0"
                  />
                  <button
                    disabled={loading}
                    onClick={() => void submitHmDecision('REJECT')}
                    className="rounded-lg bg-rose-600 px-5 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-60"
                  >
                    Confirm Reject
                  </button>
                </div>
              )}
            </div>
          )}

          {role === 'HIRING_MANAGER' && hmSlotGateMessage && (
            <p className="mt-4 text-sm text-amber-600">{hmSlotGateMessage}</p>
          )}

          {canVmFinalize && (
            <div className="mt-4 space-y-4">
              <p className="text-sm text-slate-600">
                Finalize candidate from <strong>{candidate.status}</strong>
              </p>

              <div className="flex flex-wrap gap-3">
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
              </div>

              {showDropBox && (
                <div className="space-y-3">
                  <textarea
                    rows={4}
                    placeholder="Enter drop justification..."
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
