// frontend/src/vendor-manager/CreateVendorModal.tsx
import { useState } from 'react';

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

const CreateVendorModal = ({ onClose, onCreated }: Props) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const token = localStorage.getItem('token');

  const submit = async () => {
    if (!name || !email || submitting) return;

    try {
      setSubmitting(true);

      const res = await fetch('http://localhost:3000/vendors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, email }),
      });

      if (!res.ok) {
        throw new Error('Failed to create vendor');
      }

      onCreated(); // ✅ refresh vendor list
      onClose();   // ✅ close modal
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-[420px] rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">
          Add Vendor
        </h2>

        <div className="space-y-4">
          <div>
            <label className="text-sm block mb-1">
              Vendor Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border p-2 rounded"
            />
          </div>

          <div>
            <label className="text-sm block mb-1">
              Vendor Email
            </label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border p-2 rounded"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded text-sm"
          >
            Cancel
          </button>

          <button
            disabled={submitting}
            onClick={submit}
            className="px-4 py-2 bg-emerald-600 text-white rounded text-sm disabled:opacity-60"
          >
            {submitting ? 'Adding...' : 'Add Vendor'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateVendorModal;
