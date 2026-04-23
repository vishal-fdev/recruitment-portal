import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { getJobs } from '../../services/jobService';
import type { Job } from '../../services/jobService';
import api from '../../api/api';

interface Vendor {
  id: string;
  name: string;
}

const Jobs = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [openMenu, setOpenMenu] = useState<number | null>(null);
  const [selectedJob, setSelectedJob] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
  const [originalAssigned, setOriginalAssigned] = useState<string[]>([]);

  const fetchJobs = async () => {
    try {
      const data = await getJobs();
      setJobs(data || []);
    } catch (err) {
      console.error('Failed to fetch jobs', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchVendors = async () => {
    const res = await api.get('/vendors');
    setVendors(res.data?.data || res.data || []);
  };

  useEffect(() => {
    void fetchJobs();
    void fetchVendors();
  }, []);

  const updateJobStatus = async (jobId: number, action: string) => {
    try {
      await api.patch(`/jobs/${jobId}/${action}`);
      await fetchJobs();
    } catch (err) {
      console.error(`${action} failed`, err);
      alert(`Failed to ${action} job`);
    }
  };

  const handleDownload = async (jobId: number, fileName?: string) => {
    const res = await api.get(`/jobs/${jobId}/jd/download`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName || `JOB-${jobId}.pdf`;
    link.click();
  };

  const openAssignModal = async (jobId: number) => {
    const res = await api.get(`/jobs/${jobId}`);
    const job = res.data;
    const assigned = job.vendors?.filter((v: any) => v.isEnabled).map((v: any) => v.id) || [];
    setSelectedJob(jobId);
    setOriginalAssigned(assigned);
    setSelectedVendors(assigned);
    setShowModal(true);
    setOpenMenu(null);
  };

  const toggleVendor = (id: string) => {
    setSelectedVendors((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));
  };

  const assignVendors = async () => {
    if (!selectedJob) return;
    const toAssign = selectedVendors.filter((v) => !originalAssigned.includes(v));
    const toRemove = originalAssigned.filter((v) => !selectedVendors.includes(v));

    for (const v of toAssign) {
      await api.patch(`/jobs/${selectedJob}/vendors/${v}`, { isEnabled: true });
    }
    for (const v of toRemove) {
      await api.patch(`/jobs/${selectedJob}/vendors/${v}`, { isEnabled: false });
    }

    await fetchJobs();
    setShowModal(false);
    setSelectedJob(null);
    setOriginalAssigned([]);
    setSelectedVendors([]);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-[20px] bg-white px-6 py-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
        <h1 className="text-2xl font-semibold text-[#0F172A]">Jobs</h1>
        <p className="mt-1 text-sm text-[#64748B]">Manage requisitions, assignments, and job status.</p>
      </div>

      <div className="space-y-4">
        {loading && <div className="rounded-[20px] bg-white p-8 shadow">Loading...</div>}

        {!loading &&
          jobs.map((job) => {
            const totalPositions =
              Number(job.numberOfPositions || 0) +
              (job.positions?.reduce((sum, position) => sum + Number(position.openings || 0), 0) || 0);
            const currentPositions =
              Number(job.currentNumberOfPositions ?? job.numberOfPositions ?? 0) +
              (job.positions?.reduce(
                (sum, position) => sum + Number(position.currentOpenings ?? position.openings ?? 0),
                0,
              ) || 0);

            return (
              <div
                key={job.id}
                onClick={() => navigate(`/vendor-manager/jobs/${job.id}`)}
                className="rounded-[24px] border border-black/8 bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(15,23,42,0.08)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-medium text-[#01A982]">{`HRQ${job.id}`}</span>
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getStatusClass(job.status)}`}>
                        {formatStatus(job.status)}
                      </span>
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-[#0F172A]">{job.title}</h2>
                      <p className="mt-1 text-sm text-[#64748B]">{job.location} · Level {job.level || '-'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2" onClick={(event) => event.stopPropagation()}>
                    {job.status === 'APPROVED' && (
                      <button
                        type="button"
                        onClick={() => void openAssignModal(job.id)}
                        className="rounded-[12px] bg-[#01A982] px-4 py-2 text-sm font-medium text-white shadow-[0_10px_25px_rgba(1,169,130,0.2)]"
                      >
                        Assign Vendors
                      </button>
                    )}

                    <div className="relative">
                      <button
                        onClick={() => setOpenMenu(openMenu === job.id ? null : job.id)}
                        className="rounded-[12px] border border-[#D6DCE5] bg-white px-3 py-2"
                      >
                        <ChevronDown size={14} />
                      </button>

                      {openMenu === job.id && (
                        <div className="absolute right-0 mt-2 w-44 rounded-[14px] border border-black/8 bg-white p-2 shadow-lg z-50">
                          {job.status === 'APPROVED' && (
                            <MenuButton onClick={() => void openAssignModal(job.id)}>Assign</MenuButton>
                          )}
                          {job.status === 'APPROVED' && (
                            <MenuButton onClick={() => void updateJobStatus(job.id, 'hold')}>Put on Hold</MenuButton>
                          )}
                          {job.status === 'ON_HOLD' && (
                            <MenuButton onClick={() => void updateJobStatus(job.id, 'reopen')}>Reopen</MenuButton>
                          )}
                          {job.status !== 'CLOSED' && (
                            <MenuButton danger onClick={() => void updateJobStatus(job.id, 'close')}>Close</MenuButton>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-5">
                  <Info label="Total Positions" value={String(totalPositions)} />
                  <Info label="Current Positions" value={String(currentPositions)} />
                  <Info label="Assigned Date" value={job.createdAt ? new Date(job.createdAt).toLocaleDateString('en-GB') : '-'} />
                  <Info label="Status" value={formatStatus(job.status)} />
                  <div className="rounded-[16px] bg-[#F8FAFC] px-4 py-3">
                    <div className="text-xs font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">JD</div>
                    <div className="mt-1 text-sm font-medium">
                      {job.jdFileName ? (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            void handleDownload(job.id);
                          }}
                          className="text-[#01A982]"
                        >
                          Download JD
                        </button>
                      ) : (
                        '—'
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
      </div>

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40">
          <div className="w-[400px] rounded-[20px] bg-white p-6 shadow-lg">
            <h2 className="mb-3 font-semibold">Assign Vendors</h2>
            {vendors.map((v) => (
              <label key={v.id} className="block py-1">
                <input type="checkbox" checked={selectedVendors.includes(v.id)} onChange={() => toggleVendor(v.id)} /> {v.name}
              </label>
            ))}
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setShowModal(false)}>Cancel</button>
              <button onClick={() => void assignVendors()} className="rounded bg-green-600 px-3 py-1 text-white">
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const MenuButton = ({ children, onClick, danger }: { children: React.ReactNode; onClick: () => void; danger?: boolean }) => (
  <button
    type="button"
    onClick={onClick}
    className={`block w-full rounded-[10px] px-3 py-2 text-left text-sm hover:bg-[#F8FAFC] ${danger ? 'text-red-600' : 'text-[#0F172A]'}`}
  >
    {children}
  </button>
);

const Info = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-[16px] bg-[#F8FAFC] px-4 py-3">
    <div className="text-xs font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">{label}</div>
    <div className="mt-1 text-sm font-medium text-[#0F172A]">{value}</div>
  </div>
);

const formatStatus = (status: string) =>
  status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());

const getStatusClass = (status: string) => {
  const map: Record<string, string> = {
    APPROVED: 'bg-green-100 text-green-700',
    ON_HOLD: 'bg-yellow-100 text-yellow-700',
    CLOSED: 'bg-gray-200 text-gray-600',
  };
  return map[status] || 'bg-slate-100 text-slate-700';
};

export default Jobs;
