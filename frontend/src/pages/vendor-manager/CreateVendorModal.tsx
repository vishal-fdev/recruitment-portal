import { useState } from 'react';

const VENDOR_TYPE_OPTIONS = [
  'Training Vendor',
  'CWF Vendor',
  'Project Vendor',
];

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

const CreateVendorModal = ({ onClose, onCreated }: Props) => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    contactPerson: '',
    phone: '',
    country: '',
    state: '',
    city: '',
    address: '',
    taxId: '',
    vendorType: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const token = localStorage.getItem('token');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const submit = async () => {
    if (!form.name || !form.email || submitting) return;

    try {
      setSubmitting(true);

      const API =
  import.meta.env.VITE_API_URL || 'http://localhost:3000';

const res = await fetch(`${API}/vendors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        throw new Error('Failed to create vendor');
      }

      onCreated();
      onClose();
    } catch (err) {
      console.error(err);
      alert('Failed to create vendor');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-[700px] rounded-lg p-8 max-h-[90vh] overflow-auto">
        <h2 className="text-xl font-semibold mb-6">
          Create Vendor Partner
        </h2>

        <div className="grid grid-cols-2 gap-6">
          <Input label="Vendor Name" name="name" value={form.name} onChange={handleChange} />
          <Input label="Vendor Email" name="email" value={form.email} onChange={handleChange} />
          <Input label="Contact Person" name="contactPerson" value={form.contactPerson} onChange={handleChange} />
          <Input label="Phone Number" name="phone" value={form.phone} onChange={handleChange} />
          <Input label="Country" name="country" value={form.country} onChange={handleChange} />
          <Input label="State" name="state" value={form.state} onChange={handleChange} />
          <Input label="City" name="city" value={form.city} onChange={handleChange} />
          <Input label="Address" name="address" value={form.address} onChange={handleChange} />
          <Input label="Tax ID / PAN" name="taxId" value={form.taxId} onChange={handleChange} />
          <Select
            label="Vendor Type"
            name="vendorType"
            value={form.vendorType}
            onChange={handleChange}
            options={VENDOR_TYPE_OPTIONS}
          />
        </div>

        <div className="flex justify-end gap-4 mt-8">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-md text-sm"
          >
            Cancel
          </button>

          <button
            disabled={submitting}
            onClick={submit}
            className="px-5 py-2 bg-emerald-600 text-white rounded-md text-sm disabled:opacity-60"
          >
            {submitting ? 'Creating…' : 'Create Vendor'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateVendorModal;

const Input = ({
  label,
  name,
  value,
  onChange,
}: any) => (
  <div>
    <label className="block text-sm font-medium mb-1">
      {label}
    </label>
    <input
      name={name}
      value={value}
      onChange={onChange}
      className="w-full border rounded-md px-3 py-2"
    />
  </div>
);

const Select = ({
  label,
  name,
  value,
  onChange,
  options,
}: any) => (
  <div>
    <label className="block text-sm font-medium mb-1">
      {label}
    </label>
    <select
      name={name}
      value={value}
      onChange={onChange}
      className="w-full border rounded-md px-3 py-2"
    >
      <option value="">Select vendor type</option>
      {options.map((option: string) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  </div>
);
