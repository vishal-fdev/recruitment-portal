import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getJobs } from '../../services/jobService';
import type { Job } from '../../services/jobService';

const JobApprovals = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    const all = await getJobs();
    setJobs(
      all.filter(
        (j) => j.status === 'PENDING_APPROVAL',
      ),
    );
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">
        Job Approval Queue
      </h1>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-yellow-200">
            <tr>
              <th className="px-4 py-3 text-left">
                HRQID
              </th>
              <th className="px-4 py-3 text-left">
                Role
              </th>
              <th className="px-4 py-3 text-left">
                Location
              </th>
            </tr>
          </thead>

          <tbody>
            {jobs.map((job) => (
              <tr
                key={job.id}
                onClick={() =>
                  navigate(
                    `/vendor-manager-head/jobs/${job.id}`,
                  )
                }
                className="border-t hover:bg-gray-50 cursor-pointer"
              >
                <td className="px-4 py-3 text-blue-600 font-semibold">
                  HRQ{job.id}
                </td>

                <td className="px-4 py-3">
                  {job.title}
                </td>

                <td className="px-4 py-3">
                  {job.location}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default JobApprovals;
