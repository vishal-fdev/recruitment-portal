import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api';

interface Vendor {
  id: string;
  email: string;
}

const CreateJob = () => {
  const navigate = useNavigate();

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    location: '',
    experience: '',
    isActive: true,
  });

  // ============================
  // FETCH VENDORS (FIXED)
  // ============================
  useEffect(() => {
    api
      .get('/vendors')
      .then((res) => setVendors(res.data))
      .catch(() => {
        setError('Unable to load vendors');
      });
  }, []);

  // ============================
  // SUBMIT JOB
  // ============================
  const submit = async () => {
    setError(null);

    if (!form.title || !form.location || !form.experience) {
      setError('Title, Location and Experience are required');
      return;
    }

    try {
      setLoading(true);

      await api.post('/jobs', {
        ...form,
        vendorIds: selectedVendors,
      });

      navigate('/vendor-manager/jobs');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Job creation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-4">
      <h1 className="text-2xl font-semibold">
        Create Job
      </h1>

      {error && (
        <div className="bg-red-100 text-red-700 p-2 rounded text-sm">
          {error}
        </div>
      )}

      <input
        placeholder="Job Title *"
        className="w-full border p-2 rounded"
        value={form.title}
        onChange={(e) =>
          setForm({ ...form, title: e.target.value })
        }
      />

      <textarea
        placeholder="Description"
        className="w-full border p-2 rounded"
        value={form.description}
        onChange={(e) =>
          setForm({
            ...form,
            description: e.target.value,
          })
        }
      />

      <input
        placeholder="Location *"
        className="w-full border p-2 rounded"
        value={form.location}
        onChange={(e) =>
          setForm({ ...form, location: e.target.value })
        }
      />

      <input
        placeholder="Experience (e.g. 5–8 yrs) *"
        className="w-full border p-2 rounded"
        value={form.experience}
        onChange={(e) =>
          setForm({
            ...form,
            experience: e.target.value,
          })
        }
      />

      <div>
        <h3 className="font-medium mb-2">
          Assign Vendors
        </h3>

        {vendors.length === 0 && (
          <p className="text-sm text-gray-500">
            No vendors available
          </p>
        )}

        {vendors.map((v) => (
          <label
            key={v.id}
            className="block text-sm"
          >
            <input
              type="checkbox"
              className="mr-2"
              checked={selectedVendors.includes(v.id)}
              onChange={(e) =>
                e.target.checked
                  ? setSelectedVendors([
                      ...selectedVendors,
                      v.id,
                    ])
                  : setSelectedVendors(
                      selectedVendors.filter(
                        (id) => id !== v.id,
                      ),
                    )
              }
            />
            {v.email}
          </label>
        ))}
      </div>

      <div className="flex gap-3">
        <button
          disabled={loading}
          onClick={submit}
          className="bg-emerald-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? 'Creating…' : 'Create Job'}
        </button>

        <button
          onClick={() =>
            navigate('/vendor-manager/jobs')
          }
          className="border px-4 py-2 rounded"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default CreateJob;
