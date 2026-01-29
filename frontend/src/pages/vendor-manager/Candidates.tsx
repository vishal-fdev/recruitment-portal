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
  resumePath: string;
  status: string;
}

const VendorManagerCandidates = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        const res = await api.get('/candidates');
        setCandidates(res.data);
      } catch (e) {
        alert('Failed to load candidates');
      } finally {
        setLoading(false);
      }
    };

    fetchCandidates();
  }, []);

  return (
    <div className="p-6 w-full">
      <h1 className="text-2xl font-semibold mb-6">Candidates</h1>

      <div className="bg-white rounded-lg shadow w-full overflow-x-auto">
        <table className="w-full table-fixed border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-3 text-left w-[16%]">Name</th>
              <th className="px-4 py-3 text-left w-[20%]">Email</th>
              <th className="px-4 py-3 text-left w-[14%]">Phone</th>
              <th className="px-4 py-3 text-left w-[12%]">Vendor</th>
              <th className="px-4 py-3 text-left w-[20%]">Job</th>
              <th className="px-4 py-3 text-center w-[8%]">Resume</th>
              <th className="px-4 py-3 text-center w-[10%]">Status</th>
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} className="text-center py-6">
                  Loading...
                </td>
              </tr>
            )}

            {!loading &&
              candidates.map((c) => (
                <tr
                  key={c.id}
                  className="border-t hover:bg-gray-50"
                >
                  <td className="px-4 py-3 truncate">{c.name}</td>
                  <td className="px-4 py-3 truncate">{c.email}</td>
                  <td className="px-4 py-3">{c.phone}</td>
                  <td className="px-4 py-3">{c.vendor?.name}</td>
                  <td className="px-4 py-3 truncate">
                    {c.job?.title || '—'}
                  </td>

                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => setResumeUrl(c.resumePath)}
                      className="text-xl hover:scale-110 transition"
                      title="View Resume"
                    >
                      👁️
                    </button>
                  </td>

                  <td className="px-4 py-3 text-center">
                    <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-700">
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}

            {!loading && candidates.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-6 text-gray-500">
                  No candidates found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {resumeUrl && (
        <ResumeModal
          resumePath={resumeUrl}
          onClose={() => setResumeUrl(null)}
        />
      )}
    </div>
  );
};

export default VendorManagerCandidates;
