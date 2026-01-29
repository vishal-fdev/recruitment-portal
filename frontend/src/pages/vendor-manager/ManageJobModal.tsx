import { useEffect, useState } from 'react';
import api from '../../api/api';

interface Vendor {
  id: string;
  email: string;
  isEnabled: boolean;
}

interface JobDetails {
  id: number;
  title: string;
  isActive: boolean;
  vendors: Vendor[];
}

interface Props {
  jobId: number;
  onClose: () => void;
  onUpdated: () => void;
}

const ManageJobModal = ({ jobId, onClose, onUpdated }: Props) => {
  const [job, setJob] = useState<JobDetails | null>(null);

  // 🔹 Fetch job + vendors
  useEffect(() => {
    api
      .get(`/jobs/${jobId}`)
      .then((res) => setJob(res.data))
      .catch(console.error);
  }, [jobId]);

  if (!job) return null;

  // 🔹 Toggle job open / close
  const toggleJobStatus = async () => {
    await api.patch(`/jobs/${job.id}/status`, {
      isActive: !job.isActive,
    });

    setJob({ ...job, isActive: !job.isActive });
    onUpdated();
  };

  // 🔹 Toggle vendor enable / disable
  const toggleVendor = async (
    vendorId: string,
    isEnabled: boolean,
  ) => {
    await api.patch(
      `/jobs/${job.id}/vendors/${vendorId}`,
      { isEnabled },
    );

    setJob({
      ...job,
      vendors: job.vendors.map((v) =>
        v.id === vendorId
          ? { ...v, isEnabled }
          : v,
      ),
    });
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-[520px] rounded-lg p-6 relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400"
        >
          ✕
        </button>

        <h2 className="text-lg font-semibold mb-4">
          Manage Job – {job.title}
        </h2>

        {/* Job status */}
        <div className="flex items-center justify-between mb-6">
          <span className="font-medium">Job Status</span>
          <button
            onClick={toggleJobStatus}
            className={`px-3 py-1 text-sm rounded ${
              job.isActive
                ? 'bg-red-100 text-red-700'
                : 'bg-green-100 text-green-700'
            }`}
          >
            {job.isActive ? 'Close Job' : 'Open Job'}
          </button>
        </div>

        {/* Vendors */}
        <div>
          <h3 className="font-medium mb-2">
            Assigned Vendors
          </h3>

          {job.vendors.length === 0 && (
            <p className="text-sm text-gray-500">
              No vendors assigned
            </p>
          )}

          {job.vendors.map((v) => (
            <div
              key={v.id}
              className="flex items-center justify-between py-2 border-b"
            >
              <span className="text-sm">{v.email}</span>

              <input
                type="checkbox"
                checked={v.isEnabled}
                onChange={(e) =>
                  toggleVendor(v.id, e.target.checked)
                }
              />
            </div>
          ))}
        </div>

        <div className="text-right mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManageJobModal;
