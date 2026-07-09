import { CSSProperties, FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FileSpreadsheet } from 'lucide-react';
import { hpeBadgedHiringService, type BadgedJob } from '../../services/hpeBadgedHiringService';

const pageStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 24,
  paddingBottom: 56,
};

const cardStyle: CSSProperties = {
  background: '#FFFFFF',
  border: '1px solid #D9E1EA',
  borderRadius: 16,
  boxShadow: '0 10px 24px rgba(15,23,42,0.06)',
  overflow: 'hidden',
};

const sectionHeaderStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '20px 24px',
  background: '#F1F4F8',
  borderBottom: '1px solid #D9E1EA',
};

const sectionTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: 18,
  lineHeight: 1.25,
  fontWeight: 700,
  color: '#001A3D',
};

const mutedTextStyle: CSSProperties = {
  margin: '5px 0 0',
  fontSize: 13,
  lineHeight: 1.4,
  color: '#8A98B5',
};

const formBodyStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 20,
  padding: 24,
};

const fieldGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(320px, 1fr))',
  gap: '20px 24px',
  alignItems: 'start',
};

const labelStyle: CSSProperties = {
  display: 'block',
  marginBottom: 8,
  fontSize: 13,
  lineHeight: 1.25,
  fontWeight: 650,
  color: '#001A3D',
};

const inputStyle: CSSProperties = {
  width: '100%',
  height: 44,
  minHeight: 44,
  border: '1px solid #CBD5E1',
  borderRadius: 8,
  padding: '0 12px',
  fontSize: 14,
  color: '#001A3D',
  background: '#FFFFFF',
  boxSizing: 'border-box',
  outline: 'none',
};

const fileInputStyle: CSSProperties = {
  ...inputStyle,
  padding: '9px 12px',
};

const primaryButtonStyle: CSSProperties = {
  border: 0,
  borderRadius: 10,
  background: '#01A982',
  color: '#FFFFFF',
  cursor: 'pointer',
  fontSize: 16,
  fontWeight: 700,
  minHeight: 44,
  padding: '0 20px',
  whiteSpace: 'nowrap',
};

const secondaryButtonStyle: CSSProperties = {
  border: '1px solid #CBD5E1',
  borderRadius: 8,
  background: '#FFFFFF',
  color: '#001A3D',
  cursor: 'pointer',
  fontSize: 15,
  fontWeight: 650,
  minHeight: 42,
  padding: '0 18px',
};

const disabledButtonStyle: CSSProperties = {
  opacity: 0.65,
  cursor: 'not-allowed',
};

const fieldWrapStyle: CSSProperties = {
  minWidth: 0,
};

