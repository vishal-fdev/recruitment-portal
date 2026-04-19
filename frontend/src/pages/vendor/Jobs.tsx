import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api';
import type { Job } from '../../services/jobService';

const Jobs = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      const res = await api.get('/jobs');

      const sorted = (res.data || []).sort(
        (a: Job, b: Job) => b.id - a.id,
      );

      setJobs(sorted);
    } catch (err) {
      console.error('Failed to load jobs');
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (
    e: React.MouseEvent,
    jobId: number,
    fileName?: string,
  ) => {
    e.stopPropagation();

    const response = await api.get(`/jobs/${jobId}/jd/download`, {
      responseType: 'blob',
    });

    const blob = new Blob([response.data]);
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = fileName || `JOB-${jobId}.pdf`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    window.URL.revokeObjectURL(url);
  };

  const submitCandidate = (
    e: React.MouseEvent,
    jobId: number,
  ) => {
    e.stopPropagation();
    navigate(`/vendor/candidates/create?jobId=${jobId}`);
  };

  const openJobDetails = (jobId: number) => {
    navigate(`/vendor/jobs/${jobId}`);
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-700';
      case 'ON_HOLD':
        return 'bg-yellow-100 text-yellow-700';
      case 'CLOSED':
        return 'bg-gray-200 text-gray-600';
      case 'PENDING_APPROVAL':
        return 'bg-yellow-200 text-yellow-800';
      case 'REJECTED':
        return 'bg-red-200 text-red-700';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getActionLabel = (status: string) => {
    if (status === 'ON_HOLD') return 'On Hold';
    if (status === 'CLOSED') return 'Closed';
    return 'Submit Candidates';
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-black">
          Available Job Requisitions
        </h1>

        <p className="text-gray-500 mt-1">
          View jobs assigned to you and submit candidates
        </p>
      </div>

      <div className="bg-white rounded-xl shadow border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm text-gray-800">
          <thead className="bg-gray-100 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-center font-semibold">HRQID</th>
              <th className="px-6 py-4 text-center font-semibold">Role Hired For</th>
              <th className="px-6 py-4 text-center font-semibold">Location</th>
              <th className="px-6 py-4 text-center font-semibold">Experience</th>
              <th className="px-6 py-4 text-center font-semibold">Total Positions</th>
              <th className="px-6 py-4 text-center font-semibold">Status</th>
              <th className="px-6 py-4 text-center font-semibold">JD</th>
              <th className="px-6 py-4 text-center font-semibold">Action</th>
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td colSpan={8} className="py-10 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            )}

            {!loading && jobs.length === 0 && (
              <tr>
                <td colSpan={8} className="py-10 text-center text-gray-500">
                  No jobs assigned to you.
                </td>
              </tr>
            )}

            {!loading &&
              jobs.map((job) => {
                const totalPositions = job.positions?.length || 0;

                return (
                  <tr
                    key={job.id}
                    className="border-t hover:bg-gray-50 transition cursor-pointer"
                    onClick={() => openJobDetails(job.id)}
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
                      <span
                        className={`px-3 py-1 text-xs rounded-full font-medium ${getStatusStyle(
                          job.status,
                        )}`}
                      >
                        {job.status.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-center">
                      {job.jdFileName ? (
                        <button
                          onClick={(e) =>
                            handleDownload(e, job.id, job.jdFileName)
                          }
                          className="text-blue-600 font-medium hover:underline"
                        >
                          Download JD
                        </button>
                      ) : (
                        <span className="text-gray-400">NA</span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={(e) => submitCandidate(e, job.id)}
                        disabled={job.status !== 'APPROVED'}
                        className="bg-emerald-600 text-white px-4 py-2 rounded-md text-sm hover:bg-emerald-700 transition disabled:bg-gray-300 disabled:text-gray-600 disabled:cursor-not-allowed"
                      >
                        {getActionLabel(job.status)}
                      </button>
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

export default Jobs;
