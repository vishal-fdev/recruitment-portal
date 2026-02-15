// src/pages/hiring-manager/Jobs.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getJobs } from '../../services/jobService';
import type { Job } from '../../services/jobService';

const HMJobs = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const data = await getJobs();
      setJobs(data);
    } catch (err) {
      console.error(err);
      alert('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">
          Job Requisitions
        </h1>
        <p className="text-sm text-gray-500">
          Create and manage job openings
        </p>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left">HRQ ID</th>
              <th className="px-4 py-3 text-left">Role</th>
              <th className="px-4 py-3 text-left">Location</th>
              <th className="px-4 py-3 text-left">Assigned Date</th>
              <th className="px-4 py-3 text-left">Status</th>
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} className="py-6 text-center">
                  Loading...
                </td>
              </tr>
            )}

            {!loading &&
              jobs.map((job) => (
                <tr
                  key={job.id}
                  className="border-t hover:bg-gray-50"
                >
                  <td className="px-4 py-3">
                    <button
                      onClick={() =>
                        navigate(
                          `/hiring-manager/jobs/${job.id}`,
                        )
                      }
                      className="text-emerald-600 font-medium hover:underline"
                    >
                      HRQ{job.id}
                    </button>
                  </td>

                  <td className="px-4 py-3">
                    {job.title}
                  </td>

                  <td className="px-4 py-3">
                    {job.location}
                  </td>

                  <td className="px-4 py-3">
                    {new Date(
                      job.createdAt,
                    ).toLocaleDateString('en-IN')}
                  </td>

                  <td className="px-4 py-3">
                    <span className="text-xs px-3 py-1 rounded-full bg-green-100 text-green-700 font-medium">
                      Open-WIP
                    </span>
                  </td>
                </tr>
              ))}

            {!loading && jobs.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="py-6 text-center text-gray-500"
                >
                  No jobs found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HMJobs;
