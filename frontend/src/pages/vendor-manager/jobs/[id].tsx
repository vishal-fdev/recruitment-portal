import { useParams } from 'react-router-dom';
import { useState } from 'react';

const vendors = [
  { id: 'V-01', name: 'TeamLease' },
  { id: 'V-02', name: 'ABC Staffing' },
  { id: 'V-03', name: 'XYZ Partners' },
];

const JobDetails = () => {
  const { id } = useParams();
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (vendorId: string) => {
    setSelected((prev) =>
      prev.includes(vendorId)
        ? prev.filter((v) => v !== vendorId)
        : [...prev, vendorId]
    );
  };

  const openJob = () => {
    console.log(
      'Opening job',
      id,
      'to vendors',
      selected
    );
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-semibold">
        Manage Job – {id}
      </h1>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-sm font-medium mb-4">
          Open job to vendors
        </h2>

        <div className="space-y-3">
          {vendors.map((v) => (
            <label
              key={v.id}
              className="flex items-center gap-3"
            >
              <input
                type="checkbox"
                checked={selected.includes(v.id)}
                onChange={() => toggle(v.id)}
              />
              <span>{v.name}</span>
            </label>
          ))}
        </div>

        <button
          onClick={openJob}
          className="mt-6 bg-emerald-600 text-white px-4 py-2 rounded-md text-sm"
        >
          Open Job to Selected Vendors
        </button>
      </div>
    </div>
  );
};

export default JobDetails;
