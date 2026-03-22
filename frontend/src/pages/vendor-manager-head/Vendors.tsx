import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api';
import CreateVendorModal from '../../vendor-manager/vendors/CreateVendorModal';

interface Vendor {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
}

const Vendors = () => {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [showCreate, setShowCreate] = useState(false);

  const fetchVendors = async () => {
    const res = await api.get('/vendors');
    setVendors(res.data);
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const toggleStatus = async (id: string) => {
    await api.patch(`/vendors/${id}/toggle`);
    fetchVendors();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <h1 className="text-2xl font-semibold">Vendors</h1>

        <button
          onClick={() => setShowCreate(true)}
          className="bg-emerald-600 text-white px-4 py-2 rounded-md"
        >
          + Add Vendor
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>

          <tbody>
            {vendors.map((v) => (
              <tr key={v.id} className="border-t">
                <td className="px-4 py-3">
                  <button
                    onClick={() =>
                      navigate(`/vendor-manager-head/vendors/${v.id}`)
                    }
                    className="text-blue-600 hover:underline font-medium"
                  >
                    {v.name}
                  </button>
                </td>

                <td className="px-4 py-3">{v.email}</td>

                <td className="px-4 py-3">
                  {v.isActive ? 'Active' : 'Inactive'}
                </td>

                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => toggleStatus(v.id)}
                    className="text-emerald-600 text-sm"
                  >
                    Toggle
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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