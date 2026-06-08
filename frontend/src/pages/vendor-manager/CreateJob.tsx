import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  CheckBox,
  FormField,
  Heading,
  Text,
  TextArea,
  TextInput,
} from 'grommet';
import api from '../../api/api';

interface Vendor {
  id: string;
  email: string;
}

const CreateJob = () => {
  const navigate = useNavigate();

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    location: '',
    experience: '',
    isActive: true,
  });

  useEffect(() => {
    api
      .get('/vendors')
      .then((res) => setVendors(res.data))
      .catch(() => {
        setError('Unable to load vendors');
      });
  }, []);

  const submit = async () => {
    setError(null);

    if (!form.title || !form.location || !form.experience) {
      setError('Title, Location and Experience are required');
      return;
    }

    try {
      setLoading(true);

      await api.post('/jobs', {
        ...form,
        vendorIds: selectedVendors,
      });

      navigate('/vendor-manager/jobs');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Job creation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box width="xlarge" gap="16px">
      <Heading level={2} size="small" margin="none">
        Create Job
      </Heading>

      {error && (
        <Box background="#FEE2E2" pad="12px" round="8px">
          <Text size="small" color="#B91C1C">
            {error}
          </Text>
        </Box>
      )}

      <Box background="white" round="12px" border={{ color: 'border-weak' }} pad="24px" gap="16px">
        <FormField label="Job Title *" margin="none">
          <TextInput
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </FormField>

        <FormField label="Description" margin="none">
          <TextArea
            value={form.description}
            onChange={(e) =>
              setForm({
                ...form,
                description: e.target.value,
              })
            }
            rows={4}
            resize={false}
          />
        </FormField>

        <FormField label="Location *" margin="none">
          <TextInput
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
          />
        </FormField>

        <FormField label="Experience *" margin="none">
          <TextInput
            value={form.experience}
            onChange={(e) =>
              setForm({
                ...form,
                experience: e.target.value,
              })
            }
          />
        </FormField>

        <Box gap="8px">
          <Text weight={500}>Assign Vendors</Text>

          {vendors.length === 0 && (
            <Text size="small" color="#64748B">
              No vendors available
            </Text>
          )}

          {vendors.map((v) => (
            <CheckBox
              key={v.id}
              label={v.email}
              checked={selectedVendors.includes(v.id)}
              onChange={(e) =>
                e.target.checked
                  ? setSelectedVendors([...selectedVendors, v.id])
                  : setSelectedVendors(selectedVendors.filter((id) => id !== v.id))
              }
            />
          ))}
        </Box>

        <Box direction="row" gap="12px">
          <Button
            primary
            color="#01A982"
            label={loading ? 'Creating...' : 'Create Job'}
            disabled={loading}
            onClick={submit}
          />
          <Button label="Cancel" onClick={() => navigate('/vendor-manager/jobs')} />
        </Box>
      </Box>
    </Box>
  );
};

export default CreateJob;
