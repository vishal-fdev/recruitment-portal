import { useEffect, useState } from 'react';
import api from '../../api/api';
import CreateVendorModal from './CreateVendorModal';

type Vendor = {
  id: number;
  name: string;
  email: string;
  active: boolean;
};

export default function VendorList() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const loadVendors = async () => {
    try {
      setLoading(true);
      const res = await api.get('/vendors');
      setVendors(res.data);
    } catch (err) {
      console.error(err);
      alert('Failed to load vendors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVendors();
  }, []);

  const toggleVendor = async (vendor: Vendor) => {
    try {
      if (vendor.active) {
        await api.patch(`/vendors/${vendor.id}/deactivate`);
      } else {
        await api.patch(`/vendors/${vendor.id}/activate`);
      }
      loadVendors();
    } catch (err) {
      console.error(err);
      alert('Failed to update vendor status');
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">
          Vendors
        </h2>

        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Create Vendor
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <p className="text-gray-500">Loading vendors…</p>
      ) : (
        <table className="w-full border border-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-2 border-b">
                Name
              </th>
              <th className="text-left px-4 py-2 border-b">
                Email
              </th>
              <th className="text-left px-4 py-2 border-b">
                Status
              </th>
              <th className="px-4 py-2 border-b">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {vendors.map((v) => (
              <tr key={v.id}>
                <td className="px-4 py-2 border-b">
                  {v.name}
                </td>
                <td className="px-4 py-2 border-b">
                  {v.email}
                </td>
                <td className="px-4 py-2 border-b">
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      v.active
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {v.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-2 border-b text-center">
                  <button
                    onClick={() => toggleVendor(v)}
                    className="text-blue-600 hover:underline"
                  >
                    {v.active
                      ? 'Deactivate'
                      : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showCreate && (
        <CreateVendorModal
          onClose={() => setShowCreate(false)}
          onCreated={loadVendors}
        />
      )}
    </div>
  );
}
