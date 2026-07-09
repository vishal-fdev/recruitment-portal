import { useEffect, useMemo, useState } from 'react';
import type { ChangeEvent, CSSProperties, DragEvent, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../auth/authService';
import { hpeBadgedHiringService } from '../../services/hpeBadgedHiringService';

const LEVEL_OPTIONS = ['ENT', 'INT', 'SPE', 'EXP', 'MAS', 'MAS 1'];
const CATEGORY_OPTIONS = ['IT & Consulting', 'Engineering', 'Operations', 'Finance', 'Sales', 'Support'];
const WORK_TYPES = ['Onsite', 'Remote', 'Hybrid'];
const REQUEST_TYPES = [
  { label: 'New Request', value: 'NEW' },
  { label: 'Backfill', value: 'BACKFILL' },
];

type ChildPosition = {
  level: string;
  openings: number;
  requestType: 'NEW' | 'BACKFILL';
  backfillEmployeeId: string;
  backfillEmployeeName: string;
};

type FormState = {
  jobTitle: string;
  jobCategory: string;
  businessUnit: string;
  hiringManager: string;
  workType: string;
  level: string;
  numberOfPositions: number;
  requestType: 'NEW' | 'BACKFILL';
  backfillEmployeeId: string;
  backfillEmployeeName: string;
  dealName: string;
  startDate: string;
  endDate: string;
  workLocation: string;
  region: string;
  justification: string;
  description: string;
  primarySkills: string;
  secondarySkills: string;
  experience: string;
  panelScreening: string;
  panelTechnical: string;
  panelOps: string;
  panelComments: string;
};

type FieldProps = {
  label: string;
  error?: string;
  full?: boolean;
  children: ReactNode;
};

const todayDate = () => new Date().toISOString().slice(0, 10);

const emptyChild = (): ChildPosition => ({
  level: '',
  openings: 1,
  requestType: 'NEW',
  backfillEmployeeId: '',
  backfillEmployeeName: '',
});

const FileDropzone = ({
  label,
  accent,
  file,
  dragging,
  onDragState,
  onFile,
  onRemove,
}: {
  label: string;
  accent: string;
  file: File | null;
  dragging: boolean;
  onDragState: (dragging: boolean) => void;
  onFile: (file: File | null) => void;
  onRemove: () => void;
}) => {
  const inputId = useMemo(
    () => `${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Math.random().toString(36).slice(2)}`,
    [label],
  );

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    onDragState(false);
    const droppedFile = event.dataTransfer.files?.[0];
    if (droppedFile) onFile(droppedFile);
  };

  return (
    <div>
      <div
        className={`badged-dropzone${dragging ? ' is-dragging' : ''}`}
        style={{ '--drop-accent': accent } as CSSProperties}
        onDrop={handleDrop}
        onDragOver={(event) => {
          event.preventDefault();
          onDragState(true);
        }}
        onDragLeave={() => onDragState(false)}
      >
        <p>{`Drag & drop ${label} here or click to upload`}</p>
        <input
          id={inputId}
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={(event) => onFile(event.target.files?.[0] || null)}
          hidden
        />
        <label htmlFor={inputId} className="badged-file-button" style={{ background: accent }}>
          Choose File
        </label>
      </div>
      {file && (
        <div className="badged-file-row">
          <span>{file.name}</span>
          <button type="button" onClick={onRemove}>Remove</button>
        </div>
      )}
      <p className="badged-help">Only PDF, DOC, DOCX allowed</p>
    </div>
  );
};

const Field = ({ label, error, full, children }: FieldProps) => (
  <label className={full ? 'badged-field badged-field-full' : 'badged-field'}>
    <span>{label}</span>
    {children}
    {error && <small className="badged-error">{error}</small>}
  </label>
);

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="badged-form-section">
    <h2>{title}</h2>
    <div className="badged-section-line" />
    {children}
  </section>
);

