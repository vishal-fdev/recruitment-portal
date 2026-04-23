import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  approveJob,
  downloadJDByIndex,
  downloadPSQByIndex,
  getJobDetails,
  rejectJob,
} from '../services/jobService';
import type { Job } from '../services/jobService';

type TabType = 'DETAILS' | 'INTERVIEWS' | 'CALIBRATION';

type JobDetailsViewProps = {
  backRoute: string;
  showApprovalActions: boolean;
};

type BackfillEntry = {
  employeeId?: string;
  employeeName?: string;
};

const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const JobDetailsView = ({
  backRoute,
  showApprovalActions,
}: JobDetailsViewProps) => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('DETAILS');
  const [calibrationNotes, setCalibrationNotes] = useState('');
  const [isEditingCalibration, setIsEditingCalibration] = useState(false);
  const canResubmit = !showApprovalActions && ['PENDING_APPROVAL', 'REJECTED'].includes(job?.status || '');

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

  const handleSaveCalibration = () => {
    setIsEditingCalibration(false);
  };

  if (loading) return <div>Loading...</div>;
  if (!job) return <div>Job not found.</div>;

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
      <div className="space-y-1 text-right">
        {entries.map((entry, index) => (
          <div key={`${field}-${index}`}>
            {field === 'employeeId' ? entry.employeeId || '-' : entry.employeeName || '-'}
          </div>
        ))}
      </div>
    );
  };

  const jdFiles =
    job.jdFiles?.length
      ? job.jdFiles
      : job.jdFileName
        ? [{ fileName: job.jdFileName, path: '', mimeType: '' }]
        : [];
  const psqFiles =
    job.psqFiles?.length
      ? job.psqFiles
      : job.psqFileName
        ? [{ fileName: job.psqFileName, path: '', mimeType: '' }]
        : [];

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate(backRoute)}
        className="px-4 py-2 bg-green-600 text-white rounded-md"
      >
        ← Back
      </button>

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">HRQ{job.id}</h1>
        {canResubmit && (
          <button
            onClick={() => navigate(`/hiring-manager/edit-job/${job.id}`)}
            className="rounded-[12px] bg-[#01A982] px-4 py-2 text-sm font-semibold text-white"
          >
            Resubmit
          </button>
        )}
      </div>

      {showApprovalActions && job.status === 'PENDING_APPROVAL' && (
        <div className="flex gap-4">
          <button
            onClick={() => void handleApprove()}
            disabled={actionLoading}
            className="px-6 py-2 bg-black text-white rounded"
          >
            Approve
          </button>
          <button
            onClick={() => void handleReject()}
            disabled={actionLoading}
            className="px-6 py-2 border rounded"
          >
            Reject
          </button>
        </div>
      )}

      <div className="bg-gray-200 rounded-lg flex overflow-hidden text-sm font-medium">
        <TabButton
          label="Details"
          active={activeTab === 'DETAILS'}
          onClick={() => setActiveTab('DETAILS')}
        />
        <TabButton
          label="Interview Rounds"
          active={activeTab === 'INTERVIEWS'}
          onClick={() => setActiveTab('INTERVIEWS')}
        />
        <TabButton
          label="Calibration"
          active={activeTab === 'CALIBRATION'}
          onClick={() => setActiveTab('CALIBRATION')}
        />
      </div>

      {activeTab === 'DETAILS' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card title="Hiring Information">
              <Row label="HRQ ID" value={`HRQ${job.id}`} />
              <Row label="Role" value={job.title} />
              <Row label="Hiring Manager" value={hiringManagerName} />
              <Row label="Business" value={job.department} />
              <Row label="Created Date" value={job.createdAt?.split('T')[0]} />
            </Card>

            <Card title="Job Information">
              <Row label="Location" value={job.location} />
              <Row label="Employment Type" value={job.employmentType} />
              <Row label="Work Type" value={job.workType} />
              <Row label="Category" value={job.jobCategory} />
              <Row label="Region" value={job.region} />
              <Row label="Deal" value={job.dealName} />
              <Row label="Start Date" value={job.startDate} />
              <Row label="End Date" value={job.endDate} />
              <Row label="Primary Skills" value={formatSkills(job.primarySkills)} />
              <Row
                label="Secondary Skills"
                value={formatSkills(job.secondarySkills)}
              />
            </Card>
          </div>

          <Card title="Position Details">
            <div className="mb-4">
              <h3 className="font-semibold mb-2">Main Position</h3>

              <Row label="Request Type" value={job.requestType} />
              <Row label="No. Positions" value={job.numberOfPositions} />
              <Row label="Level" value={job.level} />

              {job.requestType === 'BACKFILL' && (
                <>
                  <Row
                    label="Employee ID"
                    value={renderBackfillValue(
                      job.backfillEmployeeId,
                      job.backfillEmployeeName,
                      'employeeId',
                    )}
                  />
                  <Row
                    label="Employee Name"
                    value={renderBackfillValue(
                      job.backfillEmployeeId,
                      job.backfillEmployeeName,
                      'employeeName',
                    )}
                  />
                </>
              )}

              <div className="flex gap-3 mt-3">
                <FileButtons
                  files={jdFiles}
                  getLink={(index) => downloadJDByIndex(job.id, index)}
                  emptyLabel="No JD"
                  labelPrefix="JD"
                />
                <FileButtons
                  files={psqFiles}
                  getLink={(index) => downloadPSQByIndex(job.id, index)}
                  emptyLabel="No PSQ"
                  labelPrefix="PSQ"
                />
              </div>
            </div>

            {job.positions?.map((position, index) => (
              <div key={position.id} className="mb-4 border-t pt-4">
                <h4 className="font-medium mb-2">
                  Additional Position {index + 1}
                </h4>

                <Row label="Level" value={position.level} />
                <Row label="Openings" value={position.openings} />
                <Row label="Request Type" value={position.requestType} />

                {position.requestType === 'BACKFILL' && (
                  <>
                    <Row
                      label="Employee ID"
                      value={renderBackfillValue(
                        position.backfillEmployeeId,
                        position.backfillEmployeeName,
                        'employeeId',
                      )}
                    />
                    <Row
                      label="Employee Name"
                      value={renderBackfillValue(
                        position.backfillEmployeeId,
                        position.backfillEmployeeName,
                        'employeeName',
                      )}
                    />
                  </>
                )}

                <div className="flex gap-3 mt-3">
                  <Btn
                    link={`${apiBaseUrl}/jobs/positions/${position.id}/jd/download`}
                    label="Download JD"
                  />
                  <Btn
                    link={`${apiBaseUrl}/jobs/positions/${position.id}/psq/download`}
                    label="Download PSQ"
                  />
                </div>
              </div>
            ))}
          </Card>

          <Card title="Justification">
            <p className="text-sm">{job.justification}</p>
          </Card>
        </div>
      )}

      {activeTab === 'INTERVIEWS' && (
        <div className="space-y-4">
          {job.interviewRounds?.map((round, index) => (
            <div key={round.id} className="bg-white rounded-xl shadow border p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-sm font-semibold">
                  {index + 1}
                </div>

                <div>
                  <div className="font-medium">{round.roundName}</div>
                  <div className="text-xs text-gray-500">{round.mode}</div>
                </div>
              </div>

              <div className="text-sm text-gray-600 mb-2">Panel Members</div>

              <div className="flex flex-wrap gap-2">
                {round.panels.map((panel) => (
                  <span
                    key={panel.id}
                    className="px-3 py-1 bg-gray-200 rounded-full text-xs"
                  >
                    {panel.name} ({panel.email})
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'CALIBRATION' && (
        <div className="bg-white rounded-xl shadow border p-8 text-center">
          {!isEditingCalibration ? (
            <>
              <h2 className="text-lg font-medium mb-2">
                No Calibration Information
              </h2>

              <p className="text-sm text-gray-500 mb-4">
                No calibration sessions have been scheduled yet.
              </p>

              <button
                onClick={() => setIsEditingCalibration(true)}
                className="px-5 py-2 bg-black text-white rounded"
              >
                Add Calibration Pointers
              </button>
            </>
          ) : (
            <>
              <textarea
                value={calibrationNotes}
                onChange={(e) => setCalibrationNotes(e.target.value)}
                className="w-full border rounded p-3 mb-4"
              />

              <div className="flex justify-center gap-3">
                <button
                  onClick={handleSaveCalibration}
                  className="px-5 py-2 bg-black text-white rounded"
                >
                  Save
                </button>
                <button
                  onClick={() => setIsEditingCalibration(false)}
                  className="px-5 py-2 border rounded"
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default JobDetailsView;

const Card = ({ title, children }: { title: string; children: ReactNode }) => (
  <div className="bg-white rounded-xl shadow border border-gray-200">
    <div className="px-6 py-4 border-b font-medium">{title}</div>
    <div className="p-4">{children}</div>
  </div>
);

const Row = ({ label, value }: { label: string; value: ReactNode }) => (
  <div className="flex justify-between px-4 py-2 odd:bg-gray-200 even:bg-white rounded">
    <span className="text-gray-700">{label}</span>
    <span className="font-medium">{value || '-'}</span>
  </div>
);

const Btn = ({ link, label }: { link: string; label: string }) => (
  <a
    href={link}
    target="_blank"
    rel="noreferrer"
    className="px-3 py-1 bg-gray-800 text-white rounded text-sm hover:bg-black"
  >
    {label}
  </a>
);

const FileButtons = ({
  files,
  getLink,
  emptyLabel,
  labelPrefix,
}: {
  files: { fileName: string }[];
  getLink: (index: number) => string;
  emptyLabel: string;
  labelPrefix: string;
}) => {
  if (!files.length) {
    return <span className="text-sm text-gray-500">{emptyLabel}</span>;
  }

  return (
    <div className="flex flex-wrap gap-3">
      {files.map((file, index) => (
        <Btn
          key={`${labelPrefix}-${file.fileName}-${index}`}
          link={getLink(index)}
          label={
            files.length > 1
              ? `Download ${labelPrefix} ${index + 1}`
              : `Download ${labelPrefix}`
          }
        />
      ))}
    </div>
  );
};

const TabButton = ({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`flex-1 py-3 ${active ? 'bg-white font-semibold' : 'text-gray-600'}`}
  >
    {label}
  </button>
);
