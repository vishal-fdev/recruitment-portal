// src/pages/vendor-manager/Jobs.tsx

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { downloadPSQ, getJobs } from '../../services/jobService';
import type {
  Job,
  JobVendorAssignment,
  VendorAssignmentStatus,
} from '../../services/jobService';
import api from '../../api/api';

type VendorAction = 'assign' | 'hold' | 'reopen' | 'close';

interface ActionModalState {
  action: VendorAction;
  jobId: number;
  title: string;
  vendors: JobVendorAssignment[];
}

interface ActionMenuState {
  jobId: number;
  vendors: JobVendorAssignment[];
}

const getVendorStatusValue = (
  vendor: JobVendorAssignment,
): VendorAssignmentStatus => vendor.status || 'ACTIVE';

const getSummaryFromVendors = (
  vendors: JobVendorAssignment[] = [],
): 'APPROVED' | 'ON_HOLD' | 'CLOSED' => {
  const assigned = vendors.filter((vendor) => vendor.isEnabled);

  if (!assigned.length) return 'APPROVED';
  if (assigned.every((vendor) => getVendorStatusValue(vendor) === 'CLOSED')) {
    return 'CLOSED';
  }
  if (assigned.some((vendor) => getVendorStatusValue(vendor) === 'ON_HOLD')) {
    return 'ON_HOLD';
  }

  return 'APPROVED';
};

const getFlagsFromVendors = (vendors: JobVendorAssignment[] = []) => ({
  hasAssignedVendor: vendors.some((vendor) => vendor.isEnabled),
  hasActiveVendor: vendors.some(
    (vendor) => vendor.isEnabled && getVendorStatusValue(vendor) === 'ACTIVE',
  ),
  hasOnHoldVendor: vendors.some(
    (vendor) => vendor.isEnabled && getVendorStatusValue(vendor) === 'ON_HOLD',
  ),
  hasClosableVendor: vendors.some(
    (vendor) => vendor.isEnabled && getVendorStatusValue(vendor) !== 'CLOSED',
  ),
});

const getVendorsForAction = (
  action: VendorAction,
  vendors: JobVendorAssignment[],
) =>
  vendors.filter((vendor) => {
    const vendorStatus = getVendorStatusValue(vendor);

    if (action === 'assign') return true;
    if (!vendor.isEnabled) return false;
    if (action === 'hold') return vendorStatus === 'ACTIVE';
    if (action === 'reopen') return vendorStatus === 'ON_HOLD';
    return vendorStatus !== 'CLOSED';
  });

