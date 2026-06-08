import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import {
  Box,
  Button,
  Card,
  CardBody,
  Form,
  FormField,
  Grid,
  Heading,
  Select,
  Text,
  TextInput,
} from 'grommet';
import api from '../../api/api';
import { LOCATION_DATA } from '../../constants/location';

interface Job {
  id: number;
  title: string;
  positions?: {
    id: number;
    level: string;
    status: string;
  }[];
}

const CreateCandidateForm = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [form, setForm] = useState({
    jobId: '',
    positionId: '',
    name: '',
    email: '',
    phone: '',
    aadharNo: '',
    gender: '',
    education: '',
    videoLink: '',
    primarySkills: '',
    secondarySkills: '',
    country: '',
    state: '',
    city: '',
    experience: '',
    noticePeriod: '',
    currentOrg: '',
  });
  const [states, setStates] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [resume, setResume] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [duplicateError, setDuplicateError] = useState('');

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await api.get('/jobs');
        setJobs(res.data);
      } catch {
        alert('Failed to load jobs');
      }
    };

    void fetchJobs();
  }, []);

  const checkDuplicate = async (email: string, phone: string, aadharNo: string) => {
    try {
      const res = await api.get('/candidates/check-duplicate', {
        params: { email, phone, aadharNo },
      });

      if (res.data.exists) {
        if (res.data.field === 'email') {
          setDuplicateError('Candidate with this email already exists');
        } else if (res.data.field === 'aadharNo') {
          setDuplicateError('Candidate with this Aadhaar number already exists');
        } else {
          setDuplicateError('Candidate with this phone number already exists');
        }

        return true;
      }

      setDuplicateError('');
      return false;
    } catch {
      return false;
    }
  };

  const updateField = async (name: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === 'email' || name === 'phone' || name === 'aadharNo') {
      const nextEmail = name === 'email' ? value : form.email;
      const nextPhone = name === 'phone' ? value : form.phone;
      const nextAadhar = name === 'aadharNo' ? value : form.aadharNo;

      if (nextEmail || nextPhone || nextAadhar) {
        await checkDuplicate(nextEmail, nextPhone, nextAadhar);
      }
    }

    if (name === 'jobId') {
      const job = jobs.find((j) => j.id === Number(value));
      setSelectedJob(job || null);
      setForm((prev) => ({
        ...prev,
        jobId: value,
        positionId: '',
      }));
    }

    if (name === 'country') {
      const stateList = Object.keys(LOCATION_DATA[value] || {});
      setStates(stateList);
      setCities([]);
    }

    if (name === 'state') {
      const cityList = LOCATION_DATA[form.country]?.[value] || [];
      setCities(cityList);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (duplicateError) {
      alert(duplicateError);
      return;
    }

    if (!resume) {
      alert('Resume is required');
      return;
    }

    if (!form.jobId) {
      alert('Please select a job');
      return;
    }

    if (selectedJob?.positions?.length && !form.positionId) {
      alert('Please select position level');
      return;
    }

    try {
      setSubmitting(true);
      const duplicate = await checkDuplicate(form.email, form.phone, form.aadharNo);

      if (duplicate) {
        setSubmitting(false);
        return;
      }

      const data = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (value) data.append(key, String(value));
      });
      data.append('resume', resume);

      await api.post('/candidates', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      navigate('/vendor/candidates', { replace: true });
    } catch (error) {
      console.error(error);
      alert('Failed to create candidate');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box gap="medium">
      <Button
        type="button"
        icon={<ArrowLeft size={16} />}
        label="Back"
        alignSelf="start"
        primary
        color="brand"
        onClick={() => navigate('/vendor/candidates')}
      />

      <Card background="white" round="20px" border={{ color: 'border-weak' }} elevation="xsmall">
        <CardBody pad="large" gap="medium">
          <Heading level={2} margin="none">
            Submit Candidate
          </Heading>

          <Form onSubmit={handleSubmit}>
            <Grid columns={{ count: 'fit', size: ['medium', 'medium'] }} gap="medium">
              <FormField label="Select Job *" required>
                <Select
                  options={jobs}
                  labelKey={(job: Job) => `HRQ${job.id} - ${job.title}`}
                  valueKey={{ key: 'id', reduce: true }}
                  value={form.jobId ? Number(form.jobId) : undefined}
                  onChange={({ value }) => void updateField('jobId', String(value))}
                  placeholder="Select Job"
                />
              </FormField>

              {selectedJob?.positions && selectedJob.positions.length > 0 ? (
                <FormField label="Position Level *" required>
                  <Select
                    options={selectedJob.positions}
                    labelKey="level"
                    valueKey={{ key: 'id', reduce: true }}
                    value={form.positionId ? Number(form.positionId) : undefined}
                    onChange={({ value }) => void updateField('positionId', String(value))}
                    placeholder="Select Level"
                  />
                </FormField>
              ) : (
                <Box />
              )}

              <Field label="Full Name *">
                <TextInput value={form.name} onChange={(e) => void updateField('name', e.target.value)} />
              </Field>
              <Field label="Phone Number *">
                <TextInput value={form.phone} onChange={(e) => void updateField('phone', e.target.value)} />
              </Field>
              <Field label="Email *">
                <TextInput
                  type="email"
                  value={form.email}
                  onChange={(e) => void updateField('email', e.target.value)}
                />
              </Field>
              <Field label="Aadhaar No *">
                <TextInput value={form.aadharNo} onChange={(e) => void updateField('aadharNo', e.target.value)} />
              </Field>
              <FormField label="Gender *" required>
                <Select
                  options={['Male', 'Female', 'Other']}
                  value={form.gender || undefined}
                  onChange={({ value }) => void updateField('gender', value)}
                  placeholder="Select gender"
                />
              </FormField>
              <Field label="Education *">
                <TextInput value={form.education} onChange={(e) => void updateField('education', e.target.value)} />
              </Field>
              <Field label="Upload Video (SharePoint Link)">
                <TextInput
                  type="url"
                  value={form.videoLink}
                  onChange={(e) => void updateField('videoLink', e.target.value)}
                  placeholder="Paste SharePoint video link"
                />
              </Field>
              <Box />

              {duplicateError ? (
  <Box
    style={{
      gridColumn: 'span 2',
    }}
  >
    <Text color="status-critical" size="small">
      {duplicateError}
    </Text>
  </Box>
) : null}

              <Field label="Primary Skills *">
                <TextInput
                  value={form.primarySkills}
                  onChange={(e) => void updateField('primarySkills', e.target.value)}
                />
              </Field>
              <Field label="Secondary Skills">
                <TextInput
                  value={form.secondarySkills}
                  onChange={(e) => void updateField('secondarySkills', e.target.value)}
                />
              </Field>
              <FormField label="Country *" required>
                <Select
                  options={['India']}
                  value={form.country || undefined}
                  onChange={({ value }) => void updateField('country', value)}
                  placeholder="Select country"
                />
              </FormField>
              <FormField label="State *" required>
                <Select
                  options={states}
                  value={form.state || undefined}
                  onChange={({ value }) => void updateField('state', value)}
                  placeholder="Select state"
                />
              </FormField>
              <FormField label="City *" required>
                <Select
                  options={cities}
                  value={form.city || undefined}
                  onChange={({ value }) => void updateField('city', value)}
                  placeholder="Select city"
                />
              </FormField>
              <Field label="Experience (Years) *">
                <TextInput
                  value={form.experience}
                  onChange={(e) => void updateField('experience', e.target.value)}
                />
              </Field>
              <Field label="Notice Period">
                <TextInput
                  value={form.noticePeriod}
                  onChange={(e) => void updateField('noticePeriod', e.target.value)}
                />
              </Field>
              <Field label="Current Organization *">
                <TextInput
                  value={form.currentOrg}
                  onChange={(e) => void updateField('currentOrg', e.target.value)}
                />
              </Field>
              <FormField label="Resume *" required>
                <Box gap="xsmall">
                  <Button
                    type="button"
                    label={resume ? resume.name : 'Choose Resume'}
                    onClick={() => document.getElementById('vendor-resume-upload')?.click()}
                  />
                  <input
                    id="vendor-resume-upload"
                    type="file"
                    hidden
                    onChange={(e) => setResume(e.target.files?.[0] || null)}
                  />
                  {resume ? (
                    <Text size="small" color="text-weak">
                      {resume.name}
                    </Text>
                  ) : null}
                </Box>
              </FormField>
            </Grid>

            <Box direction="row" gap="small" justify="end" margin={{ top: 'large' }}>
              <Button type="button" label="Cancel" onClick={() => navigate(-1)} disabled={submitting} />
              <Button
                type="submit"
                label={submitting ? 'Submitting...' : 'Submit'}
                primary
                color="brand"
                disabled={submitting}
              />
            </Box>
          </Form>
        </CardBody>
      </Card>
    </Box>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <FormField label={label}>{children}</FormField>
);

export default CreateCandidateForm;
