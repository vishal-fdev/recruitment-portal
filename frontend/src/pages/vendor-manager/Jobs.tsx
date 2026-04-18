// src/pages/vendor-manager/Jobs.tsx

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { getJobs } from '../../services/jobService';
import type { Job } from '../../services/jobService';
import api from '../../api/api';

interface Vendor {
  id: number;
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

  const [selectedVendors, setSelectedVendors] = useState<number[]>([]);
  const [originalAssigned, setOriginalAssigned] = useState<number[]>([]);

  /* ================= FETCH JOBS ================= */

  const fetchJobs = async () => {
  try {
    const data = await getJobs(); // ✅ THIS WAS MISSING

    setJobs(
      data.filter(
        (job: Job) =>
          job.status === 'APPROVED' ||
          job.status === 'ON_HOLD' ||
          job.status === 'CLOSED'
      )
    );
  } catch (err) {
    console.error('Failed to fetch jobs', err);
  } finally {
    setLoading(false);
  }
};
  /* ================= FETCH VENDORS ================= */

  const fetchVendors = async () => {
    const res = await api.get('/vendors');
    setVendors(res.data?.data || res.data || []);
  };

  useEffect(() => {
    fetchJobs();
    fetchVendors();
  }, []);

  /* ================= ACTION APIs ================= */

  const updateJobStatus = async (jobId: number, action: string) => {
    try {
      await api.patch(`/jobs/${jobId}/${action}`);
      fetchJobs();
    } catch (err) {
      console.error(`${action} failed`, err);
      alert(`Failed to ${action} job`);
    }
  };

  /* ================= JD DOWNLOAD ================= */

  const handleDownload = async (jobId: number, fileName?: string) => {
    const res = await api.get(`/jobs/${jobId}/jd/download`, {
      responseType: 'blob',
    });

    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName || `JOB-${jobId}.pdf`;
    link.click();
  };

  /* ================= ASSIGN ================= */

  const openAssignModal = async (jobId: number) => {
    const res = await api.get(`/jobs/${jobId}`);
    const job = res.data;

    const assigned =
      job.vendors?.filter((v: any) => v.isEnabled).map((v: any) => v.id) || [];

    setSelectedJob(jobId);
    setOriginalAssigned(assigned);
    setSelectedVendors(assigned);
    setShowModal(true);
    setOpenMenu(null);
  };

  const toggleVendor = (id: number) => {
    setSelectedVendors((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id],
    );
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

    setShowModal(false);
  };

  /* ================= STATUS BADGE ================= */

  const StatusBadge = ({ status }: { status: string }) => {
    const map: any = {
      APPROVED: 'bg-green-100 text-green-700',
      ON_HOLD: 'bg-yellow-100 text-yellow-700',
      CLOSED: 'bg-gray-200 text-gray-600',
    };

    return (
      <span className={`px-3 py-1 text-xs rounded-full ${map[status]}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  return (
    <div className="space-y-6">

      <div className="bg-gray-50 border rounded px-6 py-4">
        <h1 className="text-xl font-semibold">Job Requisitions</h1>
      </div>

      <div className="bg-white rounded-xl shadow border overflow-visible">

        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr className="text-sm font-medium text-gray-600">
  <th className="py-3 text-center">HRQ ID</th>
  <th className="text-center">Role</th>
  <th className="text-center">Level</th>
  <th className="text-center">Location</th>
  <th className="text-center">Assigned Date</th>
  <th className="text-center">Status</th>
  <th className="text-center">JD</th>
  <th className="text-center">Action</th>
</tr>
          </thead>

          <tbody>

            {jobs.map((job) => (

              <tr
  key={job.id}
  className="border-t text-sm hover:bg-gray-50 cursor-pointer"
  onClick={() => navigate(`/vendor-manager/jobs/${job.id}`)}
>

  {/* HRQ */}
  <td className="text-center text-green-600 font-medium">HRQ{job.id}</td>

  {/* ROLE */}
  <td className="py-3 text-center text-gray-700">{job.title}</td>

  {/* LEVEL */}
  <td className="py-3 text-center text-gray-700">{job.level || '-'}</td>

  {/* LOCATION */}
  <td className="py-3 text-center text-gray-700">{job.location}</td>

  {/* ASSIGNED DATE (FIXED FORMAT) */}
  <td className="text-center">
    {job.createdAt
      ? new Date(job.createdAt).toLocaleDateString('en-GB')
      : '-'}
  </td>

  {/* STATUS */}
  <td className="text-center">
    <StatusBadge status={job.status} />
  </td>

  {/* JD COLUMN */}
  <td className="text-center">
    {job.jdFileName ? (
      <button
        onClick={() => handleDownload(job.id)}
        className="text-blue-600 hover:underline"
      >
        Download JD
      </button>
    ) : (
      '—'
    )}
  </td>

  {/* ACTION */}
  <td className="text-center relative">

    <button
      onClick={(e) => {
  e.stopPropagation();
  setOpenMenu(openMenu === job.id ? null : job.id);
}}
      className="border px-2 py-1 rounded-md bg-white hover:bg-gray-50"
    >
      <ChevronDown size={14} />
    </button>

    {openMenu === job.id && (
      <div className="absolute right-0 mt-2 bg-white border rounded-md shadow-lg w-40 z-50">

        {job.status === 'APPROVED' && (
          <button
            onClick={(e) => {
  e.stopPropagation();
  openAssignModal(job.id);
}}
            className="block w-full py-2 hover:bg-gray-100"
          >
            Assign
          </button>
        )}

        {job.status === 'APPROVED' && (
          <button
            onClick={() => updateJobStatus(job.id, 'hold')}
            className="block w-full py-2 hover:bg-gray-100"
          >
            Put on Hold
          </button>
        )}

        {job.status === 'ON_HOLD' && (
          <button
            onClick={() => updateJobStatus(job.id, 'reopen')}
            className="block w-full py-2 hover:bg-gray-100"
          >
            Reopen
          </button>
        )}

        {job.status !== 'CLOSED' && (
          <button
            onClick={() => updateJobStatus(job.id, 'close')}
            className="block w-full py-2 text-red-600 hover:bg-gray-100"
          >
            Close
          </button>
        )}

      </div>
    )}

  </td>

</tr>

            ))}

          </tbody>
        </table>
      </div>

      {/* ================= ASSIGN MODAL ================= */}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center">

          <div className="bg-white p-6 rounded w-[400px]">

            <h2 className="font-semibold mb-3">Assign Vendors</h2>

            {vendors.map((v) => (
              <label key={v.id} className="block">
                <input
                  type="checkbox"
                  checked={selectedVendors.includes(v.id)}
                  onChange={() => toggleVendor(v.id)}
                />
                {v.name}
              </label>
            ))}

            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowModal(false)}>Cancel</button>
              <button onClick={assignVendors} className="bg-green-600 text-white px-3 py-1 rounded">
                Save
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default Jobs;