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
      const data = await getJobs();
      setJobs(data.filter((j: any) => j.status === 'APPROVED'));
    } finally {
      setLoading(false);
    }
  };

  /* ================= FETCH VENDORS ================= */

  const fetchVendors = async () => {
    try {
      const res = await api.get('/vendors');
      const vendorData = res.data?.data || res.data || [];
      setVendors(vendorData);
    } catch (error) {
      console.error('Failed to fetch vendors', error);
    }
  };

  useEffect(() => {
    fetchJobs();
    fetchVendors();
  }, []);

  /* ================= CLOSE DROPDOWN ================= */

  useEffect(() => {
    const closeMenu = () => setOpenMenu(null);
    document.addEventListener('click', closeMenu);
    return () => document.removeEventListener('click', closeMenu);
  }, []);

  /* ================= JD DOWNLOAD ================= */

  const handleDownload = async (jobId: number, fileName?: string) => {
    const response = await api.get(`/jobs/${jobId}/jd/download`, {
      responseType: 'blob',
    });

    const blob = new Blob([response.data]);
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = fileName || `JOB-${jobId}.pdf`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    window.URL.revokeObjectURL(url);
  };

  /* ================= OPEN ASSIGN MODAL ================= */

  const openAssignModal = async (jobId: number) => {
    try {
      const res = await api.get(`/jobs/${jobId}`);
      const job = res.data;

      const assigned =
        job.vendors?.filter((v: any) => v.isEnabled).map((v: any) => v.id) ||
        [];

      setSelectedJob(jobId);
      setOriginalAssigned(assigned);
      setSelectedVendors(assigned);
      setShowModal(true);
      setOpenMenu(null);
    } catch (err) {
      console.error('Failed loading job vendors', err);
    }
  };

  /* ================= TOGGLE VENDOR ================= */

  const toggleVendor = (vendorId: number) => {
    if (selectedVendors.includes(vendorId)) {
      setSelectedVendors(selectedVendors.filter((v) => v !== vendorId));
    } else {
      setSelectedVendors([...selectedVendors, vendorId]);
    }
  };

  /* ================= ASSIGN + DEASSIGN ================= */

  const assignVendors = async () => {
    if (!selectedJob) return;

    try {
      const toAssign = selectedVendors.filter(
        (v) => !originalAssigned.includes(v),
      );

      const toRemove = originalAssigned.filter(
        (v) => !selectedVendors.includes(v),
      );

      for (const vendorId of toAssign) {
        await api.patch(`/jobs/${selectedJob}/vendors/${vendorId}`, {
          isEnabled: true,
        });
      }

      for (const vendorId of toRemove) {
        await api.patch(`/jobs/${selectedJob}/vendors/${vendorId}`, {
          isEnabled: false,
        });
      }

      setShowModal(false);
    } catch (err) {
      console.error('Assign vendor failed', err);
    }
  };

  return (
    <div className="space-y-6">

      {/* HEADER */}

      <div className="bg-gray-50 border border-gray-200 rounded-lg px-6 py-4">
        <h1 className="text-xl font-semibold text-gray-800">
          Job Requisitions
        </h1>
      </div>

      {/* TABLE */}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

        <table className="w-full text-sm">

          <thead className="bg-gray-100 border-b text-gray-700">
            <tr>
              <th className="px-6 py-3 text-center">HRQID</th>
              <th className="px-6 py-3 text-center">Role</th>
              <th className="px-6 py-3 text-center">Location</th>
              <th className="px-6 py-3 text-center">Experience</th>
              <th className="px-6 py-3 text-center">Status</th>
              <th className="px-6 py-3 text-center">JD</th>
              <th className="px-6 py-3 text-center">Action</th>
            </tr>
          </thead>

          <tbody>

            {loading && (
              <tr>
                <td colSpan={7} className="py-10 text-center">
                  Loading jobs...
                </td>
              </tr>
            )}

            {!loading &&
              jobs.map((job) => (

                <tr
                  key={job.id}
                  className="border-t hover:bg-gray-50 cursor-pointer"
                  onClick={(e) => {
                    if ((e.target as HTMLElement).closest('button')) return;
                    navigate(`/vendor-manager/jobs/${job.id}`);
                  }}
                >

                  <td className="px-6 py-4 text-center font-semibold text-red-600">
                    HRQ{job.id}
                  </td>

                  <td className="px-6 py-4 text-center">
                    {job.title}
                  </td>

                  <td className="px-6 py-4 text-center">
                    {job.location}
                  </td>

                  <td className="px-6 py-4 text-center">
                    {job.experience}
                  </td>

                  <td className="px-6 py-4 text-center">
                    <span className="px-3 py-1 text-xs rounded-full bg-green-100 text-green-700">
                      Approved
                    </span>
                  </td>

                  <td className="px-6 py-4 text-center">
                    {job.jdFileName ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(job.id, job.jdFileName);
                        }}
                        className="text-blue-600 hover:underline"
                      >
                        Download JD
                      </button>
                    ) : (
                      '—'
                    )}
                  </td>

                  <td
                    className="px-6 py-4 text-center relative"
                    onClick={(e) => e.stopPropagation()}
                  >

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenu(openMenu === job.id ? null : job.id);
                      }}
                      className="border border-gray-300 rounded px-2 py-1 hover:bg-gray-100"
                    >
                      <ChevronDown size={16} />
                    </button>

                    {openMenu === job.id && (

                      <div
                        className="absolute right-6 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-md z-20"
                        onClick={(e) => e.stopPropagation()}
                      >

                        <button
                          onClick={() => openAssignModal(job.id)}
                          className="block w-full text-center px-4 py-2 text-sm hover:bg-gray-100"
                        >
                          Assign
                        </button>

                      </div>

                    )}

                  </td>

                </tr>

              ))}

          </tbody>

        </table>

      </div>

      {/* ================= MODAL ================= */}

      {showModal && (

        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={() => setShowModal(false)}
        >

          <div
            className="bg-white rounded-lg shadow-lg w-[420px] p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >

            <h2 className="text-lg font-semibold">
              Assign Vendors
            </h2>

            <div className="max-h-60 overflow-y-auto space-y-2">

              {vendors.map((vendor) => (

                <label
                  key={vendor.id}
                  className="flex items-center gap-2 text-sm"
                >

                  <input
                    type="checkbox"
                    checked={selectedVendors.includes(vendor.id)}
                    onChange={() => toggleVendor(vendor.id)}
                  />

                  {vendor.name}

                </label>

              ))}

            </div>

            <div className="flex justify-end gap-3 pt-4">

              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border rounded text-sm"
              >
                Cancel
              </button>

              <button
                onClick={assignVendors}
                className="px-4 py-2 bg-emerald-600 text-white rounded text-sm"
              >
                Save Changes
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
};

export default Jobs;