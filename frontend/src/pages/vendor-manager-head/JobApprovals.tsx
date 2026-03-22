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

      // ✅ SHOW ALL JOBS (INCLUDING PENDING)
      const sorted = all.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime(),
      );

      setJobs(sorted);
    } catch (err) {
      console.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'PENDING_APPROVAL':
        return 'bg-yellow-200 text-yellow-800';
      case 'APPROVED':
        return 'bg-gray-200 text-black';
      case 'REJECTED':
        return 'bg-gray-300 text-black';
      default:
        return 'bg-gray-100 text-black';
    }
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
              <th className="px-6 py-4 text-center font-semibold">
                HRQID
              </th>
              <th className="px-6 py-4 text-center font-semibold">
                Role Hired For
              </th>
              <th className="px-6 py-4 text-center font-semibold">
                Location
              </th>
              <th className="px-6 py-4 text-center font-semibold">
                Experience
              </th>
              <th className="px-6 py-4 text-center font-semibold">
                Total Positions
              </th>
              <th className="px-6 py-4 text-center font-semibold">
                Current Positions
              </th>
              <th className="px-6 py-4 text-center font-semibold">
                Status
              </th>
            </tr>
          </thead>

          <tbody>

            {loading && (
              <tr>
                <td
                  colSpan={7}
                  className="py-10 text-center text-gray-500"
                >
                  Loading...
                </td>
              </tr>
            )}

            {!loading && jobs.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="py-10 text-center text-gray-500"
                >
                  No jobs found.
                </td>
              </tr>
            )}

            {!loading &&
              jobs.map((job) => {
                const totalPositions =
                  job.positions?.length || 0;

                const currentPositions =
                  totalPositions;

                return (
                  <tr
                    key={job.id}
                    className="border-t hover:bg-gray-50 transition cursor-pointer"
                    onClick={() =>
                      navigate(
                        `/vendor-manager-head/jobs/${job.id}`,
                      )
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
                      {job.experience}
                    </td>

                    <td className="px-6 py-4 text-center">
                      {totalPositions}
                    </td>

                    <td className="px-6 py-4 text-center">
                      {currentPositions}
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