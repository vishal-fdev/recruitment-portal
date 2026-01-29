import { useState } from 'react';
import api from '../../api/api';

export default function CreateVendorModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!name || !email) {
      alert('Name and Email are required');
      return;
    }

    try {
      setSaving(true);
      await api.post('/vendors', { name, email });
      onCreated(); // refresh list
      onClose();   // close modal
    } catch (err) {
      console.error(err);
      alert('Failed to create vendor');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md p-6">
        <h2 className="text-lg font-semibold mb-4">
          Create Vendor
        </h2>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">
              Vendor Name
            </label>
            <input
              className="w-full h-10 border rounded px-3 mt-1"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium">
              Email
            </label>
            <input
              className="w-full h-10 border rounded px-3 mt-1"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded"
          >
            Cancel
          </button>

          <button
            onClick={submit}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}
