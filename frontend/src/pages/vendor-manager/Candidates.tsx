import { useEffect, useState } from 'react';
import { Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api';

interface Candidate {
  id: number;
  name: string;
  email: string;
  phone?: string;
  experience?: number;
  vendor?: {
    name: string;
  };
  job?: {
    title: string;
  };
  status: string;
}

const Candidates = () => {
  const navigate = useNavigate();

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedResumeUrl, setSelectedResumeUrl] =
    useState<string | null>(null);

  useEffect(() => {
    api
      .get('/candidates')
      .then((res) => setCandidates(res.data || []))
      .catch(() => setCandidates([]))
      .finally(() => setLoading(false));
  }, []);

  /* ================= RESUME VIEW ================= */

  const openResume = async (
    candidateId: number,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();

    try {
      const response = await api.get(
        `/candidates/${candidateId}/resume`,
        { responseType: 'blob' }
      );

      const blob = new Blob([response.data], {
        type: response.headers['content-type'],
      });

      const fileUrl = URL.createObjectURL(blob);
      setSelectedResumeUrl(fileUrl);
    } catch (error) {
      console.error('Failed to load resume', error);
    }
  };

  const closeModal = () => {
    if (selectedResumeUrl) {
      URL.revokeObjectURL(selectedResumeUrl);
    }
    setSelectedResumeUrl(null);
  };

  /* ================= STATUS BADGE ================= */

  const getStatusStyle = (status: string) => {
    if (status === 'REJECTED')
      return 'bg-red-100 text-red-600';

    if (status === 'SELECTED')
      return 'bg-green-100 text-green-600';

    return 'bg-yellow-100 text-yellow-700';
  };

  return (
    <div className="space-y-6">

      {/* PAGE TITLE */}

      <h1 className="text-2xl font-semibold text-gray-800">
        Candidate Pipeline
      </h1>

      {/* TABLE CARD */}

      <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">

        <table className="w-full text-sm">

          {/* HEADER */}

          <thead className="bg-gray-100 border-b">

            <tr>

              <th className="px-6 py-3 text-center text-gray-600 font-medium">
                Name
              </th>

              <th className="px-6 py-3 text-center text-gray-600 font-medium">
                Email
              </th>

              <th className="px-6 py-3 text-center text-gray-600 font-medium">
                Contact
              </th>

              <th className="px-6 py-3 text-center text-gray-600 font-medium">
                Vendor
              </th>

              <th className="px-6 py-3 text-center text-gray-600 font-medium">
                Job
              </th>

              <th className="px-6 py-3 text-center text-gray-600 font-medium">
                Experience
              </th>

              <th className="px-6 py-3 text-center text-gray-600 font-medium">
                Resume
              </th>

              <th className="px-6 py-3 text-center text-gray-600 font-medium">
                Status
              </th>

            </tr>

          </thead>

          {/* BODY */}

          <tbody>

            {loading && (
              <tr>
                <td colSpan={8} className="py-6 text-center">
                  Loading candidates...
                </td>
              </tr>
            )}

            {!loading &&
              candidates.map((c) => (

                <tr
                  key={c.id}
                  onClick={() =>
                    navigate(`/vendor-manager/candidates/${c.id}`)
                  }
                  className="border-t hover:bg-gray-50 cursor-pointer transition"
                >

                  <td className="px-6 py-4 text-center font-medium text-emerald-600">
                    {c.name}
                  </td>

                  <td className="px-6 py-4 text-center">
                    {c.email}
                  </td>

                  <td className="px-6 py-4 text-center">
                    {c.phone || '-'}
                  </td>

                  <td className="px-6 py-4 text-center">
                    {c.vendor?.name || '-'}
                  </td>

                  <td className="px-6 py-4 text-center">
                    {c.job?.title || '-'}
                  </td>

                  <td className="px-6 py-4 text-center">
                    {c.experience
                      ? `${c.experience} yrs`
                      : '-'}
                  </td>

                  <td className="px-6 py-4 text-center">

                    <button
                      onClick={(e) =>
                        openResume(c.id, e)
                      }
                      className="text-gray-600 hover:text-black"
                    >
                      <Eye size={18} />
                    </button>

                  </td>

                  <td className="px-6 py-4 text-center">

                    <span
                      className={`px-3 py-1 text-xs rounded-full font-medium ${getStatusStyle(
                        c.status
                      )}`}
                    >
                      {c.status}
                    </span>

                  </td>

                </tr>

              ))}

          </tbody>

        </table>

      </div>

      {/* RESUME MODAL */}

      {selectedResumeUrl && (

        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">

          <div className="bg-white w-[85%] h-[85%] rounded-xl shadow-lg relative">

            <button
              onClick={closeModal}
              className="absolute top-3 right-4 text-gray-600 hover:text-black text-xl"
            >
              ✕
            </button>

            <iframe
              src={selectedResumeUrl}
              title="Resume Viewer"
              className="w-full h-full rounded-xl"
            />

          </div>

        </div>

      )}

    </div>
  );
};

export default Candidates;