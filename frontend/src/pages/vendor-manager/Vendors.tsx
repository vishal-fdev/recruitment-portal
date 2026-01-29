// frontend/src/vendor-manager/vendors.tsx
import { useEffect, useState } from 'react';
import CreateVendorModal from './CreateVendorModal';

interface Vendor {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
}

const Vendors = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem('token');

  // 🔹 Fetch vendors
  const fetchVendors = async () => {
    try {
      setLoading(true);

      const res = await fetch('http://localhost:3000/vendors', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error('Failed to fetch vendors');

      const data = await res.json();
      setVendors(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  // 🔹 Toggle vendor status
  const toggleStatus = async (id: string) => {
    try {
      await fetch(`http://localhost:3000/vendors/${id}/toggle`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      fetchVendors(); // ✅ realtime refresh
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Vendors</h1>
          <p className="text-sm text-gray-500">
            Manage vendor partners
          </p>
        </div>

        <button
          onClick={() => setShowCreate(true)}
          className="bg-emerald-600 text-white px-4 py-2 rounded-md text-sm"
        >
          + Add Vendor
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3">Vendor ID</th>
              <th className="text-left px-4 py-3">Name</th>
              <th className="text-left px-4 py-3">Email</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-right px-4 py-3">Action</th>
            </tr>
          </thead>

          <tbody>
            {vendors.map((v) => (
              <tr
                key={v.id}
                className="border-t hover:bg-gray-50"
              >
                <td className="px-4 py-3">
                  V-{v.id.slice(0, 4).toUpperCase()}
                </td>
                <td className="px-4 py-3">{v.name}</td>
                <td className="px-4 py-3">{v.email}</td>
                <td className="px-4 py-3">
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      v.isActive
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {v.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => toggleStatus(v.id)}
                    className="text-sm text-emerald-600 font-medium"
                  >
                    Toggle Status
                  </button>
                </td>
              </tr>
            ))}

            {!loading && vendors.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-6 text-center text-gray-500"
                >
                  No vendors found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create Vendor Modal */}
      {showCreate && (
        <CreateVendorModal
          onClose={() => setShowCreate(false)}
          onCreated={fetchVendors}
        />
      )}
    </div>
  );
};

export default Vendors;
