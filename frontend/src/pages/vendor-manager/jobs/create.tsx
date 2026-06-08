import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  Box,
  Button,
  FormField,
  Heading,
  TextArea,
  TextInput,
} from 'grommet';

const CreateJob = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: '',
    location: '',
    experience: '',
    description: '',
  });

  const submit = () => {
    console.log('Create job:', form);
    navigate('/vendor-manager/jobs');
  };

  return (
    <Box width="xlarge" gap="24px">
      <Heading level={2} size="small" margin="none">
        Create Job
      </Heading>

      <Box background="white" round="12px" border={{ color: 'border-weak' }} pad="24px" gap="16px">
        <Field label="Job Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
        <Field label="Location" value={form.location} onChange={(v) => setForm({ ...form, location: v })} />
        <Field label="Experience" value={form.experience} onChange={(v) => setForm({ ...form, experience: v })} />

        <FormField label="Job Description" margin="none">
          <TextArea
            value={form.description}
            onChange={(event) =>
              setForm({
                ...form,
                description: event.target.value,
              })
            }
            resize={false}
            rows={4}
          />
        </FormField>

        <Box direction="row" justify="end" gap="12px">
          <Button label="Cancel" onClick={() => navigate('/vendor-manager/jobs')} />
          <Button primary color="#01A982" label="Create Job" onClick={submit} />
        </Box>
      </Box>
    </Box>
  );
};

const Field = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) => (
  <FormField label={label} margin="none">
    <TextInput value={value} onChange={(event) => onChange(event.target.value)} />
  </FormField>
);

export default CreateJob;