const Jobs = () => {
  const navigate = useNavigate();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingVendorId, setSavingVendorId] = useState<string | null>(null);
  const [openMenu, setOpenMenu] = useState<ActionMenuState | null>(null);
  const [modalState, setModalState] = useState<ActionModalState | null>(null);

  const getVendorStatus = (
    vendor: JobVendorAssignment,
  ): VendorAssignmentStatus => getVendorStatusValue(vendor);

  const mergeJobState = (
    jobId: number,
    vendors: JobVendorAssignment[],
  ) => {
    const vendorStatusSummary = getSummaryFromVendors(vendors);
    const flags = getFlagsFromVendors(vendors);

    setJobs((prev) =>
      prev.map((job) =>
        job.id === jobId
          ? {
              ...job,
              vendors,
              vendorStatusSummary,
              ...flags,
            }
          : job,
      ),
    );

    return {
      vendorStatusSummary,
      ...flags,
    };
  };

  const fetchJobs = async () => {
    try {
      const data = await getJobs();
      setJobs(data);
    } catch (err) {
      console.error('Failed to fetch jobs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

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

  const handlePSQDownload = async (jobId: number, fileName?: string) => {
    const res = await api.get(downloadPSQ(jobId), {
      responseType: 'blob',
    });

    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName || `PSQ-${jobId}.pdf`;
    link.click();
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const map: Record<string, string> = {
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

  const getDisplayStatus = (job: Job) =>
    job.vendorStatusSummary || job.status;

  const getModalTitle = (action: VendorAction, jobTitle: string) => {
    if (action === 'assign') return `Select Vendor To Assign - ${jobTitle}`;
    if (action === 'hold') return `Select Vendor To Hold - ${jobTitle}`;
    if (action === 'reopen') return `Select Vendor To Reopen - ${jobTitle}`;
    return `Select Vendor To Close - ${jobTitle}`;
  };

  const getActionLabel = (
    action: VendorAction,
    vendor: JobVendorAssignment,
  ) => {
    if (action === 'assign') {
      return vendor.isEnabled ? 'Unassign' : 'Assign';
    }

    if (action === 'hold') return 'Put On Hold';
    if (action === 'reopen') return 'Reopen';
    return 'Close';
  };

  const getKnownVendors = (jobId: number) =>
    (openMenu?.jobId === jobId ? openMenu.vendors : undefined) ||
    jobs.find((job) => job.id === jobId)?.vendors ||
    [];

  const loadJobDetail = async (jobId: number) => {
    const cachedVendors = getKnownVendors(jobId);
    if (cachedVendors.length) {
      return {
        job: jobs.find((entry) => entry.id === jobId) || ({ id: jobId, title: `HRQ${jobId}` } as Job),
        vendors: cachedVendors,
      };
    }

    const res = await api.get(`/jobs/${jobId}`);
    const job = res.data as Job;
    const vendors = job.vendors || [];

    mergeJobState(jobId, vendors);

    return {
      job,
      vendors,
    };
  };

  const updateLocalVendors = (
    jobId: number,
    vendorId: string,
    action: VendorAction,
  ) => {
    const currentVendors = getKnownVendors(jobId);

    const nextVendors = currentVendors.map((vendor) => {
      if (vendor.id !== vendorId) {
        return vendor;
      }

      if (action === 'assign') {
        const nextAssigned = !vendor.isEnabled;

        return {
          ...vendor,
          isEnabled: nextAssigned,
          status: nextAssigned ? 'ACTIVE' : vendor.status,
        };
      }

      const nextStatus: Record<
        Exclude<VendorAction, 'assign'>,
        VendorAssignmentStatus
      > = {
        hold: 'ON_HOLD',
        reopen: 'ACTIVE',
        close: 'CLOSED',
      };

      return {
        ...vendor,
        status: nextStatus[action],
      };
    });

    mergeJobState(jobId, nextVendors);
    setOpenMenu({
      jobId,
      vendors: nextVendors,
    });

    if (modalState && modalState.jobId === jobId) {
      setModalState({
        ...modalState,
        vendors: getVendorsForAction(modalState.action, nextVendors),
      });
    }
  };

  const toggleMenu = async (jobId: number) => {
    if (openMenu?.jobId === jobId) {
      setOpenMenu(null);
      return;
    }

    try {
      const { vendors } = await loadJobDetail(jobId);
      setOpenMenu({
        jobId,
        vendors,
      });
    } catch (error) {
      console.error('Failed to load action menu', error);
      alert('Failed to load job actions');
    }
  };

  const openVendorActionModal = async (
    jobId: number,
    action: VendorAction,
  ) => {
    try {
      const { job, vendors } = await loadJobDetail(jobId);

      setModalState({
        action,
        jobId,
        title: getModalTitle(action, job.title),
        vendors: getVendorsForAction(action, vendors),
      });
      setOpenMenu(null);
    } catch (error) {
      console.error('Failed to load vendor action modal', error);
      alert('Failed to load vendors for this action');
    }
  };

  const handleVendorAction = async (
    vendor: JobVendorAssignment,
  ) => {
    if (!modalState) return;

    try {
      setSavingVendorId(vendor.id);

      if (modalState.action === 'assign') {
        await api.patch(
          `/jobs/${modalState.jobId}/vendors/${vendor.id}`,
          { isEnabled: !vendor.isEnabled },
        );
      } else {
        const statusMap: Record<
          Exclude<VendorAction, 'assign'>,
          VendorAssignmentStatus
        > = {
          hold: 'ON_HOLD',
          reopen: 'ACTIVE',
          close: 'CLOSED',
        };

        await api.patch(
          `/jobs/${modalState.jobId}/vendors/${vendor.id}/status`,
          { status: statusMap[modalState.action] },
        );
      }

      updateLocalVendors(
        modalState.jobId,
        vendor.id,
        modalState.action,
      );
    } catch (error) {
      console.error('Vendor action failed', error);
      alert('Failed to update vendor action');
    } finally {
      setSavingVendorId(null);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

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
              <th className="text-center">PSQ</th>
              <th className="text-center">Action</th>
            </tr>
          </thead>

          <tbody>
            {jobs.map((job) => {
              const menuVendors =
                openMenu?.jobId === job.id ? openMenu.vendors : job.vendors || [];
              const flags = getFlagsFromVendors(menuVendors);

              return (
                <tr
                  key={job.id}
                  className="border-t text-sm hover:bg-gray-50 cursor-pointer"
                  onClick={(e) => {
                    const target = e.target as HTMLElement;

                    if (target.closest('button')) {
                      return;
                    }

                    navigate(`/vendor-manager/jobs/${job.id}`);
                  }}
                >
                  <td className="text-center text-green-600 font-medium">
                    HRQ{job.id}
                  </td>

                  <td className="py-3 text-center text-gray-700">{job.title}</td>

                  <td className="py-3 text-center text-gray-700">
                    {job.level || '-'}
                  </td>

                  <td className="py-3 text-center text-gray-700">
                    {job.location}
                  </td>

                  <td className="text-center">
                    {job.createdAt
                      ? new Date(job.createdAt).toLocaleDateString('en-GB')
                      : '-'}
                  </td>

                  <td className="text-center">
                    <StatusBadge status={getDisplayStatus(job)} />
                  </td>

                  <td className="text-center">
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
                      'NA'
                    )}
                  </td>

                  <td className="text-center">
                    {job.psqFileName ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePSQDownload(job.id, job.psqFileName);
                        }}
                        className="text-blue-600 hover:underline"
                      >
                        Download PSQ
                      </button>
                    ) : (
                      'NA'
                    )}
                  </td>

                  <td
                    className="text-center relative"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleMenu(job.id);
                      }}
                      className="border px-2 py-1 rounded-md bg-white hover:bg-gray-50"
                    >
                      <ChevronDown size={14} />
                    </button>

                    {openMenu?.jobId === job.id && (
                      <div
                        className="absolute right-0 mt-2 bg-white border rounded-md shadow-lg w-40 z-50"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openVendorActionModal(job.id, 'assign');
                          }}
                          className="block w-full py-2 hover:bg-gray-100"
                        >
                          Assign
                        </button>

                        {flags.hasActiveVendor && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openVendorActionModal(job.id, 'hold');
                            }}
                            className="block w-full py-2 hover:bg-gray-100"
                          >
                            Hold
                          </button>
                        )}

                        {flags.hasOnHoldVendor && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openVendorActionModal(job.id, 'reopen');
                            }}
                            className="block w-full py-2 hover:bg-gray-100"
                          >
                            Reopen
                          </button>
                        )}

                        {flags.hasClosableVendor && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openVendorActionModal(job.id, 'close');
                            }}
                            className="block w-full py-2 text-red-600 hover:bg-gray-100"
                          >
                            Close
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {modalState && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-[560px] rounded-lg p-6 relative">
            <button
              onClick={() => setModalState(null)}
              className="absolute right-4 top-4 text-gray-400"
            >
              x
            </button>

            <h2 className="text-lg font-semibold mb-4">
              {modalState.title}
            </h2>

            {modalState.vendors.length === 0 ? (
              <p className="text-sm text-gray-500">
                No vendors available for this action
              </p>
            ) : (
              <div className="space-y-2 max-h-[420px] overflow-y-auto">
                {modalState.vendors.map((vendor) => (
                  <div
                    key={vendor.id}
                    className="flex items-center justify-between gap-4 py-3 border-b"
                  >
                    <div>
                      <div className="text-sm font-medium">
                        {vendor.name || vendor.email}
                      </div>
                      <div className="text-xs text-gray-500">
                        {vendor.email}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        Assigned: {vendor.isEnabled ? 'Yes' : 'No'} | Status:{' '}
                        {getVendorStatus(vendor) === 'ACTIVE'
                          ? 'APPROVED'
                          : getVendorStatus(vendor).replace('_', ' ')}
                      </div>
                    </div>

                    <button
                      onClick={() => handleVendorAction(vendor)}
                      disabled={savingVendorId === vendor.id}
                      className="px-3 py-1 border rounded text-sm disabled:opacity-50"
                    >
                      {getActionLabel(modalState.action, vendor)}
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="text-right mt-6">
              <button
                onClick={() => setModalState(null)}
                className="px-4 py-2 border rounded text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Jobs;
