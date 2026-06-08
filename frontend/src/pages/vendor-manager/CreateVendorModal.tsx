import { useState } from 'react';
import {
  Box,
  Button,
  FormField,
  Grid,
  Layer,
  Select,
  Text,
  TextInput,
} from 'grommet';

const VENDOR_TYPE_OPTIONS = [
  'Training Vendor',
  'CWF Vendor',
  'Project Vendor',
];

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

const CreateVendorModal = ({ onClose, onCreated }: Props) => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    contactPerson: '',
    phone: '',
    country: '',
    state: '',
    city: '',
    address: '',
    taxId: '',
    vendorType: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const token = localStorage.getItem('token');

  const handleFieldChange = (field: keyof typeof form, value: string) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const submit = async () => {
    if (!form.name || !form.email || submitting) return;

    try {
      setSubmitting(true);
      const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

      const res = await fetch(`${API}/vendors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        throw new Error('Failed to create vendor');
      }

      onCreated();
      onClose();
    } catch (err) {
      console.error(err);
      alert('Failed to create vendor');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layer
      onClickOutside={onClose}
      onEsc={onClose}
      modal
      responsive={false}
    >
      <Box width="700px" pad="32px" gap="24px">
        <Text size="xlarge" weight={600}>
          Create Vendor Partner
        </Text>

        <Grid columns={['flex', 'flex']} gap="24px">
          <Field
            label="Vendor Name"
            value={form.name}
            onChange={(value) => handleFieldChange('name', value)}
          />
          <Field
            label="Vendor Email"
            value={form.email}
            onChange={(value) => handleFieldChange('email', value)}
          />
          <Field
            label="Contact Person"
            value={form.contactPerson}
            onChange={(value) => handleFieldChange('contactPerson', value)}
          />
          <Field
            label="Phone Number"
            value={form.phone}
            onChange={(value) => handleFieldChange('phone', value)}
          />
          <Field
            label="Country"
            value={form.country}
            onChange={(value) => handleFieldChange('country', value)}
          />
          <Field
            label="State"
            value={form.state}
            onChange={(value) => handleFieldChange('state', value)}
          />
          <Field
            label="City"
            value={form.city}
            onChange={(value) => handleFieldChange('city', value)}
          />
          <Field
            label="Address"
            value={form.address}
            onChange={(value) => handleFieldChange('address', value)}
          />
          <Field
            label="Tax ID / PAN"
            value={form.taxId}
            onChange={(value) => handleFieldChange('taxId', value)}
          />
          <FormField label="Vendor Type" margin="none">
            <Select
              options={VENDOR_TYPE_OPTIONS}
              value={form.vendorType || 'Select vendor type'}
              onChange={({ option }) => handleFieldChange('vendorType', option)}
            />
          </FormField>
        </Grid>

        <Box direction="row" justify="end" gap="16px">
          <Button label="Cancel" onClick={onClose} />
          <Button
            primary
            color="#01A982"
            label={submitting ? 'Creating...' : 'Create Vendor'}
            onClick={submit}
            disabled={submitting}
          />
        </Box>
      </Box>
    </Layer>
  );
};

const Field = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) => (
  <FormField label={label} margin="none">
    <TextInput value={value} onChange={(event) => onChange(event.target.value)} />
  </FormField>
);

export default CreateVendorModal;
