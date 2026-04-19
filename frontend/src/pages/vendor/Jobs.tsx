import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api';

interface Job {
  id: number;
  title: string;
  location: string;
  experience: string;
  status: string;
  numberOfPositions?: number;
  currentNumberOfPositions?: number;
  positions?: {
    id: number;
    openings?: number;
    currentOpenings?: number;
  }[];
  jdFileName?: string;
}

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
      case 'PENDING_APPROVAL':
        return 'bg-yellow-200 text-yellow-800';
      case 'REJECTED':
        return 'bg-red-200 text-red-700';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="space-y-8">

      {/* HEADER */}

      <div>
        <h1 className="text-2xl font-semibold text-black">
          Available Job Requisitions
        </h1>

        <p className="text-gray-500 mt-1">
          View jobs assigned to you and submit candidates
        </p>
      </div>

      {/* TABLE */}

      <div className="bg-white rounded-xl shadow border border-gray-200 overflow-x-auto">

        <table className="w-full text-sm text-gray-800">

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

              <th className="px-6 py-4 text-center font-semibold">
                JD
              </th>

              <th className="px-6 py-4 text-center font-semibold">
                Action
              </th>
            </tr>

          </thead>

          <tbody>

            {loading && (
              <tr>
                <td colSpan={9} className="py-10 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            )}

            {!loading && jobs.length === 0 && (
              <tr>
                <td colSpan={9} className="py-10 text-center text-gray-500">
                  No jobs assigned to you.
                </td>
              </tr>
            )}

            {!loading &&
              jobs.map((job) => {
                const additionalTotal =
                  job.positions?.reduce(
                    (sum, position) => sum + Number(position.openings || 0),
                    0,
                  ) || 0;
                const additionalCurrent =
                  job.positions?.reduce(
                    (sum, position) =>
                      sum +
                      Number(
                        position.currentOpenings ?? position.openings ?? 0,
                      ),
                    0,
                  ) || 0;
                const totalPositions =
                  Number(job.numberOfPositions || 0) + additionalTotal;
                const currentPositions =
                  Number(
                    job.currentNumberOfPositions ?? job.numberOfPositions ?? 0,
                  ) + additionalCurrent;

                return (
                  <tr
                    key={job.id}
                    className="border-t hover:bg-gray-50 transition cursor-pointer"
                    onClick={() => openJobDetails(job.id)}
                  >

                    {/* HRQID */}

                    <td className="px-6 py-4 text-center font-semibold">
                      HRQ{job.id}
                    </td>

                    {/* ROLE */}

                    <td className="px-6 py-4 text-center">
                      {job.title}
                    </td>

                    {/* LOCATION */}

                    <td className="px-6 py-4 text-center">
                      {job.location}
                    </td>

                    {/* EXPERIENCE */}

                    <td className="px-6 py-4 text-center">
                      {job.experience}
                    </td>

                    {/* POSITIONS */}

                    <td className="px-6 py-4 text-center">
                      {totalPositions}
                    </td>

                    <td className="px-6 py-4 text-center">
                      {currentPositions}
                    </td>

                    {/* STATUS */}

                    <td className="px-6 py-4 text-center">

                      <span
                        className={`px-3 py-1 text-xs rounded-full font-medium ${getStatusStyle(
                          job.status,
                        )}`}
                      >
                        {job.status.replace('_', ' ')}
                      </span>

                    </td>

                    {/* JD DOWNLOAD */}

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

                        <span className="text-gray-400">—</span>

                      )}

                    </td>

                    {/* ACTION */}

                    <td className="px-6 py-4 text-center">

                      <button
                        onClick={(e) =>
                          submitCandidate(e, job.id)
                        }
                        className="bg-emerald-600 text-white px-4 py-2 rounded-md text-sm hover:bg-emerald-700 transition"
                      >
                        Submit Candidates
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
