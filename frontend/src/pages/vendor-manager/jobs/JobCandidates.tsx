import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../../api/api';

interface Candidate {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: string;
  vendor: {
    email: string;
  };
}

const JobCandidates = () => {
  const { jobId } = useParams();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/jobs/${jobId}/candidates`)
      .then((res) => setCandidates(res.data))
      .finally(() => setLoading(false));
  }, [jobId]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">
        Candidates for Job #{jobId}
      </h1>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Vendor</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Phone</th>
              <th className="px-4 py-3 text-left">Status</th>
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} className="text-center py-6">
                  Loading...
                </td>
              </tr>
            )}

            {!loading &&
              candidates.map((c) => (
                <tr key={c.id} className="border-t">
                  <td className="px-4 py-3">{c.name}</td>
                  <td className="px-4 py-3">
                    {c.vendor.email}
                  </td>
                  <td className="px-4 py-3">{c.email}</td>
                  <td className="px-4 py-3">{c.phone}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}

            {!loading && candidates.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="text-center py-6 text-gray-500"
                >
                  No candidates submitted yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default JobCandidates;
