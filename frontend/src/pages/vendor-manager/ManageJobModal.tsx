// src/pages/vendor-manager/ManageJobModal.tsx
import { useEffect, useState } from 'react';
import api from '../../api/api';
import type { VendorAssignmentStatus } from '../../services/jobService';

interface Vendor {
  id: string;
  name?: string;
  email: string;
  isEnabled: boolean;
  status?: VendorAssignmentStatus;
}

interface JobDetails {
  id: number;
  title: string;
  vendors?: Vendor[];
}

type VendorAction = 'assign' | 'hold' | 'reopen' | 'close';

interface Props {
  jobId: number;
  mode: VendorAction;
  onClose: () => void;
  onUpdated: () => void;
}

const ManageJobModal = ({ jobId, mode, onClose, onUpdated }: Props) => {
  const [job, setJob] = useState<JobDetails | null>(null);
  const [savingVendorId, setSavingVendorId] = useState<string | null>(null);

  const updateLocalVendor = (
    vendorId: string,
    updater: (vendor: Vendor) => Vendor,
  ) => {
    setJob((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        vendors: (prev.vendors || []).map((vendor) =>
          vendor.id === vendorId ? updater(vendor) : vendor,
        ),
      };
    });
  };

  const loadJob = async () => {
    try {
      const res = await api.get(`/jobs/${jobId}`);
      setJob(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    loadJob();
  }, [jobId]);

  const toggleVendor = async (
    vendorId: string,
    isEnabled: boolean,
  ) => {
    try {
      setSavingVendorId(vendorId);
      await api.patch(`/jobs/${jobId}/vendors/${vendorId}`, { isEnabled });
      await loadJob();
      onUpdated();
    } finally {
      setSavingVendorId(null);
    }
  };

  const updateVendorStatus = async (
    vendorId: string,
    status: VendorAssignmentStatus,
  ) => {
    try {
      setSavingVendorId(vendorId);
      await api.patch(`/jobs/${jobId}/vendors/${vendorId}/status`, { status });
      await loadJob();
      onUpdated();
    } finally {
      setSavingVendorId(null);
    }
  };

  const getVendorStatus = (vendor: Vendor): VendorAssignmentStatus =>
    vendor.status || 'ACTIVE';

  const getStatusLabel = (status: VendorAssignmentStatus) =>
    status === 'ACTIVE' ? 'APPROVED' : status.replace('_', ' ');

  const getTitle = () => {
    if (!job) return '';

    if (mode === 'assign') return `Assign Job - ${job.title}`;
    if (mode === 'hold') return `Select Vendor To Hold - ${job.title}`;
    if (mode === 'reopen') return `Select Vendor To Reopen - ${job.title}`;
    return `Select Vendor To Close - ${job.title}`;
  };

  const isActionDisabled = (vendor: Vendor) => {
    if (savingVendorId === vendor.id) return true;

    const vendorStatus = getVendorStatus(vendor);

    if (mode === 'assign') return false;
    if (!vendor.isEnabled) return true;
    if (mode === 'hold') return vendorStatus === 'ON_HOLD';
    if (mode === 'reopen') return vendorStatus === 'ACTIVE';
    return vendorStatus === 'CLOSED';
  };

  const getActionLabel = (vendor: Vendor) => {
    if (mode === 'assign') {
      return vendor.isEnabled ? 'Unassign' : 'Assign';
    }

    if (mode === 'hold') return 'Put On Hold';
    if (mode === 'reopen') return 'Reopen';
    return 'Close';
  };

  const vendors = (job.vendors || []).filter((vendor) => {
    const vendorStatus = getVendorStatus(vendor);

    if (mode === 'assign') return true;
    if (!vendor.isEnabled) return false;
    if (mode === 'hold') return vendorStatus === 'ACTIVE';
    if (mode === 'reopen') return vendorStatus === 'ON_HOLD';
    return vendorStatus !== 'CLOSED';
  });

  const handleVendorAction = async (vendor: Vendor) => {
    if (mode === 'assign') {
      await toggleVendor(vendor.id, !vendor.isEnabled);
      updateLocalVendor(vendor.id, (currentVendor) => ({
        ...currentVendor,
        isEnabled: !currentVendor.isEnabled,
        status: !currentVendor.isEnabled ? 'ACTIVE' : currentVendor.status,
      }));
      return;
    }

    if (mode === 'hold') {
      await updateVendorStatus(vendor.id, 'ON_HOLD');
      updateLocalVendor(vendor.id, (currentVendor) => ({
        ...currentVendor,
        status: 'ON_HOLD',
      }));
      return;
    }

    if (mode === 'reopen') {
      await updateVendorStatus(vendor.id, 'ACTIVE');
      updateLocalVendor(vendor.id, (currentVendor) => ({
        ...currentVendor,
        status: 'ACTIVE',
      }));
      return;
    }

    await updateVendorStatus(vendor.id, 'CLOSED');
    updateLocalVendor(vendor.id, (currentVendor) => ({
      ...currentVendor,
      status: 'CLOSED',
    }));
  };

  if (!job) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-[560px] rounded-lg p-6 relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400"
        >
          x
        </button>

        <h2 className="text-lg font-semibold mb-4">{getTitle()}</h2>

        {vendors.length === 0 ? (
          <p className="text-sm text-gray-500">No vendors available for this action</p>
        ) : (
          <div className="space-y-2 max-h-[420px] overflow-y-auto">
            {vendors.map((vendor) => (
              <div
                key={vendor.id}
                className="flex items-center justify-between gap-4 py-3 border-b"
              >
                <div>
                  <div className="text-sm font-medium">
                    {vendor.name || vendor.email}
                  </div>
                    <div className="text-xs text-gray-500">{vendor.email}</div>
                    <div className="text-xs text-gray-600 mt-1">
                      Assigned: {vendor.isEnabled ? 'Yes' : 'No'} | Status:{' '}
                    {getStatusLabel(getVendorStatus(vendor))}
                    </div>
                  </div>

                <button
                  onClick={() => handleVendorAction(vendor)}
                  disabled={isActionDisabled(vendor)}
                  className="px-3 py-1 border rounded text-sm disabled:opacity-50"
                >
                  {getActionLabel(vendor)}
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="text-right mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManageJobModal;
