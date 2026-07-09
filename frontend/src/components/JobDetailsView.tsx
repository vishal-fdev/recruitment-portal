import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Button,
  Heading,
  Paragraph,
  Spinner,
  Text,
  TextArea,
} from 'grommet';
import { BriefcaseBusiness, ClipboardList, FileText, Medal, UsersRound } from 'lucide-react';
import {
  approveJob,
  downloadJD,
  downloadPSQ,
  getJobDetails,
  rejectJob,
  updateCalibrationNotes,
} from '../services/jobService';
import type { Job } from '../services/jobService';

type TabType = 'DETAILS' | 'INTERVIEWS' | 'CALIBRATION';

type JobDetailsViewProps = {
  backRoute: string;
  showApprovalActions: boolean;
  allowResubmit?: boolean;
};

type BackfillEntry = {
  employeeId?: string;
  employeeName?: string;
};

const TAB_INDEX: Record<TabType, number> = {
  DETAILS: 0,
  INTERVIEWS: 1,
  CALIBRATION: 2,
};

const JobDetailsView = ({
  backRoute,
  showApprovalActions,
  allowResubmit = !showApprovalActions,
}: JobDetailsViewProps) => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('DETAILS');
  const [calibrationNotes, setCalibrationNotes] = useState('');
  const [isEditingCalibration, setIsEditingCalibration] = useState(false);
  const [isSavingCalibration, setIsSavingCalibration] = useState(false);
  const currentRole = localStorage.getItem('role');
  const canManageCalibration = currentRole !== 'VENDOR';
  const canResubmit =
    allowResubmit && ['PENDING_APPROVAL', 'REJECTED'].includes(job?.status || '');

  useEffect(() => {
    if (id) {
      void loadJob(Number(id));
    }
  }, [id]);

  const loadJob = async (jobId: number) => {
    try {
      const data = await getJobDetails(jobId);
      const order = ['SCREENING', 'TECH', 'OPS'];

      if (data.interviewRounds) {
        data.interviewRounds = [...data.interviewRounds].sort(
          (a, b) => order.indexOf(a.roundName) - order.indexOf(b.roundName),
        );
      }

      setJob(data);
      setCalibrationNotes(data.calibrationNotes || '');
    } catch {
      console.error('Failed to fetch job');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!job) return;

    setActionLoading(true);
    await approveJob(job.id);
    await loadJob(job.id);
    setActionLoading(false);
  };

  const handleReject = async () => {
    if (!job) return;

    setActionLoading(true);
    await rejectJob(job.id);
    await loadJob(job.id);
    setActionLoading(false);
  };

  const handleSaveCalibration = async () => {
    if (!job) return;

    setIsSavingCalibration(true);
    try {
      const updatedJob = await updateCalibrationNotes(job.id, calibrationNotes);
      setJob(updatedJob);
      setCalibrationNotes(updatedJob.calibrationNotes || '');
      setIsEditingCalibration(false);
    } catch {
      alert('Failed to save calibration pointers');
    } finally {
      setIsSavingCalibration(false);
    }
  };

  const triggerDownload = (link: string) => {
    const anchor = document.createElement('a');
    anchor.href = link;
    anchor.target = '_blank';
    anchor.rel = 'noreferrer';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  };

  if (loading) {
    return (
      <Box align="center" justify="center" pad="xlarge">
        <Spinner size="medium" />
      </Box>
    );
  }

  if (!job) {
    return (
      <Box pad="large">
        <Text>Job not found.</Text>
      </Box>
    );
  }

  let hiringManagerName = job.hiringManager;
  if (!hiringManagerName) {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        hiringManagerName = payload.name || payload.email;
      }
    } catch {}
  }

  const formatSkills = (skills: unknown) => {
    if (!skills) return '-';
    if (Array.isArray(skills)) return skills.join(', ');
    return String(skills);
  };

  const formatDate = (value?: string) => {
    if (!value) return '-';
    return value.split('T')[0];
  };

  const parseBackfillEntries = (
    employeeIdValue: unknown,
    employeeNameValue: unknown,
  ): BackfillEntry[] => {
    const parseValue = (value: unknown) => {
      if (typeof value !== 'string') return null;

      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : null;
      } catch {
        return null;
      }
    };

    const parsedIds = parseValue(employeeIdValue);
    if (parsedIds?.length) {
      return parsedIds.map((entry: any) => ({
        employeeId: entry?.employeeId || '-',
        employeeName: entry?.employeeName || '-',
      }));
    }

    const parsedNames = parseValue(employeeNameValue);
    if (parsedNames?.length) {
      return parsedNames.map((entry: any) => ({
        employeeId: entry?.employeeId || '-',
        employeeName: entry?.employeeName || '-',
      }));
    }

    return [
      {
        employeeId:
          typeof employeeIdValue === 'string' && employeeIdValue.trim()
            ? employeeIdValue
            : '-',
        employeeName:
          typeof employeeNameValue === 'string' && employeeNameValue.trim()
            ? employeeNameValue
            : '-',
      },
    ];
  };

  const renderBackfillValue = (
    employeeIdValue: unknown,
    employeeNameValue: unknown,
    field: 'employeeId' | 'employeeName',
  ) => {
    const entries = parseBackfillEntries(employeeIdValue, employeeNameValue);

    return (
      <Box gap="xsmall" align="end">
        {entries.map((entry, index) => (
          <Text key={`${field}-${index}`} size="small" weight={500}>
            {field === 'employeeId' ? entry.employeeId || '-' : entry.employeeName || '-'}
          </Text>
        ))}
      </Box>
    );
  };

  return (
    <Box gap="14px" style={{ width: '100%' }}>
      <Button
        label="‹ Back"
        onClick={() => navigate(backRoute)}
        primary
        color="#00A982"
        style={{
          alignSelf: 'flex-start',
          borderRadius: 6,
          padding: '8px 16px',
          color: '#FFFFFF',
          fontSize: 13,
          fontWeight: 700,
          border: 'none',
        }}
      />

      <Box direction="row" justify="between" align="center" gap="medium" wrap style={{ minHeight: 42 }}>
        <Box direction="row" align="center" gap="small" wrap>
          {showApprovalActions && job.status === 'PENDING_APPROVAL' && (
            <>
              <button
                type="button"
                onClick={() => void handleApprove()}
                disabled={actionLoading}
                style={approvalButtonStyle('approve', actionLoading)}
              >
                Approve
              </button>
              <button
                type="button"
                onClick={() => void handleReject()}
                disabled={actionLoading}
                style={approvalButtonStyle('reject', actionLoading)}
              >
                Reject
              </button>
            </>
          )}
        </Box>

        <Box direction="row" align="center" gap="small" wrap>
          <button
            type="button"
            disabled={!((job.jdFiles?.length ?? 0) > 0 || job.jdFileName)}
            onClick={() => {
              if (!((job.jdFiles?.length ?? 0) > 0 || job.jdFileName)) return;
              triggerDownload(downloadJD(job.id));
            }}
            style={topActionButtonStyle(!((job.jdFiles?.length ?? 0) > 0 || job.jdFileName))}
          >
            Download JD
          </button>
          <button
            type="button"
            disabled={!((job.psqFiles?.length ?? 0) > 0 || job.psqFileName)}
            onClick={() => {
              if (!((job.psqFiles?.length ?? 0) > 0 || job.psqFileName)) return;
              triggerDownload(downloadPSQ(job.id));
            }}
            style={topActionButtonStyle(!((job.psqFiles?.length ?? 0) > 0 || job.psqFileName))}
          >
            Download PSQ
          </button>
          {canResubmit && (
            <Button
              primary
              color="brand"
              label="Resubmit"
              style={{
                borderRadius: '999px',
                minHeight: 37,
                padding: '8px 20px',
                color: '#FFFFFF',
                fontSize: 15,
                fontWeight: 700,
                background: '#00A982',
                border: 'none',
              }}
              onClick={() =>
                navigate(`/hiring-manager/edit-job/${job.id}`, {
                  state: { job },
                })
              }
            />
          )}
        </Box>
      </Box>

      <div style={styles.tabRail}>
        {([
          ['DETAILS', 'Details'],
          ['INTERVIEWS', 'Interview Rounds'],
          ['CALIBRATION', 'Calibration'],
        ] as [TabType, string][]).map(([tab, label]) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            style={{
              ...styles.tabButton,
              ...(activeTab === tab ? styles.activeTabButton : {}),
            }}
          >
            {tab === 'DETAILS' && <FileText size={15} />}
            {tab === 'INTERVIEWS' && <UsersRound size={15} />}
            {tab === 'CALIBRATION' && <Medal size={15} />}
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'DETAILS' && (
        <Box gap="28px">
          <div style={styles.infoGrid}>
          <InfoCard title="Hiring Information" icon={<BriefcaseBusiness size={18} />}>
            <DetailRow label="HRQ ID" value={`HRQ${job.id}`} />
            <DetailRow label="Role" value={job.title} />
            <DetailRow label="Hiring Manager" value={hiringManagerName} />
            <DetailRow label="Business" value={job.department} />
            <DetailRow label="Request Assigned Date" value={formatDate(job.createdAt)} />
            <DetailRow label="Practice" value={job.jobCategory || '-'} />
            <DetailRow label="Practice Manager" value={hiringManagerName || '-'} />
          </InfoCard>

          <InfoCard title="Job Information" icon={<ClipboardList size={18} />}>
            <DetailRow label="Hiring Activity" value={job.employmentType || '-'} />
            <DetailRow label="Sub-Practice" value={job.jobCategory || '-'} />
            <DetailRow label="Sub-Practice Manager" value={hiringManagerName || '-'} />
            <DetailRow label="Mandatory Certification" value="NA" />
            <DetailRow label="Job Level" value={job.level || '-'} />
            <DetailRow label="Relevant Experience" value={job.experience || '-'} pill />
            <DetailRow label="Total Experience" value={job.experience || '-'} pill />
            <DetailRow label="Countries" value="India" />
            <DetailRow label="State" value={job.region || '-'} />
            <DetailRow label="Job Location" value={job.location} />
            <DetailRow label="Secondary City" value="-" />
            <DetailRow label="Employment Type" value={job.employmentType} />
            <DetailRow label="Work Type" value={job.workType} />
            <DetailRow label="Category" value={job.jobCategory} />
            <DetailRow label="Region" value={job.region} />
            <DetailRow label="Deal" value={job.dealName} />
            <DetailRow label="Start Date" value={formatDate(job.startDate)} />
            <DetailRow label="End Date" value={formatDate(job.endDate)} />
            <DetailRow label="Primary Skills" value={formatSkills(job.primarySkills)} />
            <DetailRow label="Secondary Skills" value={formatSkills(job.secondarySkills)} />
          </InfoCard>
          </div>

          <InfoCard title="Position Details" icon={<ClipboardList size={18} />}>
            <div style={styles.positionStack}>
              <div style={styles.positionGroup}>
                <h4 style={styles.positionTitle}>Main Position</h4>
                <DetailRow label="Request Type" value={job.requestType} />
                <DetailRow label="No. Positions" value={job.numberOfPositions} />
                <DetailRow label="Level" value={job.level} />

                {job.requestType === 'BACKFILL' && (
                  <>
                    <DetailRow
                      label="Employee ID"
                      value={renderBackfillValue(
                        job.backfillEmployeeId,
                        job.backfillEmployeeName,
                        'employeeId',
                      )}
                    />
                    <DetailRow
                      label="Employee Name"
                      value={renderBackfillValue(
                        job.backfillEmployeeId,
                        job.backfillEmployeeName,
                        'employeeName',
                      )}
                    />
                  </>
                )}
              </div>

              {job.positions?.map((position, index) => (
                <div
                  key={position.id}
                  style={styles.additionalPositionGroup}
                >
                  <h4 style={styles.positionTitle}>Additional Position {index + 1}</h4>
                  <DetailRow label="Level" value={position.level} />
                  <DetailRow label="Openings" value={position.openings} />
                  <DetailRow label="Request Type" value={position.requestType} />

                  {position.requestType === 'BACKFILL' && (
                    <>
                      <DetailRow
                        label="Employee ID"
                        value={renderBackfillValue(
                          position.backfillEmployeeId,
                          position.backfillEmployeeName,
                          'employeeId',
                        )}
                      />
                      <DetailRow
                        label="Employee Name"
                        value={renderBackfillValue(
                          position.backfillEmployeeId,
                          position.backfillEmployeeName,
                          'employeeName',
                        )}
                      />
                    </>
                  )}
                </div>
              ))}
            </div>
          </InfoCard>

          <InfoCard title="Justification" icon={<FileText size={18} />}>
            <Paragraph margin="none" size="small">
              {job.justification || '-'}
            </Paragraph>
          </InfoCard>

          <InfoCard title="Job Description" icon={<FileText size={18} />}>
            <div style={styles.descriptionBlock}>
              {job.description || `Please find the JD for the position: ${job.title || '-'}.`}
            </div>
          </InfoCard>
        </Box>
      )}

      {activeTab === 'INTERVIEWS' && (
        <Box gap="12px">
          <Box gap="2px">
            <Text size="18px" weight={700} color="#1F2937">
              Interview Process
            </Text>
            <Text size="13px" color="#6B7280">
              The hiring process consist of {job.interviewRounds?.length || 0} interview rounds
            </Text>
          </Box>

          {job.interviewRounds?.map((round, index) => (
            <div key={round.id} style={styles.interviewCard}>
              <div style={styles.interviewIntro}>
                <span style={styles.roundNumber}>{index + 1}</span>
                <div>
                  <div style={styles.roundTitle}>{formatRoundName(round.roundName)}</div>
                  <div style={styles.roundMode}>{formatRoundMode(round.mode)}</div>
                </div>
              </div>

              <div style={styles.panelArea}>
                <div style={styles.panelLabel}>Panel Members</div>
                <div style={styles.panelGrid}>
                {round.panels.map((panel) => (
                  <div key={panel.id} style={styles.panelPill}>
                    <span style={styles.panelInitials}>{getInitials(panel.name)}</span>
                    <span>{panel.name}</span>
                  </div>
                ))}
                </div>
              </div>

              <div style={styles.commentsArea}>
                <div style={styles.panelLabel}>Comments</div>
                <div style={styles.commentBox}>-</div>
              </div>
            </div>
          ))}
        </Box>
      )}

      {activeTab === 'CALIBRATION' && (
        <div style={styles.calibrationCard}>
          {!isEditingCalibration && calibrationNotes ? (
            <Box width="100%" gap="medium" align="start">
              <Text size="18px" weight={700} color="#0B1220">
                Calibration Pointers
              </Text>
              <Paragraph margin="none" color="#334155" fill>
                {calibrationNotes}
              </Paragraph>
              {canManageCalibration && (
                <Button
                  label="Edit Calibration Pointers"
                  primary
                  color="#00A982"
                  style={styles.calibrationActionButton}
                  onClick={() => setIsEditingCalibration(true)}
                />
              )}
            </Box>
          ) : !isEditingCalibration ? (
            <Box align="center" gap="small" style={{ maxWidth: 420 }}>
              <Medal size={44} color="#9CA3AF" strokeWidth={1.8} />
              <Heading level={4} margin="none" color="#4B5563">
                No Calibration Information
              </Heading>
              <Paragraph size="small" color="dark-4" textAlign="center" margin="none">
                No calibration sessions have been scheduled or conducted yet for this hiring request.
              </Paragraph>
              {canManageCalibration && (
                <Button
                  label="Add Calibration Pointers"
                  primary
                  color="#00A982"
                  style={styles.calibrationActionButton}
                  onClick={() => setIsEditingCalibration(true)}
                />
              )}
            </Box>
          ) : (
            <Box width="100%" gap="medium">
              <TextArea
                value={calibrationNotes}
                onChange={(event) => setCalibrationNotes(event.currentTarget.value)}
                resize={false}
                rows={6}
              />

              <Box direction="row" justify="center" gap="small">
                <Button
                  label="Save"
                  primary
                  color="#00A982"
                  style={styles.calibrationActionButton}
                  disabled={isSavingCalibration}
                  onClick={() => void handleSaveCalibration()}
                />
                <Button
                  label="Cancel"
                  plain
                  style={{
                    minHeight: 38,
                    padding: '8px 14px',
                    color: '#0B1220',
                    fontSize: 16,
                    fontWeight: 700,
                  }}
                  onClick={() => setIsEditingCalibration(false)}
                />
              </Box>
            </Box>
          )}
        </div>
      )}
    </Box>
  );
};