const BadgedCreateJob = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>({
    jobTitle: '',
    jobCategory: '',
    businessUnit: 'MS',
    hiringManager: '',
    workType: 'Onsite',
    level: '',
    numberOfPositions: 1,
    requestType: 'NEW',
    backfillEmployeeId: '',
    backfillEmployeeName: '',
    dealName: '',
    startDate: '',
    endDate: '',
    workLocation: '',
    region: '',
    justification: '',
    description: '',
    primarySkills: '',
    secondarySkills: '',
    experience: '',
    panelScreening: '',
    panelTechnical: '',
    panelOps: '',
    panelComments: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [jdFile, setJdFile] = useState<File | null>(null);
  const [psqFile, setPsqFile] = useState<File | null>(null);
  const [draggingJd, setDraggingJd] = useState(false);
  const [draggingPsq, setDraggingPsq] = useState(false);
  const [showAdditionalPositions, setShowAdditionalPositions] = useState(false);
  const [newChild, setNewChild] = useState<ChildPosition>(emptyChild);
  const [childPositions, setChildPositions] = useState<ChildPosition[]>([]);
  const [backfillModalTarget, setBackfillModalTarget] = useState<'main' | 'child' | null>(null);
  const [backfillDraft, setBackfillDraft] = useState({ employeeId: '', employeeName: '' });
  const [sectionSaved, setSectionSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const email = authService.getUserEmail();
    if (email) {
      setForm((prev) => ({ ...prev, hiringManager: prev.hiringManager || email }));
    }
  }, []);

  const markDirty = () => setSectionSaved(false);

  const openBackfillModal = (target: 'main' | 'child') => {
    const source = target === 'main' ? form : newChild;
    setBackfillDraft({
      employeeId: source.backfillEmployeeId,
      employeeName: source.backfillEmployeeName,
    });
    setBackfillModalTarget(target);
  };

  const closeBackfillModal = () => {
    if (backfillModalTarget === 'main' && !form.backfillEmployeeId.trim() && !form.backfillEmployeeName.trim()) {
      setForm((prev) => ({
        ...prev,
        requestType: 'NEW',
        backfillEmployeeId: '',
        backfillEmployeeName: '',
      }));
    }

    if (
      backfillModalTarget === 'child' &&
      !newChild.backfillEmployeeId.trim() &&
      !newChild.backfillEmployeeName.trim()
    ) {
      setNewChild((prev) => ({
        ...prev,
        requestType: 'NEW',
        backfillEmployeeId: '',
        backfillEmployeeName: '',
      }));
    }

    setBackfillModalTarget(null);
    setBackfillDraft({ employeeId: '', employeeName: '' });
  };

  const saveBackfillDetails = () => {
    const employeeId = backfillDraft.employeeId.trim();
    const employeeName = backfillDraft.employeeName.trim();

    if (!employeeId || !employeeName || !backfillModalTarget) return;

    if (backfillModalTarget === 'main') {
      setForm((prev) => ({
        ...prev,
        requestType: 'BACKFILL',
        backfillEmployeeId: employeeId,
        backfillEmployeeName: employeeName,
      }));
      setErrors((prev) => {
        const next = { ...prev };
        delete next.backfillEmployeeId;
        delete next.backfillEmployeeName;
        return next;
      });
    } else {
      setNewChild((prev) => ({
        ...prev,
        requestType: 'BACKFILL',
        backfillEmployeeId: employeeId,
        backfillEmployeeName: employeeName,
      }));
      setErrors((prev) => {
        const next = { ...prev };
        delete next.newChildBackfillEmployeeId;
        delete next.newChildBackfillEmployeeName;
        return next;
      });
    }

    markDirty();
    setBackfillModalTarget(null);
    setBackfillDraft({ employeeId: '', employeeName: '' });
  };

  const handleRequestTypeChange = (value: FormState['requestType']) => {
    setForm((prev) => ({
      ...prev,
      requestType: value,
      backfillEmployeeId: value === 'NEW' ? '' : prev.backfillEmployeeId,
      backfillEmployeeName: value === 'NEW' ? '' : prev.backfillEmployeeName,
    }));
    markDirty();
    if (value === 'BACKFILL') openBackfillModal('main');
  };

  const handleChildRequestTypeChange = (value: ChildPosition['requestType']) => {
    setNewChild((prev) => ({
      ...prev,
      requestType: value,
      backfillEmployeeId: value === 'NEW' ? '' : prev.backfillEmployeeId,
      backfillEmployeeName: value === 'NEW' ? '' : prev.backfillEmployeeName,
    }));
    markDirty();
    if (value === 'BACKFILL') openBackfillModal('child');
  };

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === 'numberOfPositions' ? Math.max(1, Number(value) || 1) : value,
    }));

    if (
      [
        'level',
        'numberOfPositions',
        'requestType',
        'dealName',
        'startDate',
        'endDate',
        'workLocation',
        'region',
      ].includes(name)
    ) {
      markDirty();
    }
  };

  const getDateErrors = () => {
    const today = todayDate();
    const dateErrors: Record<string, string> = {};
    if (form.startDate && form.startDate < today) {
      dateErrors.startDate = 'Start date cannot be backdated';
    }
    if (form.endDate && form.endDate < today) {
      dateErrors.endDate = 'End date cannot be backdated';
    }
    if (form.startDate && form.endDate && form.endDate < form.startDate) {
      dateErrors.endDate = 'End date cannot be before start date';
    }
    return dateErrors;
  };

  const validateDetails = () => {
    const nextErrors: Record<string, string> = {};
    if (!form.jobTitle.trim()) nextErrors.jobTitle = 'Required';
    if (!form.jobCategory.trim()) nextErrors.jobCategory = 'Required';
    if (!form.businessUnit.trim()) nextErrors.businessUnit = 'Required';
    if (!form.hiringManager.trim()) nextErrors.hiringManager = 'Required';
    return nextErrors;
  };

  const validatePositionSection = () => {
    const nextErrors: Record<string, string> = {};
    if (!form.level) nextErrors.level = 'Required';
    if (!form.numberOfPositions || form.numberOfPositions < 1) nextErrors.numberOfPositions = 'Required';
    if (!form.requestType) nextErrors.requestType = 'Required';
    if (form.requestType === 'BACKFILL') {
      if (!form.backfillEmployeeId.trim()) nextErrors.backfillEmployeeId = 'Required';
      if (!form.backfillEmployeeName.trim()) nextErrors.backfillEmployeeName = 'Required';
    }
    if (!form.dealName.trim()) nextErrors.dealName = 'Required';
    if (!form.workLocation.trim()) nextErrors.workLocation = 'Required';
    if (!form.region.trim()) nextErrors.region = 'Required';
    Object.assign(nextErrors, getDateErrors());

    if (showAdditionalPositions) {
      const hasDraft =
        !!newChild.level ||
        newChild.openings !== 1 ||
        newChild.requestType !== 'NEW' ||
        !!newChild.backfillEmployeeId ||
        !!newChild.backfillEmployeeName;

      if (!childPositions.length && !hasDraft) {
        nextErrors.additionalPositions = 'Add at least one additional position before continuing';
      }

      if (hasDraft) {
        if (!newChild.level) nextErrors.newChildLevel = 'Required';
        if (!newChild.openings || newChild.openings < 1) nextErrors.newChildOpenings = 'Required';
        if (newChild.requestType === 'BACKFILL') {
          if (!newChild.backfillEmployeeId.trim()) nextErrors.newChildBackfillEmployeeId = 'Required';
          if (!newChild.backfillEmployeeName.trim()) nextErrors.newChildBackfillEmployeeName = 'Required';
        }
      }
    }

    return nextErrors;
  };

  const validateSubmissionDetails = () => {
    const nextErrors: Record<string, string> = {};
    if (!form.justification.trim()) nextErrors.justification = 'Required';
    if (!form.experience.trim()) nextErrors.experience = 'Required';
    if (!form.primarySkills.trim()) nextErrors.primarySkills = 'Required';
    if (!form.secondarySkills.trim()) nextErrors.secondarySkills = 'Required';
    if (!form.panelScreening.trim()) nextErrors.panelScreening = 'Required';
    if (!form.panelTechnical.trim()) nextErrors.panelTechnical = 'Required';
    if (!form.panelOps.trim()) nextErrors.panelOps = 'Required';
    return nextErrors;
  };
  const savePositionSection = () => {
    const nextErrors = { ...validateDetails(), ...validatePositionSection() };
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length) {
      alert('Please complete the required job details and upload both JD and PSQ before proceeding');
      return false;
    }

    setErrors({});
    setSectionSaved(true);
    return true;
  };

  const addChildPosition = () => {
    const nextErrors: Record<string, string> = {};
    if (!newChild.level) nextErrors.newChildLevel = 'Required';
    if (!newChild.openings || newChild.openings < 1) nextErrors.newChildOpenings = 'Required';
    if (newChild.requestType === 'BACKFILL') {
      if (!newChild.backfillEmployeeId.trim()) nextErrors.newChildBackfillEmployeeId = 'Required';
      if (!newChild.backfillEmployeeName.trim()) nextErrors.newChildBackfillEmployeeName = 'Required';
    }

    if (Object.keys(nextErrors).length) {
      setErrors((prev) => ({ ...prev, ...nextErrors }));
      return;
    }

    setChildPositions((prev) => [...prev, newChild]);
    setNewChild(emptyChild());
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy.additionalPositions;
      delete copy.newChildLevel;
      delete copy.newChildOpenings;
      delete copy.newChildBackfillEmployeeId;
      delete copy.newChildBackfillEmployeeName;
      return copy;
    });
    markDirty();
  };

  const removeChildPosition = (index: number) => {
    setChildPositions((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
    markDirty();
  };

  const submit = async () => {
    const detailErrors = validateDetails();
    const positionErrors = validatePositionSection();
    const nextErrors = { ...detailErrors, ...positionErrors };
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length) {
      alert('Please fill all mandatory fields before submitting');
      return;
    }

    if (!sectionSaved) {
      alert('Please save the position details section before submitting');
      return;
    }

    const submissionErrors = validateSubmissionDetails();
    if (Object.keys(submissionErrors).length) {
      setErrors((prev) => ({ ...prev, ...submissionErrors }));
      alert('Please complete justification, skills, experience, and panel details before submitting');
      return;
    }

    const role = authService.getRole();
    if (role !== 'VENDOR_MANAGER' && role !== 'BADGED_HIRING_MANAGER') {
      alert('Unauthorized');
      return;
    }

    try {
      setSaving(true);
      await hpeBadgedHiringService.createJob(
        {
          title: form.jobTitle,
          jobTitle: form.jobTitle,
          category: form.jobCategory,
          jobCategory: form.jobCategory,
          businessUnit: form.businessUnit,
          hiringManager: form.hiringManager,
          level: form.level,
          positions: form.numberOfPositions,
          numberOfPositions: form.numberOfPositions,
          currentPositions: form.numberOfPositions,
          location: form.workLocation,
          workLocation: form.workLocation,
          workType: form.workType,
          requestType: form.requestType,
          backfillEmployeeId: form.requestType === 'BACKFILL' ? form.backfillEmployeeId : '',
          backfillEmployeeName: form.requestType === 'BACKFILL' ? form.backfillEmployeeName : '',
          startDate: form.startDate,
          endDate: form.endDate,
          region: form.region,
          dealName: form.dealName,
          justification: form.justification,
          description: form.description,
          primarySkills: form.primarySkills,
          secondarySkills: form.secondarySkills,
          experience: form.experience,
          positionsDetail: JSON.stringify(childPositions),
        },
        { jd: jdFile, psq: psqFile },
      );
      navigate('/vendor-manager/badged-hiring/jobs');
    } catch (error: any) {
      alert(error?.response?.data?.message || 'Failed to create badged hiring job');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="badged-create-page">
      <style>{styles}</style>

      <button type="button" className="badged-back" onClick={() => navigate('/vendor-manager/badged-hiring/jobs')}>
        &lt;- Back
      </button>

      <section className="badged-intro-card">
        <h1>Job Posting</h1>
        <p>Complete all required fields to submit for CWF request</p>
      </section>

      <Section title="Details">
        <div className="badged-form-grid">
          <Field label="Job Title *" error={errors.jobTitle}>
            <input name="jobTitle" value={form.jobTitle} onChange={handleChange} />
          </Field>

          <Field label="Job Category *" error={errors.jobCategory}>
            <select name="jobCategory" value={form.jobCategory} onChange={handleChange}>
              <option value="">Select Category</option>
              {CATEGORY_OPTIONS.map((category) => <option key={category}>{category}</option>)}
            </select>
          </Field>

          <Field label="Business Unit *" error={errors.businessUnit}>
            <input name="businessUnit" value={form.businessUnit} onChange={handleChange} />
          </Field>

          <Field label="Hiring Manager *" error={errors.hiringManager}>
            <input name="hiringManager" value={form.hiringManager} onChange={handleChange} />
          </Field>

          <Field label="Work Type *">
            <select name="workType" value={form.workType} onChange={handleChange}>
              {WORK_TYPES.map((workType) => <option key={workType}>{workType}</option>)}
            </select>
          </Field>
        </div>
      </Section>

      <Section title="Job Position Details">
        <div className="badged-form-grid">
          <Field label="Job Level *" error={errors.level}>
            <select name="level" value={form.level} onChange={handleChange}>
              <option value="">Select Level</option>
              {LEVEL_OPTIONS.map((level) => <option key={level}>{level}</option>)}
            </select>
          </Field>

          <Field label="No. of Positions *" error={errors.numberOfPositions}>
            <input type="number" name="numberOfPositions" min={1} value={form.numberOfPositions} onChange={handleChange} />
          </Field>

          <Field label="Job Request Type *" error={errors.requestType}>
            <select
              name="requestType"
              value={form.requestType}
              onChange={(event) => handleRequestTypeChange(event.target.value as FormState['requestType'])}
            >
              {REQUEST_TYPES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </Field>

          <Field label="Deal Name *" error={errors.dealName}>
            <input name="dealName" value={form.dealName} onChange={handleChange} />
          </Field>

          {form.requestType === 'BACKFILL' && (
            <div className="badged-backfill-summary badged-field-full">
              <div>
                <strong>Main Position Backfill Details</strong>
                <span>
                  {form.backfillEmployeeId && form.backfillEmployeeName
                    ? `Employee 1: ${form.backfillEmployeeId} - ${form.backfillEmployeeName}`
                    : 'Backfill details are required.'}
                </span>
                {(errors.backfillEmployeeId || errors.backfillEmployeeName) && (
                  <small className="badged-error">Backfill employee ID and name are required</small>
                )}
              </div>
              <div className="badged-backfill-summary-actions">
                <button type="button" onClick={() => openBackfillModal('main')}>
                  {form.backfillEmployeeId ? 'Edit Backfill' : 'Add Backfill'}
                </button>
                <button
                  type="button"
                  className="badged-light-action"
                  onClick={() => {
                    setForm((prev) => ({
                      ...prev,
                      requestType: 'NEW',
                      backfillEmployeeId: '',
                      backfillEmployeeName: '',
                    }));
                    markDirty();
                  }}
                >
                  Remove
                </button>
              </div>
            </div>
          )}

          <div className="badged-add-launcher badged-field-full">
            <p>+ Add more positions (Click here to add more positions)</p>
            <button
              type="button"
              onClick={() => {
                setShowAdditionalPositions(true);
                markDirty();
              }}
            >
              Add Positions
            </button>
            {errors.additionalPositions && <small className="badged-error">{errors.additionalPositions}</small>}
          </div>

          {showAdditionalPositions && (
            <div className="badged-extra-panel badged-field-full">
              <div className="badged-extra-grid">
                <Field label="Level *" error={errors.newChildLevel}>
                  <select
                    value={newChild.level}
                    onChange={(event) => {
                      setNewChild((prev) => ({ ...prev, level: event.target.value }));
                      markDirty();
                    }}
                  >
                    <option value="">Select Level</option>
                    {LEVEL_OPTIONS.map((level) => <option key={level}>{level}</option>)}
                  </select>
                </Field>

                <Field label="Openings *" error={errors.newChildOpenings}>
                  <input
                    type="number"
                    min={1}
                    value={newChild.openings}
                    onChange={(event) => {
                      setNewChild((prev) => ({ ...prev, openings: Math.max(1, Number(event.target.value) || 1) }));
                      markDirty();
                    }}
                  />
                </Field>

                <Field label="Request Type *">
                  <select
                    value={newChild.requestType}
                    onChange={(event) => handleChildRequestTypeChange(event.target.value as ChildPosition['requestType'])}
                  >
                    {REQUEST_TYPES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                  </select>
                </Field>

                <button type="button" className="badged-secondary-action" onClick={addChildPosition}>
                  Add
                </button>
              </div>

              {newChild.requestType === 'BACKFILL' && (
                <div className="badged-backfill-summary badged-child-backfill-summary">
                  <div>
                    <strong>Additional Position Backfill Details</strong>
                    <span>
                      {newChild.backfillEmployeeId && newChild.backfillEmployeeName
                        ? `Employee 1: ${newChild.backfillEmployeeId} - ${newChild.backfillEmployeeName}`
                        : 'Backfill details are required.'}
                    </span>
                    {(errors.newChildBackfillEmployeeId || errors.newChildBackfillEmployeeName) && (
                      <small className="badged-error">Backfill employee ID and name are required</small>
                    )}
                  </div>
                  <div className="badged-backfill-summary-actions">
                    <button type="button" onClick={() => openBackfillModal('child')}>
                      {newChild.backfillEmployeeId ? 'Edit Backfill' : 'Add Backfill'}
                    </button>
                    <button
                      type="button"
                      className="badged-light-action"
                      onClick={() => {
                        setNewChild((prev) => ({
                          ...prev,
                          requestType: 'NEW',
                          backfillEmployeeId: '',
                          backfillEmployeeName: '',
                        }));
                        markDirty();
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}

              {childPositions.map((position, index) => (
                <div className="badged-child-row" key={`${position.level}-${index}`}>
                  <div>
                    <strong>{position.level}</strong>
                    <span>{position.openings} opening(s)</span>
                    <span>{position.requestType === 'BACKFILL' ? `Backfill: ${position.backfillEmployeeId} - ${position.backfillEmployeeName}` : 'New request'}</span>
                  </div>
                  <button type="button" onClick={() => removeChildPosition(index)}>Remove</button>
                </div>
              ))}
            </div>
          )}

          <Field label="Start Date" error={errors.startDate}>
            <input type="date" name="startDate" min={todayDate()} value={form.startDate} onChange={handleChange} />
          </Field>

          <Field label="End Date" error={errors.endDate}>
            <input type="date" name="endDate" min={form.startDate || todayDate()} value={form.endDate} onChange={handleChange} />
          </Field>

          <Field label="Work Location *" error={errors.workLocation}>
            <input name="workLocation" value={form.workLocation} onChange={handleChange} />
          </Field>

          <Field label="Region *" error={errors.region}>
            <input name="region" value={form.region} onChange={handleChange} />
          </Field>

          <Field label="Upload Job Description (JD) *" error={errors.jdFile}>
            <FileDropzone
              label="JD"
              accent="#00A982"
              file={jdFile}
              dragging={draggingJd}
              onDragState={setDraggingJd}
              onFile={(file) => {
                setJdFile(file);
                markDirty();
                setErrors((prev) => {
                  const next = { ...prev };
                  if (file) delete next.jdFile;
                  return next;
                });
              }}
              onRemove={() => {
                setJdFile(null);
                markDirty();
              }}
            />
          </Field>

          <Field label="Upload PSQ (Screening Questions) *" error={errors.psqFile}>
            <FileDropzone
              label="PSQ"
              accent="#2563EB"
              file={psqFile}
              dragging={draggingPsq}
              onDragState={setDraggingPsq}
              onFile={(file) => {
                setPsqFile(file);
                markDirty();
                setErrors((prev) => {
                  const next = { ...prev };
                  if (file) delete next.psqFile;
                  return next;
                });
              }}
              onRemove={() => {
                setPsqFile(null);
                markDirty();
              }}
            />
          </Field>
        </div>
      </Section>

      <div className="badged-save-row">
        <button type="button" className="badged-save" onClick={savePositionSection}>
          Save & Continue
        </button>
      </div>

      {!sectionSaved && (
        <div className="badged-warning">
          Upload JD and PSQ, then save the job position details section to continue with justification, skills, experience, and panel details.
        </div>
      )}

      {sectionSaved && (
        <>
          <Section title="Justification and Job Description">
            <div className="badged-form-grid">
              <Field label="Justification *" error={errors.justification} full>
                <textarea name="justification" value={form.justification} onChange={handleChange} rows={4} />
              </Field>
              <Field label="Job Description" full>
                <textarea name="description" value={form.description} onChange={handleChange} rows={5} />
              </Field>
            </div>
          </Section>

          <Section title="Skills and Experience">
            <div className="badged-form-grid">
              <Field label="Years of Experience *" error={errors.experience}>
                <input name="experience" value={form.experience} onChange={handleChange} placeholder="e.g. 5 years" />
              </Field>
              <Field label="Primary Skills *" error={errors.primarySkills}>
                <input name="primarySkills" value={form.primarySkills} onChange={handleChange} placeholder="e.g. Java, Spring Boot, Kubernetes" />
              </Field>
              <Field label="Secondary Skills *" error={errors.secondarySkills}>
                <input name="secondarySkills" value={form.secondarySkills} onChange={handleChange} placeholder="e.g. REST APIs, Docker" />
              </Field>
            </div>
          </Section>

          <Section title="Panel Details">
            <div className="badged-form-grid">
              <Field label="Screening Panel Details *" error={errors.panelScreening} full>
                <textarea name="panelScreening" value={form.panelScreening} onChange={handleChange} rows={3} placeholder="Enter screening panel names and emails" />
              </Field>
              <Field label="Technical Panel Details *" error={errors.panelTechnical} full>
                <textarea name="panelTechnical" value={form.panelTechnical} onChange={handleChange} rows={3} placeholder="Enter technical panel names and emails" />
              </Field>
              <Field label="Ops Panel Details *" error={errors.panelOps} full>
                <textarea name="panelOps" value={form.panelOps} onChange={handleChange} rows={3} placeholder="Enter ops panel names and emails" />
              </Field>
              <Field label="Panel Notes" full>
                <textarea name="panelComments" value={form.panelComments} onChange={handleChange} rows={3} placeholder="Add any interview or scheduling notes" />
              </Field>
            </div>
          </Section>

          <div className="badged-actions">
            <button type="button" className="badged-cancel" onClick={() => navigate('/vendor-manager/badged-hiring/jobs')}>
              Cancel
            </button>
            <button type="button" className="badged-submit" onClick={submit} disabled={saving}>
              {saving ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </>
      )}

      {backfillModalTarget && (
        <div className="badged-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="badged-backfill-title">
          <div className="badged-backfill-modal">
            <h3 id="badged-backfill-title">Enter Backfill Details</h3>
            <label htmlFor="badged-backfill-employee-id">Employee 1</label>
            <input
              id="badged-backfill-employee-id"
              autoFocus
              placeholder="Employee ID"
              value={backfillDraft.employeeId}
              onChange={(event) => setBackfillDraft((prev) => ({ ...prev, employeeId: event.target.value }))}
            />
            <input
              placeholder="Employee Name"
              value={backfillDraft.employeeName}
              onChange={(event) => setBackfillDraft((prev) => ({ ...prev, employeeName: event.target.value }))}
            />
            <div className="badged-modal-divider" />
            <div className="badged-modal-actions">
              <button type="button" className="badged-modal-cancel" onClick={closeBackfillModal}>
                Cancel
              </button>
              <button
                type="button"
                className="badged-modal-save"
                onClick={saveBackfillDetails}
                disabled={!backfillDraft.employeeId.trim() || !backfillDraft.employeeName.trim()}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = `

.badged-create-page,
.badged-create-page * {
  box-sizing: border-box;
}
.badged-back,
.badged-save,
.badged-submit,
.badged-file-button,
.badged-add-launcher button,
.badged-secondary-action {
  background: #00a982;
  color: #ffffff !important;
  border: 0;
  border-radius: 6px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.08);
}
.badged-back {
  padding: 10px 18px;
  margin-bottom: 32px;
}
.badged-intro-card,
.badged-form-section {
  background: #ffffff;
  border: 1px solid #d7dee8;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.10);
}
.badged-intro-card {
  padding: 28px 24px;
  margin-bottom: 30px;
}
.badged-intro-card h1 {
  margin: 0 0 6px;
  font-size: 26px;
  line-height: 1.2;
  font-weight: 700;
  color: #00112c;
}
.badged-intro-card p,
.badged-help {
  margin: 0;
  color: #50648a;
  font-size: 14px;
}
.badged-form-section {
  padding: 28px 24px 24px;
  margin-bottom: 32px;
}
.badged-form-section h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
}
.badged-section-line {
  height: 1px;
  background: #d8dee8;
  margin: 12px 0 24px;
}
.badged-form-grid,
.badged-extra-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 24px;
}
.badged-extra-grid {
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr) 88px;
  align-items: end;
}
.badged-extra-grid-two {
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  margin-top: 18px;
}
.badged-field {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 7px;
  font-size: 14px;
  font-weight: 700;
  color: #00112c;
}
.badged-field-full {
  grid-column: 1 / -1;
}
.badged-field input,
.badged-field select,
.badged-field textarea {
  width: 100%;
  min-width: 0;
  border: 1px solid #cbd5e1;
  border-radius: 5px;
  background: #ffffff;
  color: #00112c;
  font: inherit;
  font-weight: 400;
  outline: none;
}
.badged-field input,
.badged-field select {
  height: 42px;
  min-height: 42px;
  padding: 0 12px;
  line-height: 40px;
}
.badged-field textarea {
  min-height: 108px;
  padding: 10px 12px;
  line-height: 1.45;
}
.badged-field textarea {
  resize: vertical;
}
.badged-field input:focus,
.badged-field select:focus,
.badged-field textarea:focus {
  border-color: #00a982;
  box-shadow: 0 0 0 2px rgba(0, 169, 130, 0.12);
}
.badged-error {
  color: #e11d48;
  font-weight: 600;
}
.badged-add-launcher {
  min-height: 136px;
  border: 2px dashed #cbd5e1;
  border-radius: 8px;
  background: #f8fafc;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 24px;
  text-align: center;
}
.badged-add-launcher p {
  margin: 0;
  color: #334155;
  font-size: 14px;
  font-weight: 400;
}
.badged-add-launcher button,
.badged-secondary-action {
  padding: 10px 22px;
  font-size: 15px;
}
.badged-extra-panel {
  border: 1px solid #d7dee8;
  border-radius: 8px;
  background: #ffffff;
  padding: 18px;
}
.badged-child-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 12px;
  padding: 12px 14px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
}
.badged-child-row div {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
}
.badged-child-row button,
.badged-file-row button {
  border: 0;
  background: transparent;
  color: #e11d48;
  font-weight: 700;
  cursor: pointer;
}
.badged-dropzone {
  min-height: 128px;
  border: 2px dashed #cbd5e1;
  border-radius: 8px;
  background: #f8fafc;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 26px;
  text-align: center;
  transition: border-color 0.15s ease, background 0.15s ease;
}
.badged-dropzone.is-dragging {
  border-color: var(--drop-accent);
  background: #ecfdf5;
}
.badged-dropzone p {
  margin: 0;
  color: #334155;
  font-size: 16px;
  font-weight: 400;
}
.badged-file-button {
  display: inline-flex;
  padding: 10px 16px;
}
.badged-file-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 10px;
  font-size: 13px;
  color: #64748b;
}
.badged-outside-field {
  margin-bottom: 28px;
}
.badged-save-row,
.badged-actions {
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  margin-bottom: 28px;
}
.badged-save,
.badged-submit,
.badged-cancel {
  min-width: 158px;
  min-height: 42px;
  padding: 10px 20px;
  font-size: 16px;
}
.badged-cancel {
  background: #ffffff;
  border: 1px solid #d7dee8;
  border-radius: 4px;
  color: #00112c;
  cursor: pointer;
}
.badged-warning {
  border: 1px solid #facc15;
  background: #fffbeb;
  color: #92400e;
  border-radius: 4px;
  padding: 12px 16px;
  margin-bottom: 32px;
  font-size: 14px;
}
.badged-backfill-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  min-height: 72px;
  padding: 16px 18px;
  border: 1px dashed #cbd5e1;
  border-radius: 10px;
  background: #f8fafc;
}
.badged-backfill-summary strong,
.badged-backfill-summary span,
.badged-backfill-summary small {
  display: block;
}
.badged-backfill-summary strong {
  margin-bottom: 5px;
  color: #00112c;
  font-size: 14px;
  font-weight: 700;
}
.badged-backfill-summary span {
  color: #405273;
  font-size: 14px;
  font-weight: 400;
}
.badged-child-backfill-summary {
  margin-top: 18px;
}
.badged-backfill-summary-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}
.badged-backfill-summary-actions button {
  border: 0;
  border-radius: 8px;
  background: #00a982;
  color: #fff !important;
  min-height: 38px;
  padding: 0 16px;
  font-weight: 700;
  cursor: pointer;
}
.badged-backfill-summary-actions .badged-light-action {
  border: 1px solid #d7dee8;
  background: #fff;
  color: #00112c !important;
}
.badged-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(0, 0, 0, 0.42);
}
.badged-backfill-modal {
  width: min(500px, calc(100vw - 48px));
  border-radius: 4px;
  background: #fff;
  padding: 28px 24px 22px;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.22);
}
.badged-backfill-modal h3 {
  margin: 0 0 22px;
  color: #111827;
  font-size: 18px;
  font-weight: 700;
}
.badged-backfill-modal label {
  display: block;
  margin-bottom: 10px;
  color: #111827;
  font-size: 14px;
  font-weight: 700;
}
.badged-backfill-modal input {
  width: 100%;
  min-height: 42px;
  margin-bottom: 10px;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  background: #fff;
  color: #00112c;
  font: inherit;
  padding: 9px 12px;
}
.badged-backfill-modal input:focus {
  border-color: #00a982;
  box-shadow: 0 0 0 2px rgba(0, 169, 130, 0.12);
  outline: none;
}
.badged-modal-divider {
  height: 1px;
  margin: 2px 0 16px;
  background: #e5e7eb;
}
.badged-modal-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 14px;
}
.badged-modal-cancel {
  border: 0;
  background: transparent;
  color: #111827;
  font-weight: 700;
  cursor: pointer;
}
.badged-modal-save {
  min-width: 64px;
  min-height: 40px;
  border: 0;
  border-radius: 5px;
  background: #00a982;
  color: #fff !important;
  font-weight: 700;
  cursor: pointer;
}
.badged-modal-save:disabled {
  background: #d1d5db;
  cursor: not-allowed;
}
.badged-submit:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}
@media (max-width: 900px) {
  .badged-create-page { padding: 24px 20px 42px; }
  .badged-form-grid,
  .badged-extra-grid,
  .badged-extra-grid-two { grid-template-columns: 1fr; }
}
`;

export default BadgedCreateJob;