const SubmitCandidate = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialJobId = searchParams.get('jobId') || '';
  const [jobs, setJobs] = useState<BadgedJob[]>([]);
  const [resume, setResume] = useState<File | null>(null);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingExcel, setUploadingExcel] = useState(false);
  const [form, setForm] = useState({
    jobId: initialJobId,
    candidateName: '',
    email: '',
    contactNumber: '',
    currentCompany: '',
    noticePeriod: '',
    primarySkills: '',
    secondarySkills: '',
    experience: '',
    location: '',
  });

  useEffect(() => {
    hpeBadgedHiringService.listJobs().then((data) => {
      setJobs(data);
      if (!form.jobId && data[0]) setForm((current) => ({ ...current, jobId: data[0].jobId }));
    }).catch(() => undefined);
  }, []);

  const selectedJob = useMemo(() => jobs.find((job) => job.jobId === form.jobId), [jobs, form.jobId]);
  const update = (key: string, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.jobId || !form.candidateName.trim() || !form.email.trim() || !form.contactNumber.trim()) {
      alert('Job, candidate name, email, and contact number are required');
      return;
    }
    setSubmitting(true);
    try {
      await hpeBadgedHiringService.createSubmission(form, resume);
      navigate('/vendor-manager/badged-hiring/submissions');
    } catch {
      alert('Failed to create candidate submission');
    } finally {
      setSubmitting(false);
    }
  };

  const uploadExcel = async () => {
    if (!excelFile) {
      alert('Please choose an Excel file first');
      return;
    }
    setUploadingExcel(true);
    try {
      const result = await hpeBadgedHiringService.uploadSubmissionExcel(excelFile);
      alert(`Excel uploaded. Added ${result.inserted}, updated ${result.updated}.`);
      navigate('/vendor-manager/badged-hiring/submissions');
    } catch {
      alert('Failed to upload candidate Excel');
    } finally {
      setUploadingExcel(false);
    }
  };

  const field = (label: string, key: keyof typeof form, placeholder = '') => (
    <div style={fieldWrapStyle}>
      <label style={labelStyle}>{label}</label>
      <input
        value={form[key]}
        placeholder={placeholder}
        onChange={(event) => update(key, event.target.value)}
        style={inputStyle}
      />
    </div>
  );

  return (
    <div style={pageStyle}>
      <button
        type="button"
        onClick={() => navigate('/vendor-manager/badged-hiring/jobs')}
        style={{ ...primaryButtonStyle, width: 86, minHeight: 36, borderRadius: 8, fontSize: 15 }}
      >
        Back
      </button>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h1 style={{ margin: 0, fontSize: 32, lineHeight: 1.15, fontWeight: 700, color: '#001A3D' }}>
          Submit Candidate
        </h1>
        <p style={{ margin: 0, fontSize: 15, lineHeight: 1.45, color: '#50648A' }}>
          Submit candidate details against an assigned badged hiring requisition
        </p>
      </div>

      <section style={cardStyle}>
        <div style={sectionHeaderStyle}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: '#E8FFF6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flex: '0 0 auto',
          }}>
            <FileSpreadsheet size={18} color="#01A982" />
          </div>
          <div>
            <h2 style={sectionTitleStyle}>Upload candidate Excel</h2>
            <p style={mutedTextStyle}>
              Include Job ID, Candidate Name, Email, Contact Number, and optional Status to update existing submissions
            </p>
          </div>
        </div>
        <div style={formBodyStyle}>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 16, alignItems: 'end' }}>
            <div style={fieldWrapStyle}>
              <label style={labelStyle}>Excel file</label>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(event) => setExcelFile(event.target.files?.[0] || null)}
                style={fileInputStyle}
              />
            </div>
            <button
              type="button"
              onClick={uploadExcel}
              disabled={uploadingExcel}
              style={{ ...primaryButtonStyle, ...(uploadingExcel ? disabledButtonStyle : undefined) }}
            >
              {uploadingExcel ? 'Uploading...' : 'Upload Excel'}
            </button>
          </div>
        </div>
      </section>

      <form onSubmit={submit} style={cardStyle}>
        <section>
          <div style={{ ...sectionHeaderStyle, display: 'block' }}>
            <h2 style={sectionTitleStyle}>Job selection</h2>
            <p style={mutedTextStyle}>Choose the requisition this candidate belongs to</p>
          </div>
          <div style={formBodyStyle}>
            <div style={fieldWrapStyle}>
              <label style={labelStyle}>Select job *</label>
              <select value={form.jobId} onChange={(event) => update('jobId', event.target.value)} style={inputStyle}>
                {jobs.length === 0 ? (
                  <option value="">No assigned jobs available</option>
                ) : (
                  jobs.map((job) => (
                    <option key={job._id} value={job.jobId}>
                      {job.jobId} - {job.title} - {job.location || 'Location pending'}
                    </option>
                  ))
                )}
              </select>
            </div>
            {selectedJob && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                flexWrap: 'wrap',
                padding: 16,
                borderRadius: 10,
                border: '1px solid #A7F3D0',
                background: '#ECFDF5',
              }}>
                <strong style={{ color: '#008567', fontSize: 15 }}>{selectedJob.title}</strong>
                <span style={{
                  color: '#008567',
                  background: '#CFFAE8',
                  borderRadius: 999,
                  padding: '5px 10px',
                  fontSize: 12,
                  fontWeight: 700,
                }}>
                  {selectedJob.currentPositions || selectedJob.positions || 0} openings
                </span>
                <span style={{ color: '#008567', fontSize: 13 }}>
                  {selectedJob.jobId} - {selectedJob.location || '-'}
                </span>
              </div>
            )}
          </div>
        </section>

        <section>
          <div style={{ ...sectionHeaderStyle, display: 'block' }}>
            <h2 style={sectionTitleStyle}>Candidate information</h2>
            <p style={mutedTextStyle}>Basic contact, skills, location, and resume</p>
          </div>
          <div style={formBodyStyle}>
            <div style={fieldGridStyle}>
              {field('Candidate name *', 'candidateName', 'e.g. Kavya Reddy')}
              {field('Email address *', 'email', 'e.g. kavya@email.com')}
              {field('Contact number *', 'contactNumber', '+91 98765 43210')}
              {field('Current company', 'currentCompany', 'e.g. Infosys Ltd.')}
              {field('Notice period', 'noticePeriod', '30 days')}
              {field('Experience', 'experience', '5 years')}
              {field('Location', 'location', 'Bangalore')}
              {field('Primary skills', 'primarySkills', 'Java, Spring Boot, Kubernetes')}
              {field('Secondary skills', 'secondarySkills', 'REST APIs, Docker')}
            </div>
            <div style={fieldWrapStyle}>
              <label style={labelStyle}>Resume</label>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(event) => setResume(event.target.files?.[0] || null)}
                style={fileInputStyle}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 6 }}>
              <button type="button" onClick={() => navigate('/vendor-manager/badged-hiring/jobs')} style={secondaryButtonStyle}>
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                style={{ ...primaryButtonStyle, ...(submitting ? disabledButtonStyle : undefined) }}
              >
                {submitting ? 'Submitting...' : 'Submit Candidate'}
              </button>
            </div>
          </div>
        </section>
      </form>
    </div>
  );
};

export default SubmitCandidate;
