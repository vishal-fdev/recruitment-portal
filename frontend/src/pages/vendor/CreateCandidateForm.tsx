import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, Button, Heading, Layer, Text } from 'grommet';
import { ArrowLeft, BriefcaseBusiness, Check, Clock, Mail, MapPin, Phone, Upload, User } from 'lucide-react';
import api from '../../api/api';
import { LOCATION_DATA } from '../../constants/location';

interface Job {
  id: number;
  title: string;
  location?: string;
  experience?: string;
  numberOfPositions?: number;
  currentNumberOfPositions?: number;
  positions?: {
    id: number;
    level: string;
    status: string;
  }[];
}

const CreateCandidateForm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
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
    country: 'India',
    state: '',
    city: '',
    experience: '',
    noticePeriod: '',
    currentOrg: '',
  });
  const [states, setStates] = useState<string[]>(Object.keys(LOCATION_DATA.India || {}));
  const [cities, setCities] = useState<string[]>([]);
  const [resume, setResume] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [duplicateError, setDuplicateError] = useState('');

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await api.get('/jobs');
        const loadedJobs = res.data || [];
        setJobs(loadedJobs);

        const jobId = searchParams.get('jobId');
        if (jobId) {
          const job = loadedJobs.find((item: Job) => String(item.id) === String(jobId));
          if (job) {
            setSelectedJob(job);
            setForm((prev) => ({ ...prev, jobId }));
          }
        }
      } catch {
        alert('Failed to load jobs');
      }
    };

    void fetchJobs();
  }, [searchParams]);

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
      setForm((prev) => ({ ...prev, country: value, state: '', city: '' }));
    }

    if (name === 'state') {
      const cityList = LOCATION_DATA[form.country]?.[value] || [];
      setCities(cityList);
      setForm((prev) => ({ ...prev, state: value, city: '' }));
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

      await api.post('/candidates', data);

      navigate('/vendor/candidates', { replace: true });
    } catch (error) {
      console.error(error);
      const responseMessage = (error as any)?.response?.data?.message;
      const message = Array.isArray(responseMessage)
        ? responseMessage.join('\n')
        : responseMessage || 'Failed to create candidate';
      alert(message);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedJobOpenings =
    Number(selectedJob?.currentNumberOfPositions ?? selectedJob?.numberOfPositions ?? 0) ||
    selectedJob?.positions?.length ||
    0;

  return (
    <div style={styles.page}>
      <button type="button" style={styles.backButton} onClick={() => navigate(-1)}>
        <ArrowLeft size={14} />
        Back
      </button>

      <div style={styles.pageHeader}>
        <h1 style={styles.pageTitle}>Submit candidate</h1>
        <p style={styles.pageSubtitle}>
          Fill in candidate details and attach resume to submit for an open position
        </p>
      </div>

      <div style={styles.steps}>
        <Step number="1" label="Candidate info" active />
        <span style={styles.stepLine} />
        <Step number="2" label="Skills & experience" />
        <span style={styles.stepLine} />
        <Step number="3" label="Location & availability" />
        <span style={styles.stepLine} />
        <Step number="4" label="Resume & submit" />
      </div>

      <form onSubmit={handleSubmit} style={styles.formCard}>
        <SectionHeader
          icon={<BriefcaseBusiness size={16} color="#1E40AF" />}
          iconBg="#DBEAFE"
          title="Job selection"
          subtitle="Choose the position you are submitting this candidate for"
        />
        <div style={styles.formBody}>
          <Field label="Select job" required>
            <select
              value={form.jobId}
              onChange={(event) => void updateField('jobId', event.currentTarget.value)}
              style={styles.input}
              required
            >
              <option value="">Select an assigned job</option>
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>
                  HRQ{job.id} - {job.title}
                  {job.location ? ` - ${job.location}` : ''}
                </option>
              ))}
            </select>
          </Field>

          {selectedJob ? (
            <div style={styles.jobPreview}>
              <div style={styles.jobPreviewIcon}>
                <BriefcaseBusiness size={17} color="#FFFFFF" />
              </div>
              <div>
                <div style={styles.jobPreviewTitleRow}>
                  <span style={styles.jobPreviewTitle}>{selectedJob.title}</span>
                  <span style={styles.jobPreviewTag}>{selectedJobOpenings} openings</span>
                </div>
                <div style={styles.jobPreviewMeta}>
                  HRQ{selectedJob.id}
                  {selectedJob.location ? ` · ${selectedJob.location}` : ''}
                  {selectedJob.experience ? ` · Exp: ${selectedJob.experience}` : ''}
                </div>
              </div>
            </div>
          ) : null}

          {selectedJob?.positions?.length ? (
            <Field label="Position level" required>
              <select
                value={form.positionId}
                onChange={(event) => void updateField('positionId', event.currentTarget.value)}
                style={styles.input}
                required
              >
                <option value="">Select level</option>
                {selectedJob.positions.map((position) => (
                  <option key={position.id} value={position.id}>
                    {position.level}
                  </option>
                ))}
              </select>
            </Field>
          ) : null}
        </div>

        <SectionHeader
          icon={<User size={16} color="#5B21B6" />}
          iconBg="#EDE9FE"
          title="Personal information"
          subtitle="Candidate's basic contact and identity details"
        />
        <div style={styles.formBody}>
          <div style={styles.formGrid}>
            <Field label="Full name" required icon={<User size={14} />}>
              <input
                value={form.name}
                onChange={(event) => void updateField('name', event.currentTarget.value)}
                placeholder="e.g. Kavya Reddy"
                style={styles.iconInput}
                required
              />
            </Field>
            <Field label="Email address" required icon={<Mail size={14} />}>
              <input
                type="email"
                value={form.email}
                onChange={(event) => void updateField('email', event.currentTarget.value)}
                placeholder="e.g. kavya@email.com"
                style={styles.iconInput}
                required
              />
            </Field>
            <Field label="Phone number" required icon={<Phone size={14} />}>
              <input
                value={form.phone}
                onChange={(event) => void updateField('phone', event.currentTarget.value)}
                placeholder="+91 98765 43210"
                style={styles.iconInput}
                required
              />
            </Field>
            <Field label="Current organisation" required>
              <input
                value={form.currentOrg}
                onChange={(event) => void updateField('currentOrg', event.currentTarget.value)}
                placeholder="e.g. Infosys Ltd."
                style={styles.input}
                required
              />
            </Field>
            <Field label="Aadhaar No" required>
              <input
                value={form.aadharNo}
                onChange={(event) => void updateField('aadharNo', event.currentTarget.value)}
                placeholder="XXXX XXXX XXXX"
                style={styles.input}
                required
              />
            </Field>
            <Field label="Gender" required>
              <select
                value={form.gender}
                onChange={(event) => void updateField('gender', event.currentTarget.value)}
                style={styles.input}
                required
              >
                <option value="">Select gender</option>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </Field>
            <Field label="Education" required>
              <input
                value={form.education}
                onChange={(event) => void updateField('education', event.currentTarget.value)}
                placeholder="e.g. B.Tech"
                style={styles.input}
                required
              />
            </Field>
            <Field label="Upload Video (SharePoint Link)">
              <input
                type="url"
                value={form.videoLink}
                onChange={(event) => void updateField('videoLink', event.currentTarget.value)}
                placeholder="Paste SharePoint video link"
                style={styles.input}
              />
            </Field>
          </div>
          {duplicateError ? <p style={styles.errorText}>{duplicateError}</p> : null}
        </div>

        <SectionHeader
          icon={<Check size={16} color="#065F46" />}
          iconBg="#D1FAE5"
          title="Skills & experience"
          subtitle="Add primary skills, secondary skills and years of experience"
        />
        <div style={styles.formBody}>
          <div style={styles.formGrid}>
            <Field label="Primary skills" required>
              <input
                value={form.primarySkills}
                onChange={(event) => void updateField('primarySkills', event.currentTarget.value)}
                placeholder="e.g. Java, Spring Boot, Kubernetes"
                style={styles.input}
                required
              />
              <span style={styles.hint}>Separate skills with commas</span>
            </Field>
            <Field label="Secondary skills">
              <input
                value={form.secondarySkills}
                onChange={(event) => void updateField('secondarySkills', event.currentTarget.value)}
                placeholder="e.g. REST APIs, Docker"
                style={styles.input}
              />
              <span style={styles.hint}>Optional supporting skills</span>
            </Field>
            <Field label="Total experience" required icon={<Clock size={14} />}>
              <input
                type="number"
                min="0"
                max="40"
                value={form.experience}
                onChange={(event) => void updateField('experience', event.currentTarget.value)}
                placeholder="e.g. 5"
                style={styles.iconInput}
                required
              />
              <span style={styles.hint}>In years</span>
            </Field>
            <Field label="Notice period" required>
              <select
                value={form.noticePeriod}
                onChange={(event) => void updateField('noticePeriod', event.currentTarget.value)}
                style={styles.input}
                required
              >
                <option value="">Select notice period</option>
                <option value="0">Immediate / Serving notice</option>
                <option value="15">15 days</option>
                <option value="30">30 days</option>
                <option value="45">45 days</option>
                <option value="60">60 days</option>
                <option value="90">90 days</option>
              </select>
            </Field>
          </div>
        </div>

        <SectionHeader
          icon={<MapPin size={16} color="#92400E" />}
          iconBg="#FEF3C7"
          title="Location details"
          subtitle="Candidate's current location and work preference"
        />
        <div style={styles.formBody}>
          <div style={styles.formGridThree}>
            <Field label="Country" required>
              <select
                value={form.country}
                onChange={(event) => void updateField('country', event.currentTarget.value)}
                style={styles.input}
                required
              >
                <option value="">Select country</option>
                <option value="India">India</option>
              </select>
            </Field>
            <Field label="State" required>
              <select
                value={form.state}
                onChange={(event) => void updateField('state', event.currentTarget.value)}
                style={styles.input}
                required
              >
                <option value="">Select state</option>
                {states.map((state) => (
                  <option key={state}>{state}</option>
                ))}
              </select>
            </Field>
            <Field label="City" required>
              <select
                value={form.city}
                onChange={(event) => void updateField('city', event.currentTarget.value)}
                style={styles.input}
                required
              >
                <option value="">Select city</option>
                {cities.map((city) => (
                  <option key={city}>{city}</option>
                ))}
              </select>
            </Field>
          </div>
        </div>

        <SectionHeader
          icon={<Upload size={16} color="#0F766E" />}
          iconBg="#CCFBF1"
          title="Resume & submit"
          subtitle="Attach the candidate resume and submit the profile"
        />
        <div style={styles.formBody}>
          <label style={styles.fileDrop}>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(event) => setResume(event.target.files?.[0] || null)}
              style={styles.hiddenFile}
            />
            <span style={styles.fileDropIcon}>
              <Upload size={20} color="#01A982" />
            </span>
            <span style={styles.fileDropTitle}>
              {resume ? resume.name : 'Drag & drop resume here or click to upload'}
            </span>
            <span style={styles.fileDropSub}>PDF, DOC, DOCX allowed</span>
            <span style={styles.fileDropCta}>Choose File</span>
          </label>
        </div>

        <div style={styles.formActions}>
          <div style={styles.requiredNote}>
            <span style={styles.requiredDot}>*</span> Required fields must be completed before submitting
          </div>
          <div style={styles.actionButtons}>
            <button
              type="button"
              style={styles.cancelButton}
              onClick={() => navigate(-1)}
              disabled={submitting}
            >
              Cancel
            </button>
            <button type="submit" style={styles.submitButton} disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit candidate'}
            </button>
          </div>
        </div>
      </form>

      {duplicateError ? null : null}
    </div>
  );
};

