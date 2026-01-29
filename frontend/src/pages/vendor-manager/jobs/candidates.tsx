import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../../api/api';

interface Candidate {
  id: number;
  name: string;
  email: string;
  phone: string;
  city: string;
  experience: number;
  status: string;
  createdAt: string;
  vendor: {
    email: string;
  };
}

const JobCandidates = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    api
      .get(`/jobs/${id}/candidates`)
      .then((res) => setCandidates(res.data))
      .catch(() => alert('Failed to load candidates'))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            Candidates for Job #{id}
          </h1>
          <p className="text-sm text-gray-500">
            Candidates submitted by vendors
          </p>
        </div>

        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 border rounded-md text-sm"
        >
          ← Back
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-green-100">
            <tr>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Contact</th>
              <th className="px-4 py-3 text-left">City</th>
              <th className="px-4 py-3 text-left">Vendor</th>
              <th className="px-4 py-3 text-left">Experience</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Created On</th>
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center">
                  Loading...
                </td>
              </tr>
            )}

            {!loading && candidates.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-gray-500">
                  No candidates submitted yet
                </td>
              </tr>
            )}

            {!loading &&
              candidates.map((c) => (
                <tr key={c.id} className="border-t">
                  <td className="px-4 py-3">{c.name}</td>
                  <td className="px-4 py-3">{c.email}</td>
                  <td className="px-4 py-3">{c.phone}</td>
                  <td className="px-4 py-3">{c.city}</td>
                  <td className="px-4 py-3">{c.vendor.email}</td>
                  <td className="px-4 py-3">{c.experience}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-700">
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default JobCandidates;
