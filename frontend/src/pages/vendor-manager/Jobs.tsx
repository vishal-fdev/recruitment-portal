import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getJobs } from '../../services/jobService';
import type { Job } from '../../services/jobService';

const Jobs = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJobs = async () => {
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

    fetchJobs();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Open Requisitions</h1>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left">ID</th>
              <th className="px-4 py-3 text-left">Title</th>
              <th className="px-4 py-3 text-left">Location</th>
              <th className="px-4 py-3 text-left">Experience</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center">
                  Loading...
                </td>
              </tr>
            )}

            {!loading &&
              jobs.map((job) => (
                <tr key={job.id} className="border-t">
                  <td className="px-4 py-3">JOB-{job.id}</td>
                  <td className="px-4 py-3">{job.title}</td>
                  <td className="px-4 py-3">{job.location}</td>
                  <td className="px-4 py-3">{job.experience}</td>
                  <td className="px-4 py-3">
                    {job.isActive ? 'Open' : 'Closed'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      className="text-emerald-600 font-medium"
                      onClick={() =>
                        navigate(
                          `/vendor-manager/candidates?jobId=${job.id}`,
                        )
                      }
                    >
                      View Candidates
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Jobs;
