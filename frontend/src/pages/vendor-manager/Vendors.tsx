import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Card, CardBody, Heading, Text } from 'grommet';
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
    <Box gap="medium">
      <Box direction="row" justify="between" align="center" wrap gap="medium">
        <Heading level={2} margin="none">
          Vendors
        </Heading>
        <Button label="+ Add Vendor" primary color="brand" onClick={() => setShowCreate(true)} />
      </Box>

      <Box gap="medium">
        {vendors.map((vendor) => (
          <Card
            key={vendor.id}
            background="white"
            round="24px"
            border={{ color: 'border-weak' }}
            elevation="xsmall"
            onClick={() => navigate(`/vendor-manager/vendors/${vendor.id}`)}
          >
            <CardBody pad="large" gap="medium">
              <Box direction="row" justify="between" align="start" gap="medium" wrap>
                <Box>
                  <Heading level={3} size="small" margin="none">
                    {vendor.name}
                  </Heading>
                  <Text color="text-paragraph">{vendor.email}</Text>
                </Box>
                <Button
                  label="Toggle"
                  onClick={(event) => {
                    event.stopPropagation();
                    void toggleStatus(vendor.id);
                  }}
                />
              </Box>

              <Box direction="row" wrap gap="small">
                <Info label="Vendor ID" value={vendor.id} />
                <Info label="Status" value={vendor.isActive ? 'Active' : 'Inactive'} />
                <Info label="Profile" value="Open details" />
              </Box>
            </CardBody>
          </Card>
        ))}
      </Box>

      {showCreate ? <CreateVendorModal onClose={() => setShowCreate(false)} onCreated={fetchVendors} /> : null}
    </Box>
  );
};

const Info = ({ label, value }: { label: string; value: string }) => (
  <Box background="#F8FAFC" round="16px" pad={{ horizontal: 'medium', vertical: 'small' }} width="220px">
    <Text size="xsmall" weight="bold" color="#94A3B8">
      {label}
    </Text>
    <Text margin={{ top: 'xsmall' }} weight="bold">
      {value}
    </Text>
  </Box>
);

export default Vendors;
