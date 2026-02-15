import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api/api';

interface Vendor {
  id: string;
  name: string;
  email: string;
  alias?: string;
  originCountry?: string;
  originCity?: string;
  domain?: string;
  skills?: string;
  registeredAddress?: string;
  partnerCategory?: string;
  tierCategory?: string;
  pincode?: string;
  isActive: boolean;
}

const VendorDetails = () => {
  const { id } = useParams();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [tab, setTab] = useState('profile');

  useEffect(() => {
    if (!id) return;
    api.get(`/vendors/${id}`).then((res) => {
      setVendor(res.data);
    });
  }, [id]);

  if (!vendor) return <p>Loading...</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{vendor.name}</h1>

      <div className="flex gap-6 border-b pb-2">
        {['profile', 'escalation', 'engagement', 'sow'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`capitalize ${
              tab === t
                ? 'border-b-2 border-emerald-600 text-emerald-600'
                : 'text-gray-500'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <div className="bg-white shadow rounded-lg p-6 grid grid-cols-2 gap-6">
          <Detail label="Email" value={vendor.email} />
          <Detail label="Alias" value={vendor.alias} />
          <Detail label="Origin Country" value={vendor.originCountry} />
          <Detail label="Origin City" value={vendor.originCity} />
          <Detail label="Domain" value={vendor.domain} />
          <Detail label="Skills" value={vendor.skills} />
          <Detail label="Partner Category" value={vendor.partnerCategory} />
          <Detail label="Tier Category" value={vendor.tierCategory} />
          <Detail label="Pincode" value={vendor.pincode} />
          <Detail label="Status" value={vendor.isActive ? 'Active' : 'Inactive'} />
        </div>
      )}

      {tab !== 'profile' && (
        <div className="bg-white shadow rounded-lg p-6 text-gray-500">
          Enterprise sections placeholder.
        </div>
      )}
    </div>
  );
};

export default VendorDetails;

const Detail = ({ label, value }: any) => (
  <div>
    <p className="text-sm text-gray-500">{label}</p>
    <p className="font-medium">{value || '-'}</p>
  </div>
);
