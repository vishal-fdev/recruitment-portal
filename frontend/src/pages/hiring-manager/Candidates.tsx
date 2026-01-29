import { useEffect, useState } from 'react';
import api from '../../api/api';

interface Candidate {
  id: number;
  name: string;
  email: string;
  vendorName: string;
  jobTitle: string;
  experience: number;
  status: string;
}

const STATUS_OPTIONS = [
  'SCREENING',
  'INTERVIEWING',
  'TECH_SELECT',
  'TECH_REJECT',
  'OPS_SELECT',
  'OPS_REJECT',
];

const HMCandidates = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const res = await api.get('/candidates');
      setCandidates(res.data);
    } catch (err) {
      console.error(err);
      alert('Failed to load candidates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  const updateStage = async (
    candidateId: number,
    status: string,
  ) => {
    try {
      await api.post(`/candidates/${candidateId}/stage`, {
        status,
      });
      fetchCandidates();
    } catch (err) {
      console.error(err);
      alert('Failed to update stage');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">
        Hiring Manager – Candidate Pipeline
      </h1>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Vendor</th>
              <th className="px-4 py-3 text-left">Job</th>
              <th className="px-4 py-3 text-left">Experience</th>
              <th className="px-4 py-3 text-left">Stage</th>
              <th className="px-4 py-3 text-right">
                Update Stage
              </th>
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="py-6 text-center">
                  Loading...
                </td>
              </tr>
            )}

            {!loading &&
              candidates.map((c) => (
                <tr key={c.id} className="border-t">
                  <td className="px-4 py-3">{c.name}</td>
                  <td className="px-4 py-3">{c.vendorName}</td>
                  <td className="px-4 py-3">{c.jobTitle}</td>
                  <td className="px-4 py-3">{c.experience}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-700">
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <select
                      value={c.status}
                      onChange={(e) =>
                        updateStage(
                          c.id,
                          e.target.value,
                        )
                      }
                      className="border rounded px-2 py-1 text-sm"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s.replace('_', ' ')}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}

            {!loading && candidates.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="py-6 text-center text-gray-500"
                >
                  No candidates found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HMCandidates;
