import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import api from '../../api/api';
import { LOCATION_DATA } from '../../constants/location';
import './CreateCandidateForm.css';

interface Job {
  id: number;
  title: string;
  positions?: {
    id: number;
    level: string;
    status: string;
  }[];
}

const CreateCandidateForm = () => {
  const navigate = useNavigate();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const [form, setForm] = useState({
    jobId: '',
    positionId: '',
    name: '',
    email: '',
    phone: '',
    primarySkills: '',
    secondarySkills: '',
    country: '',
    state: '',
    city: '',
    experience: '',
    noticePeriod: '',
    currentOrg: '',
  });

  const [states, setStates] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [resume, setResume] = useState<File | null>(null);

  const [submitting, setSubmitting] = useState(false);

  const [duplicateError, setDuplicateError] = useState('');

  /* ================= LOAD JOBS ================= */

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await api.get('/jobs');
        setJobs(res.data);
      } catch {
        alert('Failed to load jobs');
      }
    };

    fetchJobs();
  }, []);

  /* ================= DUPLICATE CHECK ================= */

  const checkDuplicate = async (email: string, phone: string) => {
    try {

      const res = await api.get(
        `/candidates/check-duplicate`,
        {
          params: { email, phone },
        },
      );

      if (res.data.exists) {

        if (res.data.field === 'email') {
          setDuplicateError(
            'Candidate with this email already exists',
          );
        } else {
          setDuplicateError(
            'Candidate with this phone number already exists',
          );
        }

        return true;
      }

      setDuplicateError('');
      return false;

    } catch {
      return false;
    }
  };

  /* ================= HANDLERS ================= */

  const handleChange = async (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {

    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === 'email' || name === 'phone') {

      if (form.email && form.phone) {
        await checkDuplicate(
          name === 'email' ? value : form.email,
          name === 'phone' ? value : form.phone,
        );
      }
    }

    if (name === 'jobId') {

      const job = jobs.find((j) => j.id === Number(value));

      setSelectedJob(job || null);

      setForm((prev) => ({
        ...prev,
        jobId: value,
        positionId: '',
      }));
    }

    if (name === 'country') {

      const stateList = Object.keys(
        LOCATION_DATA[value] || {},
      );

      setStates(stateList);
      setCities([]);
    }

    if (name === 'state') {

      const cityList =
        LOCATION_DATA[form.country]?.[value] || [];

      setCities(cityList);
    }
  };

  /* ================= SUBMIT ================= */

  const handleSubmit = async (e: React.FormEvent) => {

    e.preventDefault();

    if (duplicateError) {
      alert(duplicateError);
      return;
    }

    if (!resume) {
      alert('Resume is required');
      return;
    }

    if (!form.jobId) {
      alert('Please select a job');
      return;
    }

    if (
      selectedJob?.positions?.length &&
      !form.positionId
    ) {
      alert('Please select position level');
      return;
    }

    try {

      setSubmitting(true);

      const duplicate = await checkDuplicate(
        form.email,
        form.phone,
      );

      if (duplicate) {
        setSubmitting(false);
        return;
      }

      const data = new FormData();

      Object.entries(form).forEach(([key, value]) => {
        if (value) data.append(key, String(value));
      });

      data.append('resume', resume);

      await api.post('/candidates', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      navigate('/vendor/candidates', { replace: true });

    } catch (error) {
      console.error(error);
      alert('Failed to create candidate');
    } finally {
      setSubmitting(false);
    }
  };

  /* ================= UI ================= */

  return (

    <div className="w-full space-y-4">

      <button
        type="button"
        onClick={() => navigate('/vendor/candidates')}
        className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600"
      >
        <ArrowLeft size={16} />
        Back
      </button>

      <div className="bg-white rounded-xl shadow p-8">

        <h2 className="text-2xl font-semibold mb-6">
          Submit Candidate
        </h2>

        <form
          className="candidate-form"
          onSubmit={handleSubmit}
        >

          <div className="form-grid">

            <FormField label="Select Job *">
              <select
                name="jobId"
                value={form.jobId}
                onChange={handleChange}
                required
              >
                <option value="">Select Job</option>
                {jobs.map((job) => (
                  <option key={job.id} value={job.id}>
                    HRQ{job.id} - {job.title}
                  </option>
                ))}
              </select>
            </FormField>

            {selectedJob?.positions &&
              selectedJob.positions.length > 0 && (
                <FormField label="Position Level *">
                  <select
                    name="positionId"
                    value={form.positionId}
                    onChange={handleChange}
                    required
                  >
                    <option value="">
                      Select Level
                    </option>

                    {selectedJob.positions.map((pos) => (
                      <option
                        key={pos.id}
                        value={pos.id}
                      >
                        {pos.level}
                      </option>
                    ))}
                  </select>
                </FormField>
              )}

            <FormField label="Full Name *">
              <input
                name="name"
                onChange={handleChange}
                required
              />
            </FormField>

            <FormField label="Phone Number *">
              <input
                name="phone"
                onChange={handleChange}
                required
              />
            </FormField>

            <FormField label="Email *">
              <input
                type="email"
                name="email"
                onChange={handleChange}
                required
              />
            </FormField>

            {duplicateError && (
              <div className="duplicate-error">
                {duplicateError}
              </div>
            )}

            <FormField label="Primary Skills *">
              <input
                name="primarySkills"
                onChange={handleChange}
                required
              />
            </FormField>

            <FormField label="Secondary Skills">
              <input
                name="secondarySkills"
                onChange={handleChange}
              />
            </FormField>

            <FormField label="Country *">
              <select
                name="country"
                onChange={handleChange}
                required
              >
                <option value="">
                  Select country
                </option>
                <option value="India">India</option>
              </select>
            </FormField>

            <FormField label="State *">
              <select
                name="state"
                onChange={handleChange}
                required
              >
                <option value="">
                  Select state
                </option>

                {states.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </FormField>

            <FormField label="City *">
              <select
                name="city"
                onChange={handleChange}
                required
              >
                <option value="">
                  Select city
                </option>

                {cities.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </FormField>

            <FormField label="Experience (Years) *">
              <input
                name="experience"
                onChange={handleChange}
                required
              />
            </FormField>

            <FormField label="Notice Period">
              <input
                name="noticePeriod"
                onChange={handleChange}
              />
            </FormField>

            <FormField label="Current Organization *">
              <input
                name="currentOrg"
                onChange={handleChange}
                required
              />
            </FormField>

            <FormField label="Resume *">
              <input
                type="file"
                onChange={(e) =>
                  setResume(
                    e.target.files?.[0] || null,
                  )
                }
                required
              />
            </FormField>

          </div>

          <div className="form-actions">

            <button
              type="button"
              onClick={() => navigate(-1)}
              disabled={submitting}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="primary"
              disabled={submitting}
            >
              {submitting
                ? 'Submitting…'
                : 'Submit'}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
};

const FormField = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div className="form-field">
    <label>{label}</label>
    {children}
  </div>
);

export default CreateCandidateForm;
