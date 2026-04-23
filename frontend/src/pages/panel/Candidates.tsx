import { useEffect, useState } from 'react';
import { Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api';
import StageBadge from '../../components/StageBadge';

type Candidate = {
  id: number;
  name: string;
  email: string;
  phone?: string;
  experience?: number;
  job?: {
    id: number;
    title: string;
  };
  vendor?: {
    name: string;
  };
  status: string;
};

const PanelCandidates = () => {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/candidates');
        setCandidates(res.data || []);
      } catch (error) {
        console.error('Failed to load panel candidates', error);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-800">Assigned Candidates</h1>
        <p className="mt-1 text-sm text-gray-500">
          Candidates submitted against the jobs where you are the screening panel.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-sm text-center">
          <thead className="bg-[#96f7e4] text-gray-700">
            <tr>
              <th className="px-4 py-3">Candidate</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Job</th>
              <th className="px-4 py-3">Vendor</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">View</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} className="py-8 text-gray-500">
                  Loading...
                </td>
              </tr>
            )}

            {!loading && !candidates.length && (
              <tr>
                <td colSpan={7} className="py-8 text-gray-400">
                  No candidates found.
                </td>
              </tr>
            )}

            {!loading &&
              candidates.map((candidate) => (
                <tr
                  key={candidate.id}
                  className="border-t hover:bg-gray-50"
                >
                  <td className="px-4 py-3 font-medium text-emerald-600">
                    {candidate.name}
                  </td>
                  <td className="px-4 py-3">{candidate.email}</td>
                  <td className="px-4 py-3">{candidate.phone || '-'}</td>
                  <td className="px-4 py-3">
                    {candidate.job ? `HRQ${candidate.job.id} - ${candidate.job.title}` : '-'}
                  </td>
                  <td className="px-4 py-3">{candidate.vendor?.name || '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center">
                      <StageBadge status={candidate.status} />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => navigate(`/panel/candidates/${candidate.id}`)}
                      className="inline-flex items-center justify-center text-gray-600 hover:text-emerald-600"
                    >
                      <Eye size={16} />
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

export default PanelCandidates;