export default JobDetailsView;

const InfoCard = ({ title, icon, children }: { title: string; icon?: ReactNode; children: ReactNode }) => (
  <section style={styles.infoCard}>
    <h3 style={styles.infoCardTitle}>
      {icon ? <span style={styles.infoIcon}>{icon}</span> : null}
      {title}
    </h3>
    <div style={styles.infoCardBody}>{children}</div>
  </section>
);

const DetailRow = ({ label, value, pill }: { label: string; value: ReactNode; pill?: boolean }) => (
  <div style={styles.detailRow}>
    <span style={styles.detailLabel}>{label}</span>
    {typeof value === 'string' || typeof value === 'number' ? (
      <span style={pill ? styles.pillValue : styles.detailValue}>
        {value || '-'}
      </span>
    ) : (
      value || <Text weight={500}>-</Text>
    )}
  </div>
);

const formatStatus = (status?: string) =>
  (status || '-')
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());

const formatRoundName = (value?: string) => {
  switch (value) {
    case 'SCREENING':
      return 'Screening';
    case 'TECH':
      return 'Technical Evaluation';
    case 'OPS':
      return 'Technical Ops Evaluation';
    default:
      return formatStatus(value);
  }
};

const formatRoundMode = (value?: string) => {
  if (!value) return '-';
  const normalized = value.replace(/_/g, ' ').toLowerCase();
  if (normalized.includes('virtual')) return 'Virtual';
  if (normalized.includes('person')) return 'In-Person';
  return normalized.replace(/\b\w/g, (char) => char.toUpperCase());
};

