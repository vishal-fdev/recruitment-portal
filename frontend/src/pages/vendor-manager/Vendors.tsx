import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api';
import CreateVendorModal from './CreateVendorModal';

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
    setVendors(res.data || []);
  };

  useEffect(() => {
    void fetchVendors();
  }, []);

  const toggleStatus = async (id: string) => {
    await api.patch(`/vendors/${id}/toggle`);
    await fetchVendors();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <h1 className="text-2xl font-semibold">Vendors</h1>
        <button onClick={() => setShowCreate(true)} className="rounded-[14px] bg-[#01A982] px-4 py-2 text-white">
          + Add Vendor
        </button>
      </div>

      <div className="space-y-4">
        {vendors.map((vendor) => (
          <button
            key={vendor.id}
            type="button"
            onClick={() => navigate(`/vendor-manager/vendors/${vendor.id}`)}
            className="w-full rounded-[24px] border border-black/8 bg-white p-6 text-left shadow-[0_8px_24px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(15,23,42,0.08)]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-[#0F172A]">{vendor.name}</h2>
                <p className="mt-1 text-sm text-[#64748B]">{vendor.email}</p>
              </div>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  void toggleStatus(vendor.id);
                }}
                className="rounded-[12px] border border-[#D6DCE5] px-4 py-2 text-sm font-medium text-[#01A982]"
              >
                Toggle
              </button>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-3">
              <Info label="Vendor ID" value={vendor.id} />
              <Info label="Status" value={vendor.isActive ? 'Active' : 'Inactive'} />
              <Info label="Profile" value="Open details" />
            </div>
          </button>
        ))}
      </div>

      {showCreate && <CreateVendorModal onClose={() => setShowCreate(false)} onCreated={fetchVendors} />}
    </div>
  );
};

const Info = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-[16px] bg-[#F8FAFC] px-4 py-3">
    <div className="text-xs font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">{label}</div>
    <div className="mt-1 text-sm font-medium text-[#0F172A]">{value}</div>
  </div>
);

export default Vendors;
