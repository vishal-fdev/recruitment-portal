import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

const CreateJob = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: '',
    location: '',
    experience: '',
    description: '',
  });

  const submit = () => {
    console.log('Create job:', form);
    navigate('/vendor-manager/jobs');
  };

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold">
        Create Job
      </h1>

      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <Input
          label="Job Title"
          value={form.title}
          onChange={(v) =>
            setForm({ ...form, title: v })
          }
        />
        <Input
          label="Location"
          value={form.location}
          onChange={(v) =>
            setForm({ ...form, location: v })
          }
        />
        <Input
          label="Experience"
          value={form.experience}
          onChange={(v) =>
            setForm({ ...form, experience: v })
          }
        />

        <div>
          <label className="text-sm font-medium">
            Job Description
          </label>
          <textarea
            className="w-full border rounded-md p-3 mt-1"
            rows={4}
            value={form.description}
            onChange={(e) =>
              setForm({
                ...form,
                description: e.target.value,
              })
            }
          />
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={() =>
              navigate('/vendor-manager/jobs')
            }
            className="px-4 py-2 border rounded-md text-sm"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            className="px-4 py-2 bg-emerald-600 text-white rounded-md text-sm"
          >
            Create Job
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateJob;

/* ---- */

const Input = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) => (
  <div>
    <label className="text-sm font-medium">
      {label}
    </label>
    <input
      className="w-full h-10 border rounded-md px-3 mt-1"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  </div>
);
