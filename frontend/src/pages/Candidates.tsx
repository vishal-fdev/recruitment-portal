import { useEffect, useState } from 'react';
import api from '../api/api';

type Job = {
  id: number;
  title: string;
};

export default function Candidates() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '',
    email: '',
    skills: '',
    experience: '',
    jobId: '',
  });

  /* =========================
     Load jobs assigned to vendor
     ========================= */
  useEffect(() => {
    api.get('/jobs')
      .then(res => setJobs(res.data))
      .catch(() => setError('Failed to load jobs'));
  }, []);

  /* =========================
     Handle form change
     ========================= */
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  /* =========================
     Submit candidate
     ========================= */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await api.post('/candidates', {
        name: form.name,
        email: form.email,
        skills: form.skills,
        experience: Number(form.experience),
        jobId: Number(form.jobId),
      });

      setSuccess('Candidate submitted successfully');

      setForm({
        name: '',
        email: '',
        skills: '',
        experience: '',
        jobId: '',
      });
    } catch (err) {
      setError('Failed to submit candidate');
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     UI
     ========================= */
  return (
    <div className="max-w-xl">
      <h2 className="text-xl font-semibold mb-4">
        Submit Candidate Profile
      </h2>

      {error && (
        <p className="mb-3 text-red-600">{error}</p>
      )}

      {success && (
        <p className="mb-3 text-green-600">{success}</p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="name"
          placeholder="Candidate Name"
          className="w-full border rounded px-3 py-2"
          value={form.name}
          onChange={handleChange}
          required
        />

        <input
          name="email"
          type="email"
          placeholder="Email"
          className="w-full border rounded px-3 py-2"
          value={form.email}
          onChange={handleChange}
          required
        />

        <input
          name="skills"
          placeholder="Skills (React, Java, etc.)"
          className="w-full border rounded px-3 py-2"
          value={form.skills}
          onChange={handleChange}
          required
        />

        <input
          name="experience"
          type="number"
          placeholder="Experience (years)"
          className="w-full border rounded px-3 py-2"
          value={form.experience}
          onChange={handleChange}
          required
        />

        <select
          name="jobId"
          className="w-full border rounded px-3 py-2"
          value={form.jobId}
          onChange={handleChange}
          required
        >
          <option value="">Select Job</option>
          {jobs.map(job => (
            <option key={job.id} value={job.id}>
              {job.title}
            </option>
          ))}
        </select>

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {loading ? 'Submitting...' : 'Submit Candidate'}
        </button>
      </form>
    </div>
  );
}
