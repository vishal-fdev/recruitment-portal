import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Form,
  FormField,
  Heading,
  Select,
  Text,
  TextInput,
  TextArea,
} from 'grommet';
import api from '../api/api';

type Job = {
  id: number;
  title: string;
};

export default function Candidates() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '',
    email: '',
    skills: '',
    experience: '',
    jobId: '',
  });

  useEffect(() => {
    api.get('/jobs')
      .then((res) => setJobs(res.data))
      .catch(() => setError('Failed to load jobs'));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await api.post('/candidates', {
        name: form.name,
        email: form.email,
        skills: form.skills,
        experience: Number(form.experience),
        jobId: Number(form.jobId),
      });

      setSuccess('Candidate submitted successfully');
      setForm({
        name: '',
        email: '',
        skills: '',
        experience: '',
        jobId: '',
      });
    } catch {
      setError('Failed to submit candidate');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box width="xlarge" gap="16px">
      <Heading level={2} margin="none" size="small">
        Submit Candidate Profile
      </Heading>

      {error && <Text color="status-critical">{error}</Text>}
      {success && <Text color="status-ok">{success}</Text>}

      <Box
        as="form"
        onSubmit={handleSubmit}
        gap="16px"
        pad="24px"
        background="white"
        round="16px"
        border={{ color: 'border-weak' }}
      >
        <Form value={form} onChange={(nextValue) => setForm(nextValue as typeof form)}>
          <Box gap="16px">
            <FormField name="name" label="Candidate Name" required>
              <TextInput name="name" value={form.name} />
            </FormField>
            <FormField name="email" label="Email" required>
              <TextInput name="email" type="email" value={form.email} />
            </FormField>
            <FormField name="skills" label="Skills" required>
              <TextArea name="skills" value={form.skills} resize={false} rows={3} />
            </FormField>
            <FormField name="experience" label="Experience (years)" required>
              <TextInput name="experience" type="number" value={form.experience} />
            </FormField>
            <FormField name="jobId" label="Select Job" required>
              <Select
                name="jobId"
                options={jobs.map((job) => ({ label: job.title, value: String(job.id) }))}
                labelKey="label"
                valueKey={{ key: 'value', reduce: true }}
                value={form.jobId}
                onChange={({ value }) => setForm((current) => ({ ...current, jobId: value }))}
              />
            </FormField>
          </Box>
        </Form>

        <Box direction="row" justify="start">
          <Button
            type="submit"
            primary
            color="#3B82F6"
            label={loading ? 'Submitting...' : 'Submit Candidate'}
            disabled={loading}
            onClick={() => undefined}
          />
        </Box>
      </Box>
    </Box>
  );
}
