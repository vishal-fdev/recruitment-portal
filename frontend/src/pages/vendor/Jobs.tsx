import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api';

interface Job {
  id: number;
  title: string;
  location: string;
  experience: string;
  isActive: boolean;
}

const Jobs = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get('/jobs')
      .then((res) => setJobs(res.data || []))
      .catch((err) => {
        console.error('Failed to load jobs', err);
        setJobs([]);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">Assigned Jobs</h1>
        <p className="text-sm text-gray-500">
          Jobs assigned to you by Vendor Managers
        </p>
      </div>

      {loading && <p>Loading jobs…</p>}

      {!loading && jobs.length === 0 && (
        <p className="text-gray-500">
          No jobs have been assigned to you yet.
        </p>
      )}

      {!loading && jobs.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
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
              {jobs.map((job) => (
                <tr
                  key={job.id}
                  className="border-t hover:bg-gray-50"
                >
                  <td className="px-4 py-3">JOB-{job.id}</td>
                  <td className="px-4 py-3">{job.title}</td>
                  <td className="px-4 py-3">{job.location}</td>
                  <td className="px-4 py-3">{job.experience}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        job.isActive
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {job.isActive ? 'Open' : 'Closed'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {job.isActive && (
                      <button
                        onClick={() =>
                          navigate(
                            `/vendor/candidates/create?jobId=${job.id}`,
                          )
                        }
                        className="text-emerald-600 font-medium text-sm"
                      >
                        + Add Candidate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Jobs;