const getInitials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

const topActionButtonStyle = (disabled: boolean) => ({
  background: disabled ? '#2F2F2F' : '#00A982',
  border: 'none',
  borderRadius: 999,
  color: disabled ? 'rgba(255, 255, 255, 0.45)' : '#FFFFFF',
  cursor: disabled ? 'not-allowed' : 'pointer',
  fontSize: 15,
  fontWeight: 700,
  minHeight: 37,
  padding: '8px 20px',
  opacity: disabled ? 0.88 : 1,
} as const);

const approvalButtonStyle = (variant: 'approve' | 'reject', disabled: boolean) => ({
  background: variant === 'approve' ? '#00A982' : '#FFFFFF',
  border: variant === 'approve' ? 'none' : '1px solid #D7DEE9',
  borderRadius: 999,
  color: variant === 'approve' ? '#FFFFFF' : '#0F172A',
  cursor: disabled ? 'not-allowed' : 'pointer',
  fontSize: 15,
  fontWeight: 700,
  minHeight: 37,
  padding: '8px 20px',
  opacity: disabled ? 0.6 : 1,
  boxShadow: variant === 'approve' ? '0 10px 18px rgba(1, 169, 130, 0.15)' : 'none',
} as const);

const styles = {
  tabRail: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    alignItems: 'center',
    width: '100%',
    gap: 0,
    background: '#E0E7E6',
    borderRadius: 8,
    padding: 5,
    minHeight: 44,
  },
  tabButton: {
    appearance: 'none' as const,
    background: 'transparent',
    border: 'none',
    color: '#1F2937',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    fontSize: 13,
    fontWeight: 700,
    lineHeight: '20px',
    minHeight: 34,
    padding: '6px 18px',
    borderRadius: 7,
    textAlign: 'center' as const,
    whiteSpace: 'nowrap' as const,
  },
  activeTabButton: {
    background: '#FFFFFF',
    boxShadow: '0 1px 5px rgba(15, 23, 42, 0.18)',
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: 20,
    width: '100%',
  },
  infoCard: {
    display: 'block',
    width: '100%',
    background: '#FFFFFF',
    border: '1px solid #DDE3EB',
    borderRadius: 10,
    boxShadow: '0 2px 7px rgba(15, 23, 42, 0.07)',
    overflow: 'hidden',
    boxSizing: 'border-box' as const,
  },
  infoCardTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    margin: 0,
    padding: '18px 22px',
    color: '#0B1220',
    fontSize: 16,
    lineHeight: '24px',
    fontWeight: 700,
    borderBottom: '1px solid #E5E7EB',
  },
  infoIcon: {
    display: 'inline-flex',
    color: '#00A982',
  },
  infoCardBody: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 0,
    width: '100%',
    padding: '18px 12px 20px',
    boxSizing: 'border-box' as const,
  },
  detailRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 24,
    minHeight: 32,
    width: '100%',
    padding: '8px 12px',
    background: '#F8FAFC',
    borderRadius: 0,
    boxSizing: 'border-box' as const,
  },
  detailLabel: {
    color: '#4B5563',
    fontSize: 13,
    lineHeight: '18px',
    fontWeight: 600,
  },
  detailValue: {
    color: '#1F2937',
    fontSize: 13,
    lineHeight: '18px',
    fontWeight: 500,
    textAlign: 'right' as const,
    wordBreak: 'break-word' as const,
  },
  pillValue: {
    color: '#008765',
    background: '#DDFBF2',
    border: '1px solid #A6EBD7',
    borderRadius: 6,
    fontSize: 11,
    lineHeight: '16px',
    fontWeight: 600,
    padding: '2px 8px',
    textAlign: 'right' as const,
  },
  positionStack: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 22,
    width: '100%',
  },
  positionGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 7,
    width: '100%',
  },
  additionalPositionGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 7,
    width: '100%',
    paddingTop: 18,
    borderTop: '1px solid #DDE3EB',
    boxSizing: 'border-box' as const,
  },
  positionTitle: {
    margin: '0 0 4px',
    color: '#0B1220',
    fontSize: 18,
    lineHeight: '24px',
    fontWeight: 700,
  },
  descriptionBlock: {
    color: '#1F2937',
    fontSize: 13,
    lineHeight: '22px',
    whiteSpace: 'pre-wrap' as const,
    padding: '4px 0',
  },
  interviewCard: {
    display: 'grid',
    gridTemplateColumns: '210px minmax(0, 1fr) 300px',
    gap: 24,
    alignItems: 'start',
    width: '100%',
    background: '#FFFFFF',
    border: '1px solid #DDE3EB',
    borderRadius: 12,
    boxShadow: '0 2px 7px rgba(15, 23, 42, 0.07)',
    padding: '26px 24px',
    boxSizing: 'border-box' as const,
  },
  interviewIntro: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 14,
  },
  roundNumber: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
    borderRadius: '50%',
    background: '#00A982',
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 700,
    flexShrink: 0,
  },
  roundTitle: {
    color: '#374151',
    fontSize: 14,
    lineHeight: '18px',
    fontWeight: 700,
    marginBottom: 4,
  },
  roundMode: {
    color: '#6B7280',
    fontSize: 12,
    lineHeight: '16px',
  },
  panelArea: {
    minWidth: 0,
  },
  panelLabel: {
    color: '#6B7280',
    fontSize: 12,
    lineHeight: '16px',
    fontWeight: 700,
    marginBottom: 8,
  },
  panelGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: 8,
  },
  panelPill: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    minHeight: 28,
    background: '#F7F9FB',
    borderRadius: 999,
    padding: '5px 12px',
    color: '#1F2937',
    fontSize: 12,
    lineHeight: '16px',
    overflow: 'hidden',
    whiteSpace: 'nowrap' as const,
    textOverflow: 'ellipsis',
  },
  panelInitials: {
    color: '#00A982',
    fontWeight: 700,
    flexShrink: 0,
  },
  commentsArea: {
    minWidth: 0,
  },
  commentBox: {
    minHeight: 40,
    background: '#F7F9FB',
    borderRadius: 6,
    color: '#6B7280',
    fontSize: 12,
    lineHeight: '18px',
    padding: '10px 12px',
    boxSizing: 'border-box' as const,
  },
  calibrationCard: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    minHeight: 260,
    background: '#FFFFFF',
    border: '1px dashed #C9D2DC',
    borderRadius: 12,
    boxShadow: '0 2px 7px rgba(15, 23, 42, 0.06)',
    padding: 32,
    boxSizing: 'border-box' as const,
  },
  calibrationActionButton: {
    border: 'none',
    borderRadius: '999px',
    background: '#00A982',
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 700,
    minHeight: 38,
    padding: '8px 20px',
  },
};
