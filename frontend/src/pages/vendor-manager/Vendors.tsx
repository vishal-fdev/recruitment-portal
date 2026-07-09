import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Text } from 'grommet';
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
    <Box gap="26px">
      <Box direction="row" justify="between" align="center" wrap gap="medium">
        <Text size="26px" weight={600} color="#0B1220" style={{ lineHeight: 1.12 }}>
          Vendors
        </Text>
        <Button
          label="+ Add Vendor"
          primary
          color="brand"
          onClick={() => setShowCreate(true)}
          style={greenButtonStyle}
        />
      </Box>

      <Box gap="16px">
        {vendors.length === 0 && (
          <Box
            background="white"
            round="20px"
            border={{ color: '#DDE3EB' }}
            height="110px"
            align="center"
            justify="center"
            style={{ boxShadow: '0 2px 6px rgba(15, 23, 42, 0.06)' }}
          >
            <Text size="14px" color="#526179">
              No vendors.
            </Text>
          </Box>
        )}

        {vendors.map((vendor) => (
          <Box
            key={vendor.id}
            background="white"
            round="24px"
            border={{ color: '#DDE3EB' }}
            elevation="xsmall"
            onClick={() => navigate(`/vendor-manager/vendors/${vendor.id}`)}
            pad={{ horizontal: '24px', vertical: '24px' }}
            gap="22px"
            style={{ boxShadow: '0 2px 7px rgba(15, 23, 42, 0.07)', cursor: 'pointer' }}
          >
            <Box direction="row" justify="between" align="start" gap="medium" wrap>
              <Box gap="6px">
                <Text size="21px" weight={600} color="#0B1220">
                  {vendor.name}
                </Text>
                <Text size="14px" color="#526179">
                  {vendor.email}
                </Text>
              </Box>
              <Button
                label="Toggle"
                onClick={(event) => {
                  event.stopPropagation();
                  void toggleStatus(vendor.id);
                }}
                style={toggleButtonStyle}
              />
            </Box>

            <div style={infoGridStyle}>
              <Info label="Vendor ID" value={vendor.id} />
              <Info label="Status" value={vendor.isActive ? 'Active' : 'Inactive'} />
              <Info label="Profile" value="Open details" />
            </div>
          </Box>
        ))}
      </Box>

      {showCreate ? <CreateVendorModal onClose={() => setShowCreate(false)} onCreated={fetchVendors} /> : null}
    </Box>
  );
};

const Info = ({ label, value }: { label: string; value: string }) => (
  <Box background="#F8FAFC" round="16px" pad={{ horizontal: '16px', vertical: '13px' }} style={{ minHeight: 64 }}>
    <Text size="12px" weight={600} color="#9AA6BD" style={{ letterSpacing: '0.08em' }}>
      {label.toUpperCase()}
    </Text>
    <Text margin={{ top: '8px' }} size="14px" weight={600} color="#0B1220">
      {value}
    </Text>
  </Box>
);

const greenButtonStyle = {
  color: '#FFFFFF',
  background: '#01A982',
  border: 'none',
  borderRadius: '14px',
  fontWeight: 600,
  padding: '11px 20px',
} as const;

const toggleButtonStyle = {
  color: '#01A982',
  background: '#FFFFFF',
  border: '1px solid #D7DEE9',
  borderRadius: '12px',
  fontWeight: 600,
  padding: '9px 18px',
} as const;

const infoGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: 16,
  width: '100%',
} as const;

export default Vendors;
