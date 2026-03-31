// src/pages/vendor-manager-head/JobApprovals.tsx

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getJobs } from '../../services/jobService';
import type { Job } from '../../services/jobService';

const JobApprovals = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      const all = await getJobs();

      const sorted = all.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime(),
      );

      setJobs(sorted);
    } catch {
      console.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  /* ================= STATUS COLORS ================= */

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-700';
      case 'REJECTED':
        return 'bg-red-100 text-red-700';
      case 'PENDING_APPROVAL':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  /* ================= FORMAT ADDITIONAL POSITIONS ================= */

  const formatAdditionalPositions = (job: Job) => {
    if (!job.positions || job.positions.length === 0) return '-';

    return job.positions
      .map((p) => `${p.openings} (${p.level})`)
      .join(' / ');
  };

  /* ================= TOTAL POSITIONS ================= */

  const getTotalPositions = (job: Job) => {
    const main = job.numberOfPositions || 0;

    const child =
      job.positions?.reduce(
        (sum, p) => sum + (p.openings || 0),
        0,
      ) || 0;

    return main + child;
  };

  /* ================= CLOSED POSITIONS ================= */

  const getClosedPositions = (job: Job) => {
    return (
      job.positions?.reduce(
        (sum, p) =>
          p.status === 'CLOSED' ? sum + (p.openings || 0) : sum,
        0,
      ) || 0
    );
  };

  /* ================= CURRENT POSITIONS ================= */

  const getCurrentPositions = (job: Job) => {
    return getTotalPositions(job) - getClosedPositions(job);
  };

  /* ================= PROGRESS % ================= */

  const getProgress = (job: Job) => {
    const total = getTotalPositions(job);
    const closed = getClosedPositions(job);

    if (!total) return 0;

    return Math.round((closed / total) * 100);
  };

  return (
    <div className="space-y-8">

      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-semibold text-black">
          Job Approval Queue
        </h1>
        <p className="text-gray-500 mt-1">
          Review, approve or reject job requisitions
        </p>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm text-gray-800">

          {/* TABLE HEAD */}
          <thead className="bg-gray-100 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-center font-semibold">HRQID</th>
              <th className="px-6 py-4 text-center font-semibold">Role</th>
              <th className="px-6 py-4 text-center font-semibold">Location</th>
              <th className="px-6 py-4 text-center font-semibold">Level</th>
              <th className="px-6 py-4 text-center font-semibold">No. of Positions</th>
              <th className="px-6 py-4 text-center font-semibold">Additional Positions</th>
              <th className="px-6 py-4 text-center font-semibold">Total Positions</th>
              <th className="px-6 py-4 text-center font-semibold">Current Positions</th>
              <th className="px-6 py-4 text-center font-semibold">Progress</th>
              <th className="px-6 py-4 text-center font-semibold">Created Date</th>
              <th className="px-6 py-4 text-center font-semibold">Status</th>
            </tr>
          </thead>

          <tbody>

            {loading && (
              <tr>
                <td colSpan={11} className="py-10 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            )}

            {!loading && jobs.length === 0 && (
              <tr>
                <td colSpan={11} className="py-10 text-center text-gray-500">
                  No jobs found.
                </td>
              </tr>
            )}

            {!loading &&
              jobs.map((job) => {
                const mainPositions = `${job.numberOfPositions || 0} (${job.level || '-'})`;
                const additionalPositions = formatAdditionalPositions(job);
                const totalPositions = getTotalPositions(job);
                const currentPositions = getCurrentPositions(job);
                const progress = getProgress(job);

                return (
                  <tr
                    key={job.id}
                    className="border-t hover:bg-gray-50 transition cursor-pointer"
                    onClick={() =>
                      navigate(`/vendor-manager-head/jobs/${job.id}`)
                    }
                  >
                    <td className="px-6 py-4 text-center font-semibold">
                      HRQ{job.id}
                    </td>

                    <td className="px-6 py-4 text-center">
                      {job.title}
                    </td>

                    <td className="px-6 py-4 text-center">
                      {job.location}
                    </td>

                    <td className="px-6 py-4 text-center">
                      {job.level || '-'}
                    </td>

                    <td className="px-6 py-4 text-center font-medium">
                      {mainPositions}
                    </td>

                    <td className="px-6 py-4 text-center">
                      {additionalPositions}
                    </td>

                    <td className="px-6 py-4 text-center font-semibold">
                      {totalPositions}
                    </td>

                    <td className="px-6 py-4 text-center font-semibold">
                      {currentPositions}
                    </td>

                    {/* ✅ PROGRESS BAR */}
                    <td className="px-6 py-4">
                      <div className="w-full">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <div className="text-xs text-center mt-1 text-gray-600">
                          {progress}%
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-center">
                      {job.createdAt
                        ? job.createdAt.split('T')[0]
                        : '-'}
                    </td>

                    <td className="px-6 py-4 text-center">
                      <span
                        className={`px-3 py-1 text-xs rounded-full font-medium ${getStatusStyle(
                          job.status,
                        )}`}
                      >
                        {job.status.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                );
              })}

          </tbody>
        </table>
      </div>
    </div>
  );
};

export default JobApprovals;