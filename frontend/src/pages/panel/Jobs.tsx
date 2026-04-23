import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getJobs, type Job } from '../../services/jobService';

const PanelJobs = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadJobs = async () => {
      try {
        const data = await getJobs();
        setJobs(data);
      } catch (error) {
        console.error('Failed to load panel jobs', error);
      } finally {
        setLoading(false);
      }
    };

    void loadJobs();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-800">Assigned Jobs</h1>
        <p className="mt-1 text-sm text-gray-500">
          Jobs where you are assigned to the screening round.
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-sm text-center">
          <thead className="bg-[#96f7e4] text-gray-700">
            <tr>
              <th className="px-4 py-3">HRQ ID</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Hiring Manager</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} className="py-8 text-gray-500">
                  Loading...
                </td>
              </tr>
            )}

            {!loading && !jobs.length && (
              <tr>
                <td colSpan={5} className="py-8 text-gray-400">
                  No assigned jobs found.
                </td>
              </tr>
            )}

            {!loading &&
              jobs.map((job) => (
                <tr
                  key={job.id}
                  onClick={() => navigate(`/panel/jobs/${job.id}`)}
                  className="cursor-pointer border-t hover:bg-gray-50"
                >
                  <td className="px-4 py-3 font-medium text-emerald-600">HRQ{job.id}</td>
                  <td className="px-4 py-3">{job.title}</td>
                  <td className="px-4 py-3">{job.location || '-'}</td>
                  <td className="px-4 py-3">{job.hiringManager || '-'}</td>
                  <td className="px-4 py-3">{job.status.replace(/_/g, ' ')}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PanelJobs;
