import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api';
import ResumeModal from '../../components/ResumeModal';

export type CandidateStatus =
  | 'NEW'
  | 'SUBMITTED'
  | 'SCREENING'
  | 'TECH_SELECTED'
  | 'TECH_REJECTED'
  | 'OPS_SELECTED'
  | 'OPS_REJECTED'
  | 'REJECTED'
  | 'SELECTED';

interface Candidate {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  experience: number;
  status: CandidateStatus;
  resumePath: string;
  createdAt: string;

  vendor?: {
    id?: number;
    name?: string;
  };

  job?: {
    id?: number;
    title?: string;
  };
}

const STATUS_LABELS: Record<CandidateStatus, string> = {
  NEW: 'New',
  SUBMITTED: 'Submitted',
  SCREENING: 'Screening',
  TECH_SELECTED: 'Tech Selected',
  TECH_REJECTED: 'Tech Rejected',
  OPS_SELECTED: 'Ops Selected',
  OPS_REJECTED: 'Ops Rejected',
  REJECTED: 'Rejected',
  SELECTED: 'Selected',
};

const STATUS_COLORS: Record<CandidateStatus, string> = {
  NEW: 'bg-gray-100 text-gray-700',
  SUBMITTED: 'bg-indigo-100 text-indigo-700',
  SCREENING: 'bg-blue-100 text-blue-700',
  TECH_SELECTED: 'bg-green-100 text-green-700',
  TECH_REJECTED: 'bg-red-100 text-red-700',
  OPS_SELECTED: 'bg-green-200 text-green-800',
  OPS_REJECTED: 'bg-red-200 text-red-800',
  REJECTED: 'bg-red-100 text-red-700',
  SELECTED: 'bg-green-100 text-green-700',
};

const EyeIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="w-5 h-5 text-gray-600 hover:text-emerald-600 transition"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M2.458 12C3.732 7.943 7.523 5 12 5
      c4.477 0 8.268 2.943 9.542 7
      -1.274 4.057-5.065 7-9.542 7
      -4.477 0-8.268-2.943-9.542-7z"
    />
  </svg>
);

const VendorCandidates = () => {

  const navigate = useNavigate();

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);

  const [resumeCandidateId, setResumeCandidateId] =
    useState<number | null>(null);

  const [search, setSearch] = useState('');
  const [dateSort, setDateSort] = useState<'ASC' | 'DESC'>('DESC');
  const [nameSort, setNameSort] = useState<'ASC' | 'DESC' | 'NONE'>('NONE');

  const fetchCandidates = async () => {
    try {

      setLoading(true);

      const res = await api.get('/candidates');

      const vendorId = localStorage.getItem('vendorId');

      const filtered = vendorId
        ? res.data.filter(
            (c: Candidate) =>
              String(c.vendor?.id) === String(vendorId)
          )
        : res.data;

      setCandidates(filtered);

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

  const filteredCandidates = useMemo(() => {

    let data = [...candidates];

    if (search) {

      data = data.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.job?.title?.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (nameSort !== 'NONE') {

      data.sort((a, b) => {
        const n1 = a.name.toLowerCase();
        const n2 = b.name.toLowerCase();

        if (nameSort === 'ASC') return n1.localeCompare(n2);
        else return n2.localeCompare(n1);
      });

    } else {

      data.sort((a, b) => {
        const d1 = new Date(a.createdAt).getTime();
        const d2 = new Date(b.createdAt).getTime();

        return dateSort === 'ASC' ? d1 - d2 : d2 - d1;
      });

    }

    return data;

  }, [candidates, search, dateSort, nameSort]);

  return (

    <div className="space-y-6">

      {/* HEADER */}

      <div className="flex justify-between items-center">

        <div>
          <h1 className="text-2xl font-semibold text-gray-800">
            Candidate Pipeline
          </h1>

          <p className="text-sm text-gray-500">
            Manage candidates submitted by you
          </p>
        </div>

        <button
          onClick={() =>
            navigate('/vendor/candidates/create')
          }
          className="px-4 py-2 bg-emerald-600 text-white rounded-md text-sm hover:bg-emerald-700 transition"
        >
          + Create Candidate
        </button>

      </div>

      {/* FILTER BAR */}

      <div className="bg-white border border-gray-300 rounded-lg shadow-sm px-5 py-4 flex justify-between items-center">

        {/* SEARCH LEFT */}

        <div className="relative w-72">

          <input
            type="text"
            placeholder="Search candidate or job..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-gray-400 rounded-md pl-4 pr-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />

        </div>

        {/* FILTERS RIGHT */}

        <div className="flex gap-3">

          {/* DATE SORT */}

          <select
            value={dateSort}
            onChange={(e) => {
              setNameSort('NONE');
              setDateSort(e.target.value as 'ASC' | 'DESC');
            }}
            className="border border-gray-400 rounded-md px-3 py-2 text-sm bg-white hover:border-gray-600"
          >
            <option value="DESC">Newest</option>
            <option value="ASC">Oldest</option>
          </select>

          {/* NAME SORT */}

          <select
            value={nameSort}
            onChange={(e) =>
              setNameSort(e.target.value as any)
            }
            className="border border-gray-400 rounded-md px-3 py-2 text-sm bg-white hover:border-gray-600"
          >
            <option value="NONE">Name Sort</option>
            <option value="ASC">A → Z</option>
            <option value="DESC">Z → A</option>
          </select>

        </div>

      </div>

      {/* TABLE */}

      <div className="bg-white rounded-lg shadow border border-gray-300 overflow-x-auto">

        <table className="w-full text-sm text-center">

          <thead className="bg-gray-100 text-gray-700 border-b">

            <tr>

              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">Email</th>
              <th className="px-4 py-3 font-semibold">Contact</th>
              <th className="px-4 py-3 font-semibold">Job</th>
              <th className="px-4 py-3 font-semibold">Experience</th>
              <th className="px-4 py-3 font-semibold">Resume</th>
              <th className="px-4 py-3 font-semibold">Status</th>

            </tr>

          </thead>

          <tbody>

            {loading && (
              <tr>
                <td colSpan={7} className="py-10 text-gray-500">
                  Loading...
                </td>
              </tr>
            )}

            {!loading &&
              filteredCandidates.map((c) => (

                <tr
                  key={c.id}
                  className="border-t hover:bg-gray-50 transition"
                >

                  <td
                    className="px-4 py-3 text-emerald-600 cursor-pointer hover:underline font-medium"
                    onClick={() =>
                      navigate(`/vendor/candidates/${c.id}`)
                    }
                  >
                    {c.name}
                  </td>

                  <td className="px-4 py-3">{c.email || '—'}</td>

                  <td className="px-4 py-3">{c.phone || '—'}</td>

                  <td className="px-4 py-3">{c.job?.title || '—'}</td>

                  <td className="px-4 py-3">{c.experience} yrs</td>

                  <td className="px-4 py-3">

                    <div className="flex justify-center">

                      <button
                        onClick={() =>
                          setResumeCandidateId(c.id)
                        }
                      >
                        <EyeIcon />
                      </button>

                    </div>

                  </td>

                  <td className="px-4 py-3">

                    <div className="flex justify-center">

                      <span
                        className={`px-3 py-1 text-xs rounded-full font-medium ${STATUS_COLORS[c.status]}`}
                      >
                        {STATUS_LABELS[c.status]}
                      </span>

                    </div>

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

export default VendorCandidates;