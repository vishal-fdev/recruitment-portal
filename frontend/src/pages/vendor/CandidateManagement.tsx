import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Eye,
  Filter,
  ListChecks,
  Plus,
  ReceiptText,
} from 'lucide-react';
import api from '../../api/api';
import ResumeModal from '../../components/ResumeModal';

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

interface Job {
  id: number;
  title: string;
  location: string;
  experience: string;
  status: string;
  numberOfPositions?: number;
  currentNumberOfPositions?: number;
  jdFileName?: string;
  psqFileName?: string;
  jdFiles?: {
    fileName: string;
  }[];
  psqFiles?: {
    fileName: string;
  }[];
  positions?: {
    id: number;
    openings?: number;
    currentOpenings?: number;
  }[];
}

type VendorTab = 'CANDIDATES' | 'HRQ';
type CandidateFilterField =
  | 'candidateCode'
  | 'candidateName'
  | 'candidateContact';

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

const STATUS_STYLES: Record<CandidateStatus, string> = {
  NEW: 'bg-slate-100 text-slate-600',
  SUBMITTED: 'bg-violet-100 text-violet-700',
  SCREENING: 'bg-amber-100 text-amber-700',
  SCREEN_SELECTED: 'bg-amber-100 text-amber-700',
  SCREEN_REJECTED: 'bg-rose-50 text-rose-600',
  TECH_SELECTED: 'bg-teal-100 text-teal-700',
  TECH_REJECTED: 'bg-rose-50 text-rose-600',
  IDENTIFIED: 'bg-emerald-100 text-emerald-700',
  YET_TO_JOIN: 'bg-amber-100 text-amber-700',
  OPS_SELECTED: 'bg-amber-100 text-amber-700',
  OPS_REJECTED: 'bg-rose-50 text-rose-600',
  ONBOARDED: 'bg-emerald-100 text-emerald-700',
  DROPPED: 'bg-slate-100 text-slate-600',
  REJECTED: 'bg-rose-50 text-rose-600',
  SELECTED: 'bg-amber-100 text-amber-700',
};