const Step = ({ number, label, active }: { number: string; label: string; active?: boolean }) => (
  <div style={styles.step}>
    <span style={active ? styles.stepDotActive : styles.stepDot}>{number}</span>
    <span style={active ? styles.stepLabelActive : styles.stepLabel}>{label}</span>
  </div>
);

const SectionHeader = ({
  icon,
  iconBg,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  subtitle: string;
}) => (
  <div style={styles.sectionHeader}>
    <span style={{ ...styles.sectionIcon, background: iconBg }}>{icon}</span>
    <div>
      <div style={styles.sectionTitle}>{title}</div>
      <div style={styles.sectionSubtitle}>{subtitle}</div>
    </div>
  </div>
);

const Field = ({
  label,
  required,
  icon,
  children,
}: {
  label: string;
  required?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <div style={styles.field}>
    <label style={styles.label}>
      {label} {required ? <span style={styles.requiredDot}>*</span> : null}
    </label>
    <div style={styles.inputWrap}>
      {icon ? <span style={styles.fieldIcon}>{icon}</span> : null}
      {children}
    </div>
  </div>
);

export default CreateCandidateForm;

const styles = {
  page: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 20,
    width: '100%',
    padding: '0 32px 40px',
    boxSizing: 'border-box' as const,
  },
  backButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    background: '#01A982',
    border: 'none',
    borderRadius: 6,
    color: '#FFFFFF',
    cursor: 'pointer',
    display: 'inline-flex',
    fontSize: 13,
    fontWeight: 600,
    gap: 7,
    padding: '9px 16px',
  },
  pageHeader: {
    marginTop: 2,
  },
  pageTitle: {
    color: '#111827',
    fontSize: 22,
    fontWeight: 600,
    letterSpacing: '-0.3px',
    lineHeight: 1.2,
    margin: 0,
  },
  pageSubtitle: {
    color: '#6B7280',
    fontSize: 12,
    margin: '5px 0 0',
  },
  steps: {
    alignItems: 'center',
    display: 'flex',
    gap: 0,
    marginBottom: 4,
    width: '100%',
  },
  step: {
    alignItems: 'center',
    display: 'flex',
    gap: 8,
  },
  stepDotActive: {
    alignItems: 'center',
    background: '#FFFFFF',
    border: '2px solid #01A982',
    borderRadius: '50%',
    color: '#01A982',
    display: 'inline-flex',
    fontSize: 12,
    fontWeight: 600,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  stepDot: {
    alignItems: 'center',
    background: '#F0F1F4',
    border: '2px solid rgba(0,0,0,0.14)',
    borderRadius: '50%',
    color: '#9CA3AF',
    display: 'inline-flex',
    fontSize: 12,
    fontWeight: 600,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  stepLabelActive: {
    color: '#111827',
    fontSize: 12,
    fontWeight: 500,
    whiteSpace: 'nowrap' as const,
  },
  stepLabel: {
    color: '#6B7280',
    fontSize: 12,
    whiteSpace: 'nowrap' as const,
  },
  stepLine: {
    background: 'rgba(0,0,0,0.09)',
    flex: 1,
    height: 1.5,
    margin: '0 10px',
    minWidth: 40,
  },
  formCard: {
    background: '#FFFFFF',
    border: '1px solid rgba(0,0,0,0.09)',
    borderRadius: 14,
    overflow: 'hidden',
  },
  sectionHeader: {
    alignItems: 'center',
    background: '#F0F1F4',
    borderBottom: '1px solid rgba(0,0,0,0.09)',
    display: 'flex',
    gap: 10,
    padding: '16px 24px',
  },
  sectionIcon: {
    alignItems: 'center',
    borderRadius: 6,
    display: 'inline-flex',
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  sectionTitle: {
    color: '#111827',
    fontSize: 13,
    fontWeight: 600,
  },
  sectionSubtitle: {
    color: '#9CA3AF',
    fontSize: 11,
    marginTop: 1,
  },
  formBody: {
    padding: '22px 24px',
  },
  formGrid: {
    display: 'grid',
    gap: '18px 28px',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  },
  formGridThree: {
    display: 'grid',
    gap: '18px 28px',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  },
  field: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 6,
  },
  label: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: 500,
  },
  requiredDot: {
    color: '#01A982',
    fontWeight: 600,
  },
  inputWrap: {
    position: 'relative' as const,
  },
  fieldIcon: {
    color: '#9CA3AF',
    left: 11,
    position: 'absolute' as const,
    top: '50%',
    transform: 'translateY(-50%)',
    zIndex: 1,
  },
  input: {
    background: '#FFFFFF',
    border: '1px solid rgba(0,0,0,0.14)',
    borderRadius: 6,
    boxSizing: 'border-box' as const,
    color: '#111827',
    fontFamily: 'inherit',
    fontSize: 13,
    minHeight: 39,
    outline: 'none',
    padding: '9px 12px',
    width: '100%',
  },
  iconInput: {
    background: '#FFFFFF',
    border: '1px solid rgba(0,0,0,0.14)',
    borderRadius: 6,
    boxSizing: 'border-box' as const,
    color: '#111827',
    fontFamily: 'inherit',
    fontSize: 13,
    minHeight: 39,
    outline: 'none',
    padding: '9px 12px 9px 34px',
    width: '100%',
  },
  hint: {
    color: '#9CA3AF',
    fontSize: 11,
    marginTop: 4,
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 12,
    margin: '12px 0 0',
  },
  jobPreview: {
    alignItems: 'flex-start',
    background: '#F0FDF4',
    border: '1px solid #BBF7D0',
    borderRadius: 10,
    display: 'flex',
    gap: 14,
    marginTop: 12,
    padding: '14px 16px',
  },
  jobPreviewIcon: {
    alignItems: 'center',
    background: '#01A982',
    borderRadius: 6,
    display: 'flex',
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  jobPreviewTitleRow: {
    alignItems: 'center',
    display: 'flex',
    gap: 8,
    marginBottom: 4,
  },
  jobPreviewTitle: {
    color: '#065F46',
    fontSize: 13,
    fontWeight: 600,
  },
  jobPreviewTag: {
    background: '#BBF7D0',
    borderRadius: 8,
    color: '#065F46',
    fontSize: 10,
    fontWeight: 500,
    padding: '2px 8px',
  },
  jobPreviewMeta: {
    color: '#16A34A',
    fontSize: 11,
  },
  fileDrop: {
    border: '1.5px dashed rgba(0,0,0,0.14)',
    borderRadius: 10,
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column' as const,
    padding: '28px 20px',
    textAlign: 'center' as const,
  },
  hiddenFile: {
    display: 'none',
  },
  fileDropIcon: {
    alignItems: 'center',
    alignSelf: 'center',
    background: 'rgba(1,169,130,0.13)',
    borderRadius: 10,
    display: 'flex',
    height: 40,
    justifyContent: 'center',
    marginBottom: 10,
    width: 40,
  },
  fileDropTitle: {
    color: '#111827',
    fontSize: 13,
    fontWeight: 500,
    marginBottom: 4,
  },
  fileDropSub: {
    color: '#9CA3AF',
    fontSize: 11,
  },
  fileDropCta: {
    alignSelf: 'center',
    border: '1px solid #01A982',
    borderRadius: 6,
    color: '#01A982',
    display: 'inline-block',
    fontSize: 12,
    fontWeight: 500,
    marginTop: 10,
    padding: '5px 14px',
  },
  formActions: {
    alignItems: 'center',
    background: '#F0F1F4',
    borderTop: '1px solid rgba(0,0,0,0.09)',
    display: 'flex',
    justifyContent: 'space-between',
    padding: '18px 24px',
  },
  requiredNote: {
    color: '#9CA3AF',
    fontSize: 11,
  },
  actionButtons: {
    display: 'flex',
    gap: 10,
  },
  cancelButton: {
    background: 'transparent',
    border: '1px solid rgba(0,0,0,0.14)',
    borderRadius: 6,
    color: '#6B7280',
    cursor: 'pointer',
    fontSize: 13,
    padding: '9px 20px',
  },
  submitButton: {
    background: '#01A982',
    border: 'none',
    borderRadius: 6,
    color: '#FFFFFF',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 500,
    padding: '9px 24px',
  },
};
