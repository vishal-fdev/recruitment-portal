import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getJobs } from '../../services/jobService';
import type { Job } from '../../services/jobService';
import ManageJobModal from './ManageJobModal';

const Jobs = () => {
  const navigate = useNavigate();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJobId, setSelectedJobId] =
    useState<number | null>(null);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const data = await getJobs();
      setJobs(
        data.filter((j) => j.status === 'APPROVED')
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">
        All HRQID
      </h1>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-emerald-300">
            <tr>
              <th className="px-4 py-3 text-left">HRQID</th>
              <th className="px-4 py-3 text-left">Role</th>
              <th className="px-4 py-3 text-left">Location</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-right">Action</th>
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
                  <td
                    onClick={() =>
                      navigate(`/vendor-manager/jobs/${job.id}`)
                    }
                    className="px-4 py-3 text-emerald-700 font-semibold cursor-pointer"
                  >
                    HRQ{job.id}
                  </td>

                  <td className="px-4 py-3">
                    {job.title}
                  </td>

                  <td className="px-4 py-3">
                    {job.location}
                  </td>

                  <td className="px-4 py-3">
                    <span className="text-xs px-3 py-1 rounded-full bg-green-100 text-green-700">
                      Approved
                    </span>
                  </td>

                  <td className="px-4 py-3 text-right space-x-4">
                    <button
                      onClick={() =>
                        navigate(
                          `/vendor-manager/candidates?jobId=${job.id}`,
                        )
                      }
                      className="text-emerald-600 font-medium hover:underline"
                    >
                      View Candidates
                    </button>

                    <button
                      onClick={() =>
                        setSelectedJobId(job.id)
                      }
                      className="text-blue-600 font-medium hover:underline"
                    >
                      Manage Vendors
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {selectedJobId && (
        <ManageJobModal
          jobId={selectedJobId}
          onClose={() => setSelectedJobId(null)}
          onUpdated={fetchJobs}
        />
      )}
    </div>
  );
};

export default Jobs;