const VendorCandidateManagement = () => {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<VendorTab>('CANDIDATES');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(true);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [resumeCandidateId, setResumeCandidateId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [candidateFilterField, setCandidateFilterField] =
    useState<CandidateFilterField>('candidateCode');
  const [candidateStatusFilter, setCandidateStatusFilter] = useState('ALL');

  const vendorId = localStorage.getItem('vendorId');

  useEffect(() => {
    void loadCandidates();
    void loadJobs();
  }, []);

  const loadCandidates = async () => {
    try {
      setLoadingCandidates(true);
      const res = await api.get('/candidates');
      const filtered = vendorId
        ? res.data.filter(
            (candidate: Candidate) =>
              String(candidate.vendor?.id) === String(vendorId),
          )
        : res.data;
      setCandidates(filtered);
    } catch (error) {
      console.error('Failed to load candidates', error);
      setCandidates([]);
    } finally {
      setLoadingCandidates(false);
    }
  };

  const loadJobs = async () => {
    try {
      setLoadingJobs(true);
      const res = await api.get('/jobs');
      setJobs((res.data || []).sort((a: Job, b: Job) => b.id - a.id));
    } catch (error) {
      console.error('Failed to load jobs', error);
      setJobs([]);
    } finally {
      setLoadingJobs(false);
    }
  };

  const filteredCandidates = useMemo(() => {
    const query = search.trim().toLowerCase();

    return [...candidates]
      .filter((candidate) => {
        if (candidateStatusFilter !== 'ALL') {
          const normalizedStatus =
            candidate.status === 'SELECTED' ? 'IDENTIFIED' : candidate.status;
          if (normalizedStatus !== candidateStatusFilter) {
            return false;
          }
        }

        if (!query) {
          return true;
        }

        const code = `CA${candidate.id}`.toLowerCase();
        const name = candidate.name.toLowerCase();
        const contact = (candidate.phone || '').toLowerCase();
        const email = (candidate.email || '').toLowerCase();
        const role = (candidate.job?.title || '').toLowerCase();

        switch (candidateFilterField) {
          case 'candidateCode':
            return code.includes(query);
          case 'candidateName':
            return name.includes(query) || email.includes(query);
          case 'candidateContact':
            return contact.includes(query);
          default:
            return (
              code.includes(query) ||
              name.includes(query) ||
              contact.includes(query) ||
              email.includes(query) ||
              role.includes(query)
            );
        }
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime(),
      );
  }, [candidateFilterField, candidateStatusFilter, candidates, search]);

  const filteredJobs = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return jobs;

    return jobs.filter(
      (job) =>
        `HRQ${job.id}`.toLowerCase().includes(query) ||
        job.title?.toLowerCase().includes(query) ||
        job.location?.toLowerCase().includes(query),
    );
  }, [jobs, search]);

  const handleFileDownload = async (
    event: React.MouseEvent,
    jobId: number,
    fileType: 'jd' | 'psq',
    fileName?: string,
    fileIndex?: number,
  ) => {
    event.stopPropagation();

    const downloadPath =
      typeof fileIndex === 'number'
        ? `/jobs/${jobId}/${fileType}/download/${fileIndex}`
        : `/jobs/${jobId}/${fileType}/download`;

    const response = await api.get(downloadPath, {
      responseType: 'blob',
    });

    const blob = new Blob([response.data]);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName || `JOB-${jobId}-${fileType.toUpperCase()}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const getVendorJobStatusLabel = (status: string) => {
    if (status === 'APPROVED' || status === 'PENDING_APPROVAL') {
      return 'OPEN';
    }
    if (status === 'ON_HOLD') {
      return 'HOLD';
    }
    if (status === 'CLOSED') {
      return 'CLOSED';
    }
    return status.replace(/_/g, ' ');
  };

  const getVendorJobStatusClass = (status: string) => {
    const label = getVendorJobStatusLabel(status);
    if (label === 'OPEN') {
      return 'bg-emerald-50 text-emerald-700';
    }
    if (label === 'HOLD') {
      return 'bg-amber-100 text-amber-700';
    }
    if (label === 'CLOSED') {
      return 'bg-slate-100 text-slate-600';
    }
    return 'bg-slate-100 text-slate-600';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[2rem] font-semibold text-slate-800">
          Candidate Management
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage candidates, hiring requests, and review processes
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
        <div className="flex flex-wrap gap-3">
          <TabButton
            active={activeTab === 'CANDIDATES'}
            icon={<ListChecks size={16} />}
            label="Candidates List"
            onClick={() => setActiveTab('CANDIDATES')}
          />
          <TabButton
            active={activeTab === 'HRQ'}
            icon={<ReceiptText size={16} />}
            label="All HRQID"
            onClick={() => setActiveTab('HRQ')}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            {activeTab === 'CANDIDATES' ? (
              <select
                value={candidateFilterField}
                onChange={(event) =>
                  setCandidateFilterField(
                    event.target.value as CandidateFilterField,
                  )
                }
                className="h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none focus:border-emerald-300"
              >
                <option value="candidateCode">Candidate Code</option>
                <option value="candidateName">Candidate Name</option>
                <option value="candidateContact">Candidate Contact</option>
              </select>
            ) : (
              <div className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-slate-700">
                HRQ ID
                <Filter size={15} className="text-emerald-500" />
              </div>
            )}

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search records..."
              className="h-11 w-full rounded-xl border border-gray-200 px-4 text-sm outline-none placeholder:text-slate-400 focus:border-emerald-300 xl:w-[320px]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {activeTab === 'CANDIDATES' ? (
              <select
                value={candidateStatusFilter}
                onChange={(event) => setCandidateStatusFilter(event.target.value)}
                className="h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none focus:border-emerald-300"
              >
                <option value="ALL">All Status</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="SCREEN_SELECTED">Screen Select</option>
                <option value="SCREEN_REJECTED">Screen Reject</option>
                <option value="TECH_SELECTED">Tech Select</option>
                <option value="TECH_REJECTED">Tech Reject</option>
                <option value="IDENTIFIED">Identified</option>
                <option value="YET_TO_JOIN">YTJ</option>
                <option value="OPS_SELECTED">Ops Select</option>
                <option value="OPS_REJECTED">Ops Reject</option>
                <option value="ONBOARDED">Onboarded</option>
                <option value="DROPPED">Drop</option>
              </select>
            ) : null}

            <button
              type="button"
              onClick={() => navigate('/vendor/candidates/create')}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-2 py-2 text-sm font-medium text-emerald-700"
            >
              <Plus size={15} />
              Create
            </button>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto rounded-xl border border-gray-200">
          {activeTab === 'CANDIDATES' ? (
            <table className="min-w-full text-sm">
              <thead className="bg-[#96f7e4] text-slate-700">
                <tr>
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
                </tr>
              </thead>
              <tbody className="bg-white">
                {loadingCandidates && (
                  <tr>
                    <td colSpan={11} className="px-4 py-10 text-center text-slate-400">
                      Loading candidates...
                    </td>
                  </tr>
                )}

                {!loadingCandidates &&
                  filteredCandidates.map((candidate) => (
                    <tr
                      key={candidate.id}
                      className="border-t border-gray-100 text-slate-700 hover:bg-slate-50"
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
                      <BodyCell>{candidate.experience}</BodyCell>
                      <BodyCell>
                        <button
                          type="button"
                          onClick={() => setResumeCandidateId(candidate.id)}
                          className="text-slate-500 hover:text-emerald-600"
                        >
                          <Eye size={17} />
                        </button>
                      </BodyCell>
                      <BodyCell>{candidate.vendor?.name || '-'}</BodyCell>
                      <BodyCell>No</BodyCell>
                      <BodyCell>
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLES[candidate.status]}`}
                        >
                          {STATUS_LABELS[candidate.status]}
                        </span>
                      </BodyCell>
                    </tr>
                  ))}

                {!loadingCandidates && filteredCandidates.length === 0 && (
                  <tr>
                    <td colSpan={11} className="px-4 py-10 text-center text-slate-400">
                      No candidates found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            <table className="min-w-full text-sm">
              <thead className="bg-[#96f7e4] text-slate-700">
                <tr>
                  <HeaderCell>HRQ ID</HeaderCell>
                  <HeaderCell>Role Hired For</HeaderCell>
                  <HeaderCell>Location</HeaderCell>
                  <HeaderCell>Experience</HeaderCell>
                  <HeaderCell>Total Positions</HeaderCell>
                  <HeaderCell>Current Positions</HeaderCell>
                  <HeaderCell>Status</HeaderCell>
                  <HeaderCell>JD</HeaderCell>
                  <HeaderCell>PSQ</HeaderCell>
                  <HeaderCell>Action</HeaderCell>
                </tr>
              </thead>
              <tbody className="bg-white">
                {loadingJobs && (
                  <tr>
                    <td colSpan={10} className="px-4 py-10 text-center text-slate-400">
                      Loading HRQ IDs...
                    </td>
                  </tr>
                )}

                {!loadingJobs &&
                  filteredJobs.map((job) => {
                    const additionalTotal =
                      job.positions?.reduce(
                        (sum, position) => sum + Number(position.openings || 0),
                        0,
                      ) || 0;
                    const additionalCurrent =
                      job.positions?.reduce(
                        (sum, position) =>
                          sum + Number(position.currentOpenings ?? position.openings ?? 0),
                        0,
                      ) || 0;

                    return (
                      <tr
                        key={job.id}
                        className="border-t border-gray-100 text-slate-700 hover:bg-slate-50"
                      >
                        <BodyLinkCell
                          onClick={() => navigate(`/vendor/jobs/${job.id}`)}
                        >
                          {`HRQ${job.id}`}
                        </BodyLinkCell>
                        <BodyCell>{job.title}</BodyCell>
                        <BodyCell>{job.location}</BodyCell>
                        <BodyCell>{job.experience}</BodyCell>
                        <BodyCell>
                          {Number(job.numberOfPositions || 0) + additionalTotal}
                        </BodyCell>
                        <BodyCell>
                          {Number(job.currentNumberOfPositions ?? job.numberOfPositions ?? 0) +
                            additionalCurrent}
                        </BodyCell>
                        <BodyCell>
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getVendorJobStatusClass(
                              job.status,
                            )}`}
                          >
                            {getVendorJobStatusLabel(job.status)}
                          </span>
                        </BodyCell>
                        <BodyCell>
                          {(job.jdFiles?.length || job.jdFileName) ? (
                            <div className="flex flex-col items-center gap-1">
                              {(job.jdFiles?.length ? job.jdFiles : [{ fileName: job.jdFileName! }]).map(
                                (file, index) => (
                                  <button
                                    key={`jd-${job.id}-${file.fileName}-${index}`}
                                    type="button"
                                    onClick={(event) =>
                                      void handleFileDownload(
                                        event,
                                        job.id,
                                        'jd',
                                        file.fileName,
                                        job.jdFiles?.length ? index : undefined,
                                      )
                                    }
                                    className="font-medium text-emerald-600 hover:underline"
                                  >
                                    {job.jdFiles?.length ? `Download JD ${index + 1}` : 'Download JD'}
                                  </button>
                                ),
                              )}
                            </div>
                          ) : (
                            '-'
                          )}
                        </BodyCell>
                        <BodyCell>
                          {(job.psqFiles?.length || job.psqFileName) ? (
                            <div className="flex flex-col items-center gap-1">
                              {(job.psqFiles?.length ? job.psqFiles : [{ fileName: job.psqFileName! }]).map(
                                (file, index) => (
                                  <button
                                    key={`psq-${job.id}-${file.fileName}-${index}`}
                                    type="button"
                                    onClick={(event) =>
                                      void handleFileDownload(
                                        event,
                                        job.id,
                                        'psq',
                                        file.fileName,
                                        job.psqFiles?.length ? index : undefined,
                                      )
                                    }
                                    className="font-medium text-emerald-600 hover:underline"
                                  >
                                    {job.psqFiles?.length ? `Download PSQ ${index + 1}` : 'Download PSQ'}
                                  </button>
                                ),
                              )}
                            </div>
                          ) : (
                            '-'
                          )}
                        </BodyCell>
                        <BodyCell>
                          <button
                            type="button"
                            onClick={() =>
                              navigate(`/vendor/candidates/create?jobId=${job.id}`)
                            }
                            className="rounded-lg bg-emerald-500 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-600"
                          >
                            Create
                          </button>
                        </BodyCell>
                      </tr>
                    );
                  })}

                {!loadingJobs && filteredJobs.length === 0 && (
                  <tr>
                    <td colSpan={10} className="px-4 py-10 text-center text-slate-400">
                      No HRQ IDs found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {resumeCandidateId && (
        <ResumeModal
          candidateId={resumeCandidateId}
          onClose={() => setResumeCandidateId(null)}
        />
      )}
    </div>
  );
};

export default VendorCandidateManagement;

const TabButton = ({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium transition ${
      active
        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
        : 'bg-violet-50 text-violet-600 hover:bg-violet-100'
    }`}
  >
    {icon}
    {label}
  </button>
);

const HeaderCell = ({ children }: { children: ReactNode }) => (
  <th className="px-4 py-4 text-center text-xs font-semibold uppercase tracking-wide">
    {children}
  </th>
);

const BodyCell = ({ children }: { children: ReactNode }) => (
  <td className="px-4 py-4 text-center align-middle">{children}</td>
);

const BodyLinkCell = ({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) => (
  <td className="px-4 py-4 text-center align-middle">
    <button
      type="button"
      onClick={onClick}
      className="font-medium text-emerald-600 hover:underline"
    >
      {children}
    </button>
  </td>
);

const formatDate = (value?: string) => {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('en-GB');
};
