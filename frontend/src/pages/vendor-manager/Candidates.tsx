import { useEffect, useState } from 'react';
import api from '../../api/api';
import ResumeModal from '../../components/ResumeModal';

interface Candidate {
  id: number;
  name: string;
  email: string;
  phone: string;
  vendor: { name: string };
  job?: { title: string };
  status: string;
}

const VendorManagerCandidates = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [resumeCandidateId, setResumeCandidateId] =
    useState<number | null>(null);

  useEffect(() => {
    api
      .get('/candidates')
      .then((res) => setCandidates(res.data))
      .catch(() => alert('Failed to load candidates'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 w-full">
      <h1 className="text-2xl font-semibold mb-6">Candidates</h1>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Vendor</th>
              <th className="px-4 py-3 text-left">Job</th>
              <th className="px-4 py-3 text-center">Resume</th>
              <th className="px-4 py-3 text-center">Status</th>
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
                  <td className="px-4 py-3">{c.email}</td>
                  <td className="px-4 py-3">{c.vendor?.name}</td>
                  <td className="px-4 py-3">
                    {c.job?.title || '—'}
                  </td>

                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => setResumeCandidateId(c.id)}
                      title="View Resume"
                      className="hover:scale-110 transition"
                    >
                      {/* Eye SVG */}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-5 h-5 text-gray-700"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    </button>
                  </td>

                  <td className="px-4 py-3 text-center">
                    <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-700">
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {resumeCandidateId && (
        <ResumeModal
          candidateId={resumeCandidateId}
          onClose={() => setResumeCandidateId(null)}
        />
      )}
    </div>
  );
};

export default VendorManagerCandidates;
