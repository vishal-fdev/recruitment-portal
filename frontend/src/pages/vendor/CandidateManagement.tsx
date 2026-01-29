import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api';

interface Job {
  id: number;
  title: string;
}

interface Candidate {
  id: number;
  name: string;
  email: string;
  phone: string;
  city: string;
  experience: number;
  status: 'NEW' | 'SUBMITTED';
  createdAt: string;
  job?: Job | null;
}

const CandidateManagement = () => {
  const navigate = useNavigate();

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<number | null>(null);

  // =========================
  // LOAD DATA
  // =========================
  const loadData = async () => {
    try {
      setLoading(true);

      const [candidatesRes, jobsRes] = await Promise.all([
        api.get('/candidates'),
        api.get('/jobs'), // vendor-assigned jobs
      ]);

      setCandidates(candidatesRes.data);
      setJobs(jobsRes.data);
    } catch (err) {
      console.error(err);
      alert('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // =========================
  // SUBMIT CANDIDATE → JOB
  // =========================
  const submitCandidate = async (candidateId: number) => {
    const jobId = selectedJob[candidateId];

    if (!jobId) {
      alert('Please select a job');
      return;
    }

    try {
      setSubmittingId(candidateId);

      await api.post(
        `/candidates/${candidateId}/submit/${jobId}`,
      );

      // 🔥 Instant UI update
      setCandidates((prev) =>
        prev.map((c) =>
          c.id === candidateId
            ? {
                ...c,
                status: 'SUBMITTED',
                job: jobs.find((j) => j.id === jobId),
              }
            : c,
        ),
      );
    } catch (err) {
      console.error(err);
      alert('Failed to submit candidate');
    } finally {
      setSubmittingId(null);
    }
  };

  // =========================
  // UI
  // =========================
  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">
            Candidate Management
          </h1>
          <p className="text-gray-500">
            Track candidates and their job submissions
          </p>
        </div>

        <button
          onClick={() => navigate('/vendor/candidates/create')}
          className="px-4 py-2 bg-emerald-600 text-white rounded-md text-sm"
        >
          + Create Candidate
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        {loading ? (
          <div className="p-6 text-center">Loading…</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-green-100">
              <tr>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Contact</th>
                <th className="px-4 py-3 text-left">City</th>
                <th className="px-4 py-3 text-left">Experience</th>
                <th className="px-4 py-3 text-left">Created On</th>
                <th className="px-4 py-3 text-left">Submitted Job</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Submit</th>
              </tr>
            </thead>

            <tbody>
              {candidates.map((c) => (
                <tr
                  key={c.id}
                  className="border-t hover:bg-gray-50"
                >
                  <td className="px-4 py-3 font-medium">
                    {c.name}
                  </td>

                  <td className="px-4 py-3">
                    {c.email}
                  </td>

                  <td className="px-4 py-3">
                    {c.phone}
                  </td>

                  <td className="px-4 py-3">
                    {c.city || '—'}
                  </td>

                  <td className="px-4 py-3">
                    {c.experience}
                  </td>

                  <td className="px-4 py-3">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </td>

                  {/* Job column */}
                  <td className="px-4 py-3">
                    {c.job ? c.job.title : '—'}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-700">
                      {c.status}
                    </span>
                  </td>

                  {/* Submit */}
                  <td className="px-4 py-3 space-x-2">
                    {c.status === 'NEW' ? (
                      <>
                        <select
                          className="border rounded px-2 py-1 text-sm"
                          value={selectedJob[c.id] || ''}
                          onChange={(e) =>
                            setSelectedJob({
                              ...selectedJob,
                              [c.id]: Number(e.target.value),
                            })
                          }
                        >
                          <option value="">
                            Select job
                          </option>
                          {jobs.map((j) => (
                            <option
                              key={j.id}
                              value={j.id}
                            >
                              {j.title}
                            </option>
                          ))}
                        </select>

                        <button
                          onClick={() => submitCandidate(c.id)}
                          disabled={submittingId === c.id}
                          className="text-emerald-600 font-medium text-sm"
                        >
                          {submittingId === c.id
                            ? 'Submitting…'
                            : 'Submit'}
                        </button>
                      </>
                    ) : (
                      <span className="text-green-600 font-medium">
                        Submitted
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default CandidateManagement;
