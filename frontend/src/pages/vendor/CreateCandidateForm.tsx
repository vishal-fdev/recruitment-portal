import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LOCATION_DATA } from '../../constants/location';
import { createCandidate } from '../../services/candidateService';
import './CreateCandidateForm.css';

const CreateCandidateForm = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === 'country') {
      const stateList = Object.keys(LOCATION_DATA[value] || {});
      setStates(stateList);
      setCities([]);
      setForm((prev) => ({
        ...prev,
        state: '',
        city: '',
      }));
    }

    if (name === 'state') {
      const cityList =
        LOCATION_DATA[form.country]?.[value] || [];
      setCities(cityList);
      setForm((prev) => ({
        ...prev,
        city: '',
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!resume) {
      alert('Resume is required');
      return;
    }

    try {
      setSubmitting(true);

      const data = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        data.append(key, String(value));
      });
      data.append('resume', resume);

      await createCandidate(data);
      navigate('/vendor/candidates', { replace: true });
    } catch (error) {
      console.error(error);
      alert('Failed to create candidate');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    // 🔥 FULL WIDTH CONTAINER
    <div className="w-full">
      <div className="bg-white rounded-xl shadow p-8">
        <h2 className="text-2xl font-semibold mb-6">
          Create Candidate
        </h2>

        <form className="candidate-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <FormField label="Full Name *">
              <input name="name" value={form.name} onChange={handleChange} required />
            </FormField>

            <FormField label="Phone Number *">
              <input name="phone" value={form.phone} onChange={handleChange} required />
            </FormField>

            <FormField label="Email *">
              <input type="email" name="email" value={form.email} onChange={handleChange} required />
            </FormField>

            <FormField label="Primary Skills *">
              <input name="primarySkills" value={form.primarySkills} onChange={handleChange} required />
            </FormField>

            <FormField label="Secondary Skills">
              <input name="secondarySkills" value={form.secondarySkills} onChange={handleChange} />
            </FormField>

            <FormField label="Country *">
              <select name="country" value={form.country} onChange={handleChange} required>
                <option value="">Select country</option>
                <option value="India">India</option>
              </select>
            </FormField>

            <FormField label="State *">
              <select name="state" value={form.state} onChange={handleChange} required disabled={!states.length}>
                <option value="">Select state</option>
                {states.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </FormField>

            <FormField label="City *">
              <select name="city" value={form.city} onChange={handleChange} required disabled={!cities.length}>
                <option value="">Select city</option>
                {cities.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </FormField>

            <FormField label="Relevant Experience (Years) *">
              <input name="experience" value={form.experience} onChange={handleChange} required />
            </FormField>

            <FormField label="Notice Period (Days)">
              <input name="noticePeriod" value={form.noticePeriod} onChange={handleChange} />
            </FormField>

            <FormField label="Current / Last Organization *">
              <input name="currentOrg" value={form.currentOrg} onChange={handleChange} required />
            </FormField>

            <FormField label="Resume *">
              <input type="file" onChange={(e) => setResume(e.target.files?.[0] || null)} required />
            </FormField>
          </div>

          <div className="form-actions">
            <button type="button" onClick={() => navigate(-1)} disabled={submitting}>
              Cancel
            </button>

            <button type="submit" className="primary" disabled={submitting}>
              {submitting ? 'Submitting…' : 'Submit'}
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
