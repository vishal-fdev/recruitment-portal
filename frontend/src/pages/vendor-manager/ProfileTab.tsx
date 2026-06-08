import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Button, Card, CardBody, Grid, Heading, Text, TextInput } from 'grommet';
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

const ProfileTab = () => {
  const { id } = useParams();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [form, setForm] = useState<Vendor | null>(null);
  const [editing, setEditing] = useState(false);

  const fetchVendor = async () => {
    const res = await api.get(`/vendors/${id}`);
    setVendor(res.data);
    setForm(res.data);
  };

  useEffect(() => {
    if (id) void fetchVendor();
  }, [id]);

  if (!vendor || !form) return <Box pad="large"><Text>Loading...</Text></Box>;

  const handleChange = (field: keyof Vendor, value: string) => {
    setForm({ ...form, [field]: value });
  };

  const saveVendor = async () => {
    await api.patch(`/vendors/${id}`, form);
    setEditing(false);
    void fetchVendor();
  };

  const cancelEdit = () => {
    setForm(vendor);
    setEditing(false);
  };

  return (
    <Card background="white" round="20px" border={{ color: 'border-weak' }} elevation="xsmall">
      <CardBody pad="large" gap="medium">
        <Box direction="row" justify="between" align="center" wrap gap="medium">
          <Heading level={3} size="small" margin="none">
            Profile
          </Heading>
          {!editing ? (
            <Button label="Edit" onClick={() => setEditing(true)} />
          ) : (
            <Box direction="row" gap="small">
              <Button label="Save" primary color="brand" onClick={() => void saveVendor()} />
              <Button label="Cancel" onClick={cancelEdit} />
            </Box>
          )}
        </Box>

        <Grid columns={{ count: 'fit', size: ['medium', 'medium'] }} gap="medium">
          <Field label="Partner Name" value={form.name} editing={editing} onChange={(v) => handleChange('name', v)} />
          <Field label="Alias" value={form.alias} editing={editing} onChange={(v) => handleChange('alias', v)} />
          <Field label="Email" value={form.email} editing={editing} onChange={(v) => handleChange('email', v)} />
          <Field label="Origin Country" value={form.originCountry} editing={editing} onChange={(v) => handleChange('originCountry', v)} />
          <Field label="Origin City" value={form.originCity} editing={editing} onChange={(v) => handleChange('originCity', v)} />
          <Field label="Registered Address" value={form.registeredAddress} editing={editing} onChange={(v) => handleChange('registeredAddress', v)} />
          <Field label="Partner Category" value={form.partnerCategory} editing={editing} onChange={(v) => handleChange('partnerCategory', v)} />
          <Field label="Tier Category" value={form.tierCategory} editing={editing} onChange={(v) => handleChange('tierCategory', v)} />
          <Field label="Domain" value={form.domain} editing={editing} onChange={(v) => handleChange('domain', v)} />
          <Field label="Skills" value={form.skills} editing={editing} onChange={(v) => handleChange('skills', v)} />
          <Field label="Pincode" value={form.pincode} editing={editing} onChange={(v) => handleChange('pincode', v)} />
        </Grid>
      </CardBody>
    </Card>
  );
};

const Field = ({
  label,
  value,
  editing,
  onChange,
}: {
  label: string;
  value?: string;
  editing: boolean;
  onChange: (v: string) => void;
}) => (
  <Box gap="xsmall">
    <Text size="small" color="text-paragraph">
      {label}
    </Text>
    {editing ? (
      <TextInput value={value || ''} onChange={(e) => onChange(e.target.value)} />
    ) : (
      <Box background="#F8FAFC" border={{ color: 'border-weak' }} round="small" pad={{ horizontal: 'small', vertical: 'small' }}>
        <Text>{value || '-'}</Text>
      </Box>
    )}
  </Box>
);

export default ProfileTab;
