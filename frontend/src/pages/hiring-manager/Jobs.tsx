// src/pages/hiring-manager/Jobs.tsx

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api';
import { authService } from '../../auth/authService';

interface Job {
  id: number;
  title: string;
  location: string;
  level?: string;
  createdAt: string;
  status: string;
}

const HMJobs = () => {
  const navigate = useNavigate();
  const role = authService.getRole();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchJobs = async () => {
    try {
      const res = await api.get('/jobs');
      setJobs(res.data);
    } catch {
      alert('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">
            Job Requisitions
          </h1>
          <p className="text-sm text-gray-500">
            Create and manage job openings
          </p>
        </div>

        {role === 'HIRING_MANAGER' && (
          <button
            onClick={() => navigate('/hiring-manager/jobs/create')}
            className="bg-emerald-600 text-white px-5 py-2 rounded shadow hover:bg-emerald-700 transition"
          >
            + Create Job
          </button>
        )}
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm text-center">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-4 py-3">HRQ ID</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Level</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Assigned Date</th>
              <th className="px-4 py-3">Status</th>

              {/* ✅ NEW COLUMN */}
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} className="py-6 text-gray-500">
                  Loading...
                </td>
              </tr>
            )}

            {!loading &&
              jobs.map((job) => (
                <tr
                  key={job.id}
                  className="border-t hover:bg-gray-50 cursor-pointer transition"
                  onClick={() =>
                    navigate(`/hiring-manager/jobs/${job.id}`)
                  }
                >
                  <td className="px-4 py-3 font-medium text-emerald-600">
                    HRQ{job.id}
                  </td>

                  <td className="px-4 py-3 text-gray-700">
                    {job.title}
                  </td>

                  <td className="px-4 py-3 text-gray-700">
                    {job.level || '—'}
                  </td>

                  <td className="px-4 py-3 text-gray-700">
                    {job.location}
                  </td>

                  <td className="px-4 py-3 text-gray-700">
                    {new Date(job.createdAt).toLocaleDateString('en-IN')}
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex justify-center">
                      <StatusBadge status={job.status} />
                    </div>
                  </td>

                  {/* ✅ EDIT BUTTON */}
                  <td className="px-4 py-3">
                    {(job.status === 'APPROVED' || job.status === 'REJECTED') && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // 🔥 IMPORTANT (prevents row click)
                          navigate(`/hiring-manager/edit-job/${job.id}`);
                        }}
                        className="text-blue-600 hover:text-blue-800 font-semibold"
                      >
                        Edit
                      </button>
                    )}
                  </td>

                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HMJobs;


/* ================= STATUS BADGE ================= */

const StatusBadge = ({ status }: { status: string }) => {
  let styles = '';

  switch (status) {
    case 'PENDING_APPROVAL':
      styles = 'bg-yellow-100 text-yellow-700';
      break;
    case 'APPROVED':
      styles = 'bg-green-100 text-green-700';
      break;
    case 'REJECTED':
      styles = 'bg-red-100 text-red-700';
      break;
    case 'CLOSED':
      styles = 'bg-gray-200 text-gray-600';
      break;
    default:
      styles = 'bg-indigo-100 text-indigo-700';
  }

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles}`}>
      {status.replace('_', ' ')}
    </span>
  );
};