// src/pages/vendor-manager/ManageJobModal.tsx
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
  vendors: Vendor[];
}

interface Props {
  jobId: number;
  onClose: () => void;
  onUpdated: () => void;
}

const ManageJobModal = ({ jobId, onClose, onUpdated }: Props) => {
  const [job, setJob] = useState<JobDetails | null>(null);

  useEffect(() => {
    api
      .get(`/jobs/${jobId}`)
      .then((res) => setJob(res.data))
      .catch(console.error);
  }, [jobId]);

  if (!job) return null;

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
        v.id === vendorId ? { ...v, isEnabled } : v,
      ),
    });

    onUpdated();
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
          Assign Vendors – {job.title}
        </h2>

        <div>
          <h3 className="font-medium mb-2">
            Vendor Access
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
