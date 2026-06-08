import { useEffect, useState } from 'react';
import type { Dispatch, KeyboardEvent, ReactNode, SetStateAction } from 'react';
import {
  Box,
  Button,
  FormField,
  Heading,
  Layer,
  Text,
  TextInput,
  TextArea,
} from 'grommet';
import api from '../../api/api';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

interface Panel {
  name: string;
  email: string;
}

interface InterviewRound {
  roundName: string;
  mode: string;
  panels: Panel[];
}

interface ChildPosition {
  level: string;
  openings: number;
  requestType?: 'NEW' | 'BACKFILL';
  backfillEmployeeId?: string;
  backfillEmployeeName?: string;
}

const LEVEL_OPTIONS = ['ENT','INT','SPE','EXP','MAS','MAS 1'];
const SKILL_SUGGESTIONS = [
  'JavaScript',
  'TypeScript',
  'React',
  'Node.js',
  'NestJS',
  'Angular',
  'Vue.js',
  'HTML',
  'CSS',
  'Grommet',
  'Java',
  'Spring Boot',
  'Python',
  'Django',
  'Flask',
  'C#',
  '.NET',
  'PHP',
  'Laravel',
  'MySQL',
  'PostgreSQL',
  'MongoDB',
  'Redis',
  'GraphQL',
  'REST API',
  'AWS',
  'Azure',
  'GCP',
  'Docker',
  'Kubernetes',
  'Jenkins',
  'Terraform',
  'Selenium',
  'Playwright',
  'Cypress',
  'Manual Testing',
  'Automation Testing',
  'DevOps',
  'Linux',
  'Agile',
  'Scrum',
  'Data Analysis',
  'Power BI',
  'Tableau',
  'Machine Learning',
  'Communication',
  'Leadership',
  'Problem Solving',
];

const CreateJob = () => {

const navigate = useNavigate();
const location = useLocation();



const { id } = useParams(); // jobId for edit
const isEditMode = !!id;
const prefetchedJob = (location.state as { job?: any } | null)?.job;

const [loading,setLoading] = useState(false);
const [jdFiles, setJdFiles] = useState<File[]>([]);
const [psqFiles, setPsqFiles] = useState<File[]>([]);
const [isDraggingPSQ, setIsDraggingPSQ] = useState(false);
const [isDragging, setIsDragging] = useState(false);


const [form,setForm] = useState({

jobTitle:'',
jobCategory:'',
businessUnit:'MS',   // fixed MS
hiringManager:'',

workLocation:'',
workType:'Onsite',

requestType:'NEW',
backfillEmployeeId:'',
backfillEmployeeName:'',

startDate:'',
endDate:'',

level:'',
numberOfPositions:1,

region:'',
dealName:'',

justification:'',

description:'',
primarySkills:'',
secondarySkills:'',
experience:''

});

const [backfill,setBackfill] = useState({
employeeId:'',
employeeName:''
});

const [childPositions,setChildPositions] = useState<ChildPosition[]>([]);
const [activeBackfillIndex,setActiveBackfillIndex] = useState<number | null>(null);

const [newChild,setNewChild] = useState<ChildPosition>({
  level:'',
  openings:1,
  requestType:'NEW',
  backfillEmployeeId:'',
  backfillEmployeeName:''
});

const [rounds,setRounds] = useState<InterviewRound[]>([]);

const [newRoundName,setNewRoundName] = useState('');
const [newRoundMode,setNewRoundMode] = useState('Virtual');

const [panelName,setPanelName] = useState('');
const [panelEmail,setPanelEmail] = useState('');
const [editingPanel, setEditingPanel] = useState<{
  roundIndex: number;
  panelIndex: number;
} | null>(null);
const [panels,setPanels] = useState<Panel[]>([]);
const [showAdditionalPositions, setShowAdditionalPositions] = useState(false);
const [isSectionSaved, setIsSectionSaved] = useState(isEditMode);
const [errors, setErrors] = useState<any>({});
const [primarySkillInput, setPrimarySkillInput] = useState('');
const [secondarySkillInput, setSecondarySkillInput] = useState('');

// 🔥 MULTI BACKFILL SUPPORT
const [backfillList, setBackfillList] = useState<
  { employeeId: string; employeeName: string }[]
>([]);

const applyJobToForm = (job: any) => {
  if (!job) return;

  setForm({
    jobTitle: job.title || '',
    jobCategory: job.jobCategory || '',
    businessUnit: 'MS',
    hiringManager: job.hiringManager || '',

    workLocation: job.location || '',
    workType: job.workType || 'Onsite',

    requestType: job.requestType || 'NEW',
    backfillEmployeeId: job.backfillEmployeeId || '',
    backfillEmployeeName: job.backfillEmployeeName || '',

    startDate: job.startDate?.split('T')[0] || '',
    endDate: job.endDate?.split('T')[0] || '',

    level: job.level || '',
    numberOfPositions: job.numberOfPositions || 1,

    region: job.region || '',
    dealName: job.dealName || '',

    justification: job.justification || '',

    description: job.description || '',
    primarySkills: job.primarySkills || '',
    secondarySkills: job.secondarySkills || '',
    experience: job.experience || ''
  });

  setChildPositions(job.positions || []);
  setRounds(job.interviewRounds || []);
  setShowAdditionalPositions((job.positions || []).length > 0);
  setIsSectionSaved(true);
};

const parseBackfillEntries = (raw?: string) => {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter(
          (item) =>
            item &&
            typeof item.employeeId === 'string' &&
            typeof item.employeeName === 'string',
        )
      : [];
  } catch {
    return [];
  }
};

const mainBackfillEntries = parseBackfillEntries(form.backfillEmployeeId);

const getChildBackfillEntries = (position: ChildPosition) =>
  parseBackfillEntries(position.backfillEmployeeId);

const resetMainBackfill = () => {
  setForm((prev) => ({
    ...prev,
    requestType: 'NEW',
    backfillEmployeeId: '',
    backfillEmployeeName: '',
  }));
  setBackfillList([]);
};

const openMainBackfillModal = () => {
  const count = Number(form.numberOfPositions) || 1;
  const existingEntries = parseBackfillEntries(form.backfillEmployeeId);

  setBackfillList(
    existingEntries.length
      ? existingEntries
      : Array.from({ length: count }, () => ({
          employeeId: '',
          employeeName: '',
        })),
  );
  setActiveBackfillIndex(-2);
};

const closeBackfillModal = (options?: { revertMainRequestType?: boolean }) => {
  if (activeBackfillIndex === -2 && options?.revertMainRequestType) {
    resetMainBackfill();
  }

  if (activeBackfillIndex === -1 && options?.revertMainRequestType) {
    setNewChild((prev) => ({
      ...prev,
      requestType: 'NEW',
      backfillEmployeeId: '',
      backfillEmployeeName: '',
    }));
    setBackfillList([]);
  }

  if (
    activeBackfillIndex !== null &&
    activeBackfillIndex >= 0 &&
    options?.revertMainRequestType
  ) {
    setChildPositions((prev) =>
      prev.map((position, index) =>
        index === activeBackfillIndex
          ? {
              ...position,
              requestType: 'NEW',
              backfillEmployeeId: '',
              backfillEmployeeName: '',
            }
          : position,
      ),
    );
    setBackfillList([]);
  }

  setActiveBackfillIndex(null);
};

const openNewChildBackfillModal = () => {
  const count = Number(newChild.openings) || 1;
  const existingEntries = parseBackfillEntries(newChild.backfillEmployeeId);

  setBackfillList(
    existingEntries.length
      ? existingEntries
      : Array.from({ length: count }, () => ({
          employeeId: '',
          employeeName: '',
        })),
  );
  setActiveBackfillIndex(-1);
};

const openExistingChildBackfillModal = (index: number) => {
  const position = childPositions[index];
  const count = Number(position?.openings) || 1;
  const existingEntries = position ? getChildBackfillEntries(position) : [];

  setBackfillList(
    existingEntries.length
      ? existingEntries
      : Array.from({ length: count }, () => ({
          employeeId: '',
          employeeName: '',
        })),
  );
  setActiveBackfillIndex(index);
};

const resetExistingChildBackfill = (index: number) => {
  setChildPositions((prev) =>
    prev.map((position, positionIndex) =>
      positionIndex === index
        ? {
            ...position,
            requestType: 'NEW',
            backfillEmployeeId: '',
            backfillEmployeeName: '',
          }
        : position,
    ),
  );
  setIsSectionSaved(false);
};


/* AUTO SET HM */

useEffect(()=>{

const token = localStorage.getItem('token');
if(!token) return;

try{

const payload = JSON.parse(atob(token.split('.')[1]));
const email = payload.email || payload.username;

if(email){
setForm(prev=>({...prev,hiringManager:email}));
}

}catch{}

},[]);

useEffect(() => {
  if (!isEditMode || !prefetchedJob) return;
  applyJobToForm(prefetchedJob);
}, [isEditMode, prefetchedJob]);

useEffect(() => {
  if (!isEditMode) return;

  const fetchJob = async () => {
    try {
      const res = await api.get(`/jobs/${id}`);
      applyJobToForm(res.data);

    } catch {
      alert('Failed to load job');
    }
  };

  fetchJob();
}, [id]);

useEffect(() => {
  if (activeBackfillIndex === null) return;

  const handleEscape = (event: globalThis.KeyboardEvent) => {
    if (event.key !== 'Escape') return;

    if (activeBackfillIndex === -2) {
      closeBackfillModal({ revertMainRequestType: true });
      return;
    }

    closeBackfillModal({ revertMainRequestType: true });
  };

  window.addEventListener('keydown', handleEscape);
  return () => window.removeEventListener('keydown', handleEscape);
}, [activeBackfillIndex]);



/* TEMPLATE */

const fetchTemplate = async(title:string)=>{

if(!title.trim()) return;

try{

const res = await api.get(`/jobs/template/${encodeURIComponent(title)}`);

const template = res.data;

if(!template) return;

setForm(prev=>({

...prev,
workLocation:template.location || prev.workLocation,
experience:template.experience || prev.experience,
description:template.description || prev.description

}));

if(template.positions?.length){
setChildPositions(template.positions);
}

if(template.interviewRounds?.length){
setRounds(template.interviewRounds);
}

}catch{}

};

const splitSkills = (value?: string) =>
  (value || '')
    .split(',')
    .map((skill) => skill.trim())
    .filter(Boolean);

const primarySkills = splitSkills(form.primarySkills);
const secondarySkills = splitSkills(form.secondarySkills);

const updateSkills = (
  field: 'primarySkills' | 'secondarySkills',
  skills: string[],
) => {
  const uniqueSkills = Array.from(
    new Set(
      skills
        .map((skill) => skill.trim())
        .filter(Boolean),
    ),
  );

  setForm((prev) => ({
    ...prev,
    [field]: uniqueSkills.join(','),
  }));
};

const addSkill = (
  field: 'primarySkills' | 'secondarySkills',
  rawSkill: string,
) => {
  const skill = rawSkill.trim();
  if (!skill) return;

  const currentSkills =
    field === 'primarySkills' ? primarySkills : secondarySkills;

  if (
    currentSkills.some(
      (existingSkill) =>
        existingSkill.toLowerCase() === skill.toLowerCase(),
    )
  ) {
    return;
  }

  updateSkills(field, [...currentSkills, skill]);
};

const removeSkill = (
  field: 'primarySkills' | 'secondarySkills',
  skillToRemove: string,
) => {
  const currentSkills =
    field === 'primarySkills' ? primarySkills : secondarySkills;

  updateSkills(
    field,
    currentSkills.filter((skill) => skill !== skillToRemove),
  );
};

const getSkillSuggestions = (
  input: string,
  selectedSkills: string[],
) => {
  const query = input.trim().toLowerCase();
  if (!query) return [];

  return SKILL_SUGGESTIONS.filter((skill) => {
    const alreadySelected = selectedSkills.some(
      (selectedSkill) => selectedSkill.toLowerCase() === skill.toLowerCase(),
    );

    return !alreadySelected && skill.toLowerCase().includes(query);
  }).slice(0, 8);
};

const primarySkillSuggestions = getSkillSuggestions(
  primarySkillInput,
  primarySkills,
);
const secondarySkillSuggestions = getSkillSuggestions(
  secondarySkillInput,
  secondarySkills,
);

const handleSkillKeyDown = (
  event: KeyboardEvent<HTMLInputElement>,
  field: 'primarySkills' | 'secondarySkills',
  inputValue: string,
  clearInput: Dispatch<SetStateAction<string>>,
) => {
  if (event.key !== 'Enter') return;

  event.preventDefault();
  addSkill(field, inputValue);
  clearInput('');
};

const sanitizeEmployeeId = (value: string) =>
  value.replace(/\D/g, '').slice(0, 9);

const isBackfillListValid =
  backfillList.length > 0 &&
  backfillList.every(
    (employee) =>
      employee.employeeId.trim().length > 0 &&
      employee.employeeName.trim().length > 0,
  );



const handleChange=(e:any)=>{

const {name,value}=e.target;

setForm(prev=>({...prev,[name]:value}));

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
    'justification',
  ].includes(name)
) {
  setIsSectionSaved(false);
}

// ✅ HANDLE MAIN BACKFILL
if(name==='requestType'){

  if (name === 'requestType') {
  if (value === 'BACKFILL') {
    openMainBackfillModal();
  } else {
    closeBackfillModal();
    resetMainBackfill();
  }
}

}

};



const validateFile = (file: File) => {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  if (!allowedTypes.includes(file.type)) {
    alert('Only PDF, DOC, DOCX files are allowed');
    return false;
  }

  return true;
};

const getValidFiles = (files: FileList | File[]) =>
  Array.from(files).filter((file) => validateFile(file));

const mergeFiles = (currentFiles: File[], incomingFiles: File[]) => {
  const seen = new Set(
    currentFiles.map((file) => `${file.name}-${file.size}-${file.lastModified}`),
  );

  const uniqueIncoming = incomingFiles.filter((file) => {
    const key = `${file.name}-${file.size}-${file.lastModified}`;
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });

  return [...currentFiles, ...uniqueIncoming];
};

const handleDrop = (e: React.DragEvent) => {
  e.preventDefault();
  setIsDragging(false);

  const files = getValidFiles(e.dataTransfer.files);
  if (files.length) {
    setJdFiles((prev) => mergeFiles(prev, files));
  }
};

// ✅ PSQ HANDLERS (ADD HERE)

const handlePSQDrop = (e: React.DragEvent) => {
  e.preventDefault();
  setIsDraggingPSQ(false);

  const files = getValidFiles(e.dataTransfer.files);
  if (files.length) {
    setPsqFiles((prev) => mergeFiles(prev, files));
  }
};

const handlePSQDragOver = (e: React.DragEvent) => {
  e.preventDefault();
  setIsDraggingPSQ(true);
};

const handlePSQDragLeave = () => {
  setIsDraggingPSQ(false);
};

const removePSQ = () => {
  setPsqFiles([]);
};

const handleDragOver = (e: React.DragEvent) => {
  e.preventDefault();
  setIsDragging(true);
};

const handleDragLeave = () => {
  setIsDragging(false);
};

const removeFile = () => {
  setJdFiles([]);
};

const addMoreJdFiles = (files: FileList | null) => {
  const validFiles = files ? getValidFiles(files) : [];
  if (validFiles.length) {
    setJdFiles((prev) => mergeFiles(prev, validFiles));
  }
};

const addMorePsqFiles = (files: FileList | null) => {
  const validFiles = files ? getValidFiles(files) : [];
  if (validFiles.length) {
    setPsqFiles((prev) => mergeFiles(prev, validFiles));
  }
};



/* CHILD POSITIONS */

const addChildPosition=()=>{

const newErrors: any = {};

if(!newChild.level) newErrors.newChildLevel = 'Required';
if(!newChild.openings || newChild.openings < 1) {
  newErrors.newChildOpenings = 'Required';
}
if(!newChild.requestType) newErrors.newChildRequestType = 'Required';
if (Object.keys(newErrors).length > 0) {
  setErrors((prev: any) => ({ ...prev, ...newErrors }));
  alert('Please fill all additional position details before adding');
  return;
}

let updatedChild = { ...newChild };

if (newChild.requestType === 'BACKFILL') {
  updatedChild.backfillEmployeeId = JSON.stringify(backfillList);
}

setChildPositions([...childPositions,updatedChild]);
setErrors((prev: any) => ({
  ...prev,
  additionalPositions: undefined,
  newChildLevel: undefined,
  newChildOpenings: undefined,
  newChildRequestType: undefined,
}));
setIsSectionSaved(false);

setNewChild({
  level:'',
  openings:1,
  requestType:'NEW'
});

};


const removeChildPosition=(index:number)=>{
setChildPositions(childPositions.filter((_,i)=>i!==index));
setIsSectionSaved(false);
};


const handleChildRequestTypeChange = (index:number,value:'NEW'|'BACKFILL')=>{
  const updated=[...childPositions];
  updated[index].requestType=value;

  if(value === 'BACKFILL'){
    setActiveBackfillIndex(index);
    setBackfill({employeeId:'',employeeName:''});
  }

  setChildPositions(updated);
};

const saveBackfill = () => {

  // ✅ CASE 1: MAIN JOB BACKFILL
  if(activeBackfillIndex === -2){
    setForm(prev => ({
      ...prev,
      requestType: 'BACKFILL',
      backfillEmployeeId: JSON.stringify(backfillList),
      backfillEmployeeName: 'MULTIPLE'
    }));

    setActiveBackfillIndex(null);
    return;
  }

  // ✅ CASE 2: NEW CHILD
  if(activeBackfillIndex === -1){
    setNewChild(prev => ({
      ...prev,
      requestType: 'BACKFILL',
      backfillEmployeeId: JSON.stringify(backfillList),
      backfillEmployeeName: 'MULTIPLE'
    }));

    setActiveBackfillIndex(null);
    return;
  }

  // ✅ CASE 3: EXISTING CHILD
  if(activeBackfillIndex !== null && activeBackfillIndex >= 0){
    const updated = [...childPositions];

    if(!updated[activeBackfillIndex]) return;

    updated[activeBackfillIndex].requestType = 'BACKFILL';
    updated[activeBackfillIndex].backfillEmployeeId = JSON.stringify(backfillList);
    updated[activeBackfillIndex].backfillEmployeeName = 'MULTIPLE';

    setChildPositions(updated);
  }

  setActiveBackfillIndex(null);
};



/* PANELS */

const addPanel = () => {
  if (!panelName || !panelEmail || !newRoundName) return;

  const newPanel = {
    name: panelName,
    email: panelEmail,
  };

  setRounds((prevRounds) => {
    let updated = [...prevRounds];

    // ✅ EDIT MODE
    if (editingPanel) {
      updated[editingPanel.roundIndex].panels[editingPanel.panelIndex] = newPanel;
      return updated;
    }

    const existingRoundIndex = prevRounds.findIndex(
      (r) => r.roundName === newRoundName
    );

    // ✅ ADD MODE
    if (existingRoundIndex !== -1) {
      updated[existingRoundIndex].panels.push(newPanel);
      return updated;
    }

    // ✅ CREATE NEW ROUND
    return [
      ...prevRounds,
      {
        roundName: newRoundName,
        mode: newRoundMode,
        panels: [newPanel],
      },
    ];
  });

  // reset
  setPanelName('');
  setPanelEmail('');
  setEditingPanel(null);
};

const removePanel = (roundIndex: number, panelIndex: number) => {
  setRounds((prev) => {
    const updated = [...prev];
    updated[roundIndex].panels.splice(panelIndex, 1);
    return updated;
  });
};

const editPanel = (roundIndex: number, panelIndex: number) => {
  const panel = rounds[roundIndex].panels[panelIndex];

  setPanelName(panel.name);
  setPanelEmail(panel.email);

  setNewRoundName(rounds[roundIndex].roundName);
  setNewRoundMode(rounds[roundIndex].mode);

  setEditingPanel({ roundIndex, panelIndex });
};

/*Validation*/

const validatePositionSection = () => {
  const newErrors: any = {};

  if (!form.level) newErrors.level = 'Required';
  if (!form.numberOfPositions || form.numberOfPositions < 1)
    newErrors.numberOfPositions = 'Required';
  if (!form.requestType) newErrors.requestType = 'Required';
  if (!form.dealName.trim()) newErrors.dealName = 'Required';
  if (!form.workLocation.trim()) newErrors.workLocation = 'Required';
  if (!form.region.trim()) newErrors.region = 'Required';

  setErrors(newErrors);

  return Object.keys(newErrors).length === 0;
};

const handleSavePositionSection = () => {
  const newErrors: any = {};

  if (!form.level) newErrors.level = 'Required';
  if (!form.numberOfPositions || form.numberOfPositions < 1) {
    newErrors.numberOfPositions = 'Required';
  }
  if (!form.requestType) newErrors.requestType = 'Required';
  if (!form.dealName.trim()) newErrors.dealName = 'Required';
  if (!form.workLocation.trim()) newErrors.workLocation = 'Required';
  if (!form.region.trim()) newErrors.region = 'Required';

  if (showAdditionalPositions) {
    if (!childPositions.length) {
      newErrors.additionalPositions =
        'Add at least one additional position before continuing';
    }

    const hasDraftChild =
      !!newChild.level ||
      newChild.openings !== 1 ||
      newChild.requestType !== 'NEW' ||
      !!newChild.backfillEmployeeId ||
      !!newChild.backfillEmployeeName;

    if (hasDraftChild) {
      if (!newChild.level) newErrors.newChildLevel = 'Required';
      if (!newChild.openings || newChild.openings < 1) {
        newErrors.newChildOpenings = 'Required';
      }
      if (!newChild.requestType) newErrors.newChildRequestType = 'Required';
    }
  }

  setErrors(newErrors);
  const isValid = Object.keys(newErrors).length === 0;

  if (!isValid) {
    alert('Please fill all mandatory fields before proceeding');
    return;
  }

  setIsSectionSaved(true);
};

/* SUBMIT */

const submit = async()=>{

if (!isSectionSaved) {
  alert('Please save the position details section before submitting');
  return;
}

try{

setLoading(true);

const jobRes = isEditMode
  ? await api.patch(`/jobs/${id}`, {
      ...form,
      status: 'PENDING_APPROVAL', // 🔥 resend for approval
      positions: childPositions,
      interviewRounds: rounds
    })
  : await api.post('/jobs', {
      title: form.jobTitle,
      location: form.workLocation,
      experience: form.experience,
      department: 'MS',
      employmentType: 'Contingent',
      startDate: form.startDate,
      endDate: form.endDate,
      description: form.description,
      jobCategory: form.jobCategory,
      workType: form.workType,
      region: form.region,
      dealName: form.dealName,
      justification: form.justification,
      level: form.level,
      numberOfPositions: form.numberOfPositions,
      requestType: form.requestType,
      backfillEmployeeId: form.requestType === 'BACKFILL'
  ? JSON.stringify(backfillList)
  : null,

backfillEmployeeName: form.requestType === 'BACKFILL'
  ? 'MULTIPLE'
  : null,
      interviewRounds: rounds,
      positions: childPositions
    });

const jobId = isEditMode ? id : jobRes.data.id;

/* JD upload same as before */

if(jdFiles.length){
const fd=new FormData();
jdFiles.forEach((file) => fd.append('jd', file));
await api.post(`/jobs/${jobId}/jd`,fd,{headers:{'Content-Type':'multipart/form-data'}});
}

// ✅ PSQ UPLOAD (ADD THIS BLOCK)
if(psqFiles.length){
  const fd = new FormData();
  psqFiles.forEach((file) => fd.append('psq', file));

  await api.post(`/jobs/${jobId}/psq`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
}

let positionsFromDB: any[] = [];

try {
  const fullJob = await api.get(`/jobs/${jobId}`);
  positionsFromDB = fullJob.data.positions || [];
} catch (err) {
  console.warn('Job fetch skipped (non-blocking)', err);
}
navigate('/hiring-manager/jobs');

}catch{

alert('Job creation failed');

}finally{

setLoading(false);

}

};



return(

<div style={styles.pageShell}>

<div>
  <button
    type="button"
    onClick={() => navigate('/hiring-manager/jobs')}
    style={{ background: '#01A982', color: 'white', borderRadius: 6, padding: '8px 16px', fontSize: 14, fontWeight: 500, border: 'none', boxShadow: '0 1px 2px rgba(15,23,42,0.08)' }}
  >
    ← Back
  </button>
</div>


<div style={{ background: 'white', boxShadow: '0 1px 3px rgba(15,23,42,0.12)', borderRadius: 8, padding: 24 }}>

<h1 style={{ fontSize: 24, fontWeight: 600 }}>
{isEditMode ? 'Edit Job' : 'Job Posting'}
</h1>

<p style={{ fontSize: 14, color: '#6B7280', marginTop: 4 }}>
Complete all required fields to submit for CWF request
</p>

</div>



{/* BASIC */}

<Section title="Details">

<Grid>

<Field label="Job Title *">
<input
name="jobTitle"
value={form.jobTitle}
onChange={handleChange}
onBlur={(e)=>fetchTemplate(e.target.value)}
style={styles.input}
/>
</Field>


<Field label="Job Category *">
<select
name="jobCategory"
value={form.jobCategory}
onChange={handleChange}
style={styles.input}
>
<option value="">Select Category</option>
<option>IT & Consulting</option>
<option>Marketing</option>
<option>Sales</option>
<option>Security</option>
<option>Cloud</option>
<option>Development</option>
</select>
</Field>


<Field label="Business Unit *">
<input
value="MS"
disabled
style={styles.readOnlyInput}
/>
</Field>


<Field label="Hiring Manager *">
<input
value={form.hiringManager}
disabled
style={styles.readOnlyInput}
/>
</Field>


<Field label="Work Type *">
<select
name="workType"
value={form.workType}
onChange={handleChange}
style={styles.input}
>
<option>Onsite</option>
<option>Remote</option>
<option>Hybrid</option>
</select>
</Field>

</Grid>

</Section>



{/* POSITION DETAILS */}

<Section title="Job Position Details">

<Grid>

  <Field label="Job Level *">
<select
name="level"
value={form.level}
onChange={handleChange}
style={styles.input}
>
<option value="">Select Level</option>
{LEVEL_OPTIONS.map(l => (
<option key={l} value={l}>{l}</option>
))}
</select>
{errors.level && <p style={styles.errorText}>{errors.level}</p>}
</Field>

<Field label="No. of Positions *">
<input
type="number"
name="numberOfPositions"
value={form.numberOfPositions}
min={1}
onChange={(e) => {
  const count = Number(e.target.value);

  setForm(prev => ({
    ...prev,
    numberOfPositions: count
  }));

  // 🔥 auto prepare backfill if needed
  if (form.requestType === 'BACKFILL') {
    setBackfillList(
      Array.from({ length: count || 1 }, () => ({
        employeeId: '',
        employeeName: ''
      }))
    );
  }
}}
style={styles.input}
/>
{errors.numberOfPositions && <p style={styles.errorText}>{errors.numberOfPositions}</p>}
</Field>

<Field label="Job Request Type *">
<select
name="requestType"
value={form.requestType}
onChange={handleChange}
style={styles.input}
>
<option value="NEW">New Request</option>
<option value="BACKFILL">Backfill</option>
</select>
{errors.requestType && <p style={styles.errorText}>{errors.requestType}</p>}
</Field>

{form.requestType === 'BACKFILL' && !!mainBackfillEntries.length && (
  <div style={{ gridColumn: 'span 2', borderRadius: 12, border: '1px solid #A7F3D0', background: 'rgba(236,253,245,0.6)', padding: 16 }}>
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
      <div>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: '#1E293B' }}>
          Main Position Backfill Details
        </h3>
        <p style={{ marginTop: 4, fontSize: 12, color: '#64748B' }}>
          These employee details apply only to the main job position.
        </p>
      </div>

      <div style={styles.inlineRowGap}>
        <button
          type="button"
          onClick={openMainBackfillModal}
          style={{ borderRadius: 6, border: '1px solid #A7F3D0', background: 'white', padding: '6px 12px', fontSize: 12, fontWeight: 500, color: '#047857' }}
        >
          Edit
        </button>
        <button
          type="button"
          onClick={resetMainBackfill}
          style={{ borderRadius: 6, border: '1px solid #FECDD3', background: 'white', padding: '6px 12px', fontSize: 12, fontWeight: 500, color: '#E11D48' }}
        >
          Remove
        </button>
      </div>
    </div>

    <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {mainBackfillEntries.map((employee, index) => (
        <div
          key={`${employee.employeeId}-${index}`}
          style={{ borderRadius: 8, border: '1px solid rgba(255,255,255,0.7)', background: 'white', padding: '8px 12px', fontSize: 14 }}
        >
          <p style={{ fontWeight: 500, color: '#1E293B' }}>
            Employee {index + 1}
          </p>
          <p style={{ marginTop: 4, color: '#475569' }}>
            <span style={{ fontWeight: 500 }}>EMP ID:</span> {employee.employeeId || '-'}
          </p>
          <p style={{ color: '#475569' }}>
            <span style={{ fontWeight: 500 }}>EMP Name:</span> {employee.employeeName || '-'}
          </p>
        </div>
      ))}
    </div>
  </div>
)}

<Field label="Deal Name *">
<input
name="dealName"
value={form.dealName}
onChange={handleChange}
style={styles.input}
/>
{errors.dealName && <p style={styles.errorText}>{errors.dealName}</p>}
</Field>

{/* FULL WIDTH ADD POSITION BLOCK */}

<div style={{ ...styles.fullWidth, gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: 12 }}>

  <div
    onClick={() => {
      setShowAdditionalPositions(true);
      setIsSectionSaved(false);
    }}
    style={styles.additionalPositionsLauncher}
  >
    <p style={{ color: '#4B5563', fontSize: 14 }}>
      + Add more positions (Click here to add more positions)
    </p>

    <button
      type="button"
      style={{ marginTop: 12, padding: '8px 20px', background: '#059669', color: 'white', borderRadius: 6, border: 'none' }}
    >
      Add Positions
    </button>
  </div>

</div>

{showAdditionalPositions && (
  <div style={{ ...styles.outlinedCard, gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: 16 }}>

    <div>
      <h3 style={{ fontWeight: 500 }}>
        Additional Positions (If more than one position is required)
      </h3>
      <p style={{ marginTop: 4, fontSize: 14, color: '#6B7280' }}>
        Fill every field, then click Add before continuing.
      </p>
      {errors.additionalPositions && (
        <p style={{ marginTop: 8, fontSize: 12, color: '#EF4444' }}>{errors.additionalPositions}</p>
      )}
    </div>

    <div style={styles.fourColumnGrid}>

      <div>
        <select
          value={newChild.level}
          onChange={(e)=>{
            setNewChild({...newChild,level:e.target.value});
            setIsSectionSaved(false);
          }}
          style={styles.input}
        >
          <option value="">Level</option>
          {LEVEL_OPTIONS.map(l=><option key={l}>{l}</option>)}
        </select>
        {errors.newChildLevel && (
          <p style={{ marginTop: 4, fontSize: 12, color: '#EF4444' }}>{errors.newChildLevel}</p>
        )}
      </div>

      <div>
        <input
          type="number"
          placeholder="Openings"
          value={newChild.openings}
          onChange={(e)=>{
            const value = Number(e.target.value);

            setNewChild({...newChild,openings:value});
            setIsSectionSaved(false);

            if(newChild.requestType === 'BACKFILL'){
              openNewChildBackfillModal();
            }
          }}
          style={styles.input}
        />
        {errors.newChildOpenings && (
          <p style={{ marginTop: 4, fontSize: 12, color: '#EF4444' }}>{errors.newChildOpenings}</p>
        )}
      </div>

      <div>
        <select
          value={newChild.requestType || 'NEW'}
          onChange={(e)=>{
            const value = e.target.value as 'NEW' | 'BACKFILL';
            setNewChild({
              ...newChild,
              requestType:value,
              ...(value === 'NEW'
                ? {
                    backfillEmployeeId: '',
                    backfillEmployeeName: '',
                  }
                : {}),
            });
            setIsSectionSaved(false);

            if(value === 'BACKFILL'){
              openNewChildBackfillModal();
            }
          }}
          style={styles.input}
        >
          <option value="NEW">New</option>
          <option value="BACKFILL">Backfill</option>
        </select>
        {errors.newChildRequestType && (
          <p style={{ marginTop: 4, fontSize: 12, color: '#EF4444' }}>{errors.newChildRequestType}</p>
        )}
      </div>

      <button
        type="button"
        onClick={addChildPosition}
        style={{ background: '#374151', color: 'white', padding: '8px 16px', borderRadius: 6, border: 'none' }}
      >
        Add
      </button>

    </div>

    {childPositions.map((pos,index)=>(
      <div
        key={index}
        style={styles.childPositionCard}
      >
        <div style={styles.inlineRowBetween}>
          <div style={{ fontSize: 14 }}>
            <strong>{pos.level}</strong> - {pos.openings} openings
            <br />
            Request Type: <strong>{pos.requestType || 'NEW'}</strong>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {pos.requestType === 'BACKFILL' && (
              <>
                <button
                  type="button"
                  onClick={() => openExistingChildBackfillModal(index)}
                  style={{ fontSize: 12, fontWeight: 500, color: '#047857' }}
                >
                  Edit Backfill
                </button>
                <button
                  type="button"
                  onClick={() => resetExistingChildBackfill(index)}
                  style={{ fontSize: 12, fontWeight: 500, color: '#F43F5E' }}
                >
                  Remove Backfill
                </button>
              </>
            )}
          </div>
        </div>

        {pos.requestType === 'BACKFILL' && getChildBackfillEntries(pos).length > 0 && (
          <div style={{ marginTop: 12, borderRadius: 8, border: '1px solid #A7F3D0', background: 'rgba(236,253,245,0.6)', padding: 12 }}>
            <p style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#047857' }}>
              Backfill Details
            </p>

            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {getChildBackfillEntries(pos).map((employee, employeeIndex) => (
                <div
                  key={`${employee.employeeId}-${employeeIndex}`}
                  style={{ borderRadius: 6, background: 'white', padding: '8px 12px', fontSize: 14, color: '#334155' }}
                >
                  <p style={{ fontWeight: 500, color: '#1E293B' }}>
                    Employee {employeeIndex + 1}
                  </p>
                  <p style={{ marginTop: 4 }}>
                    <span style={{ fontWeight: 500 }}>EMP ID:</span> {employee.employeeId || '-'}
                  </p>
                  <p>
                    <span style={{ fontWeight: 500 }}>EMP Name:</span> {employee.employeeName || '-'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    ))}

  </div>
)}

<Field label="Start Date">
<input
type="date"
name="startDate"
value={form.startDate}
onChange={handleChange}
style={styles.input}
/>
</Field>


<Field label="End Date">
<input
type="date"
name="endDate"
value={form.endDate}
onChange={handleChange}
style={styles.input}
/>
</Field>


<Field label="Work Location *">
<input
name="workLocation"
value={form.workLocation}
onChange={handleChange}
style={styles.input}
/>
{errors.workLocation && <p style={styles.errorText}>{errors.workLocation}</p>}
</Field>


<Field label="Region *">
<input
name="region"
value={form.region}
onChange={handleChange}
style={styles.input}
/>
{errors.region && <p style={styles.errorText}>{errors.region}</p>}
</Field>



<Field label="Upload Job Description (JD)">

<div
  onDrop={handleDrop}
  onDragOver={handleDragOver}
  onDragLeave={handleDragLeave}
  style={{
    border: `2px dashed ${isDragging ? '#10B981' : '#D1D5DB'}`,
    borderRadius: 8,
    padding: 24,
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    background: isDragging ? '#ECFDF5' : '#F9FAFB',
  }}
>

  {!jdFiles.length ? (
    <>
      <p style={{ color: '#4B5563' }}>
        Drag & drop JD here or click to upload
      </p>

      <input
        type="file"
        multiple
        accept=".pdf,.doc,.docx"
        onChange={(e) => addMoreJdFiles(e.target.files)}
        style={{ display: 'none' }}
        id="jdUpload"
      />

      <label
        htmlFor="jdUpload"
        style={{ marginTop: 12, display: 'inline-block', padding: '8px 16px', background: '#059669', color: 'white', borderRadius: 6, cursor: 'pointer' }}
      >
        Choose File
      </label>
    </>
  ) : (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {jdFiles.map((file, index) => (
        <div
          key={`${file.name}-${file.size}-${file.lastModified}`}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'white', padding: 12, borderRadius: 8, boxShadow: '0 1px 3px rgba(15,23,42,0.12)' }}
        >
          <div style={{ fontSize: 14, color: '#047857' }}>
            📄 {file.name}
          </div>

          <button
            type="button"
            onClick={() =>
              setJdFiles((prev) => prev.filter((_, fileIndex) => fileIndex !== index))
            }
            style={{ color: '#EF4444', fontSize: 14 }}
          >
            Remove
          </button>
        </div>
      ))}

      <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <input
          type="file"
          multiple
          accept=".pdf,.doc,.docx"
          onChange={(e) => addMoreJdFiles(e.target.files)}
          style={{ display: 'none' }}
          id="jdUploadMore"
        />

        <label
          htmlFor="jdUploadMore"
          style={{ display: 'inline-block', borderRadius: 6, background: '#059669', padding: '8px 16px', fontSize: 14, fontWeight: 500, color: 'white', cursor: 'pointer' }}
        >
          Add More Files
        </label>

        <button
          type="button"
          onClick={removeFile}
          style={{ fontSize: 14, fontWeight: 500, color: '#EF4444' }}
        >
          Remove All
        </button>
      </div>
    </div>
  )}

</div>

<p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>
Only PDF, DOC, DOCX allowed
</p>

</Field>

<Field label="Upload PSQ (Screening Questions)">

<div
  onDrop={handlePSQDrop}
  onDragOver={handlePSQDragOver}
  onDragLeave={handlePSQDragLeave}
  style={{
    border: `2px dashed ${isDraggingPSQ ? '#3B82F6' : '#D1D5DB'}`,
    borderRadius: 8,
    padding: 24,
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    background: isDraggingPSQ ? '#EFF6FF' : '#F9FAFB',
  }}
>

  {!psqFiles.length ? (
    <>
      <p style={{ color: '#4B5563' }}>
        Drag & drop PSQ here or click to upload
      </p>

      <input
        type="file"
        multiple
        accept=".pdf,.doc,.docx"
        onChange={(e) => addMorePsqFiles(e.target.files)}
        style={{ display: 'none' }}
        id="psqUpload"
      />

      <label
        htmlFor="psqUpload"
        style={{ marginTop: 12, display: 'inline-block', padding: '8px 16px', background: '#2563EB', color: 'white', borderRadius: 6, cursor: 'pointer' }}
      >
        Choose File
      </label>
    </>
  ) : (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {psqFiles.map((file, index) => (
        <div
          key={`${file.name}-${file.size}-${file.lastModified}`}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'white', padding: 12, borderRadius: 8, boxShadow: '0 1px 3px rgba(15,23,42,0.12)' }}
        >
          <div style={{ fontSize: 14, color: '#1D4ED8' }}>
            📄 {file.name}
          </div>

          <button
            type="button"
            onClick={() =>
              setPsqFiles((prev) => prev.filter((_, fileIndex) => fileIndex !== index))
            }
            style={{ color: '#EF4444', fontSize: 14 }}
          >
            Remove
          </button>
        </div>
      ))}

      <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <input
          type="file"
          multiple
          accept=".pdf,.doc,.docx"
          onChange={(e) => addMorePsqFiles(e.target.files)}
          style={{ display: 'none' }}
          id="psqUploadMore"
        />

        <label
          htmlFor="psqUploadMore"
          style={{ display: 'inline-block', borderRadius: 6, background: '#2563EB', padding: '8px 16px', fontSize: 14, fontWeight: 500, color: 'white', cursor: 'pointer' }}
        >
          Add More Files
        </label>

        <button
          type="button"
          onClick={removePSQ}
          style={{ fontSize: 14, fontWeight: 500, color: '#EF4444' }}
        >
          Remove All
        </button>
      </div>
    </div>
  )}

</div>

<p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>
Only PDF, DOC, DOCX allowed
</p>

</Field>

</Grid>
</Section>
{/* JD */}

<div style={{ marginTop: 16 }}>

<label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 4 }}>
Justification
</label>

<textarea
name="justification"
value={form.justification}
onChange={handleChange}
rows={4}
style={styles.textarea}
/>

</div>

<div style={styles.footerRow}>
  <button
    type="button"
    onClick={handleSavePositionSection}
    style={{ padding: '8px 24px', background: '#2563EB', color: 'white', borderRadius: 6, border: 'none' }}
  >
    Save & Continue
  </button>
</div>

{/* JD */}





{/* SKILLS */}

{!isSectionSaved && (
  <div style={styles.warningBanner}>
    Save the job position details section to continue with skills and interview rounds.
  </div>
)}

{isSectionSaved && (
<>
<Section title="Enter or Update the Skills/Qualifications if Desired">

<Grid>

<Field label="Primary Skills">
<SkillInput
skills={primarySkills}
inputValue={primarySkillInput}
onInputChange={setPrimarySkillInput}
onAddSkill={(skill) => addSkill('primarySkills', skill)}
onRemoveSkill={(skill) => removeSkill('primarySkills', skill)}
suggestions={primarySkillSuggestions}
onKeyDown={(event) =>
  handleSkillKeyDown(
    event,
    'primarySkills',
    primarySkillInput,
    setPrimarySkillInput,
  )
}
placeholder="Type a primary skill and press Enter"
/>
</Field>


<Field label="Secondary Skills">
<SkillInput
skills={secondarySkills}
inputValue={secondarySkillInput}
onInputChange={setSecondarySkillInput}
onAddSkill={(skill) => addSkill('secondarySkills', skill)}
onRemoveSkill={(skill) => removeSkill('secondarySkills', skill)}
suggestions={secondarySkillSuggestions}
onKeyDown={(event) =>
  handleSkillKeyDown(
    event,
    'secondarySkills',
    secondarySkillInput,
    setSecondarySkillInput,
  )
}
placeholder="Type a secondary skill and press Enter"
/>
</Field>


<Field label="Experience">
<input
name="experience"
value={form.experience}
onChange={handleChange}
style={styles.input}
/>
</Field>

</Grid>


</Section>



{/* INTERVIEW */}

<Section title="Interview Process">

<Grid>

<Field label="Round Name">
<select
value={newRoundName}
onChange={(e)=>setNewRoundName(e.target.value)}
style={styles.input}
>
<option value="">Select Round</option>
<option value="SCREENING">Screening</option>
<option value="TECH">Tech</option>
<option value="OPS">Ops</option>
</select>
</Field>


<Field label="Mode">
<select
value={newRoundMode}
onChange={(e)=>setNewRoundMode(e.target.value)}
style={styles.input}
>
<option>Virtual</option>
<option>In Person</option>
</select>
</Field>

</Grid>


<div style={styles.threeColumnGrid}>

<input
placeholder="Panel Name"
value={panelName}
onChange={(e)=>setPanelName(e.target.value)}
style={styles.input}
/>


<input
placeholder="Panel Email"
value={panelEmail}
onChange={(e)=>setPanelEmail(e.target.value)}
style={styles.input}
/>


<button
onClick={addPanel}
style={{ background: '#374151', color: 'white', padding: '8px 16px', borderRadius: 6, border: 'none' }}
>
Add Panel
</button>

</div>


{panels.map((p,i)=>(
<div key={i} style={{ marginTop: 8, fontSize: 14 }}>
{p.name} — {p.email}
</div>
))}



{/* ✅ ADDED ROUNDS DISPLAY */}

{rounds.length > 0 && (
<div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>

{rounds.map((round, index) => (

<div key={index} style={{ border: '1px solid #D1D5DB', borderRadius: 8, padding: 16, background: '#F9FAFB' }}>

<div style={{ fontWeight: 600, color: '#374151', marginBottom: 8 }}>
{round.roundName} ({round.mode})
</div>

{round.panels.length > 0 ? (
<ul style={{ fontSize: 14, display: 'flex', flexDirection: 'column', gap: 4 }}>
{round.panels.map((panel, i) => (
  <li key={i} style={styles.inlineRowBetween}>

    <span>
      • {panel.name} — {panel.email}
    </span>

    <div style={{ display: 'flex', gap: 8 }}>

      <button
        onClick={() => editPanel(index, i)}
        style={{ color: '#2563EB', fontSize: 12 }}
      >
        Edit
      </button>

      <button
        onClick={() => removePanel(index, i)}
        style={styles.errorText}
      >
        Remove
      </button>

    </div>

  </li>
))}

</ul>
) : (
<p style={{ fontSize: 14, color: '#9CA3AF' }}>No panels added</p>
)}

</div>

))}

</div>
)}


</Section>
 </>
)}



<div style={styles.footerActions}>

<button
onClick={()=>navigate(-1)}
style={{ padding: '8px 24px', border: '1px solid #D1D5DB', borderRadius: 6, background: 'white' }}
>
Cancel
</button>


<button
onClick={submit}
disabled={loading}
style={{ background: '#059669', color: 'white', padding: '8px 24px', borderRadius: 6, border: 'none' }}
>
{loading ? 'Saving...' : isEditMode ? 'Update & Resubmit' : 'Submit Request'}
</button>

</div>

{/* BACKFILL POPUP */}

{activeBackfillIndex !== null && (

<div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>

<div style={styles.modalContent}>

<div style={{ ...styles.inlineRowBetween, marginBottom: 16 }}>

  <h3 style={{ fontSize: 18, fontWeight: 600 }}>
    Enter Backfill Details
  </h3>

</div>

{/* 🔥 MULTIPLE EMPLOYEES */}
{backfillList.map((emp, index) => (

<div key={index} style={{ marginBottom: 16, borderBottom: '1px solid #E5E7EB', paddingBottom: 12 }}>

<p style={{ fontSize: 14, fontWeight: 500, marginBottom: 8 }}>
Employee {index + 1}
</p>

<input
placeholder="Employee ID"
value={emp.employeeId}
onChange={(e) => {
  const updated = [...backfillList];
  updated[index].employeeId = sanitizeEmployeeId(e.target.value);
  setBackfillList(updated);
}}
inputMode="numeric"
maxLength={9}
style={{ ...styles.input, ...styles.fullWidth, marginBottom: 8 }}
/>

<input
placeholder="Employee Name"
value={emp.employeeName}
onChange={(e) => {
  const updated = [...backfillList];
  updated[index].employeeName = e.target.value;
  setBackfillList(updated);
}}
style={{ ...styles.input, ...styles.fullWidth }}
/>

</div>

))}

<div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16 }}>

<button
onClick={() => {

if (activeBackfillIndex === -2) {
  setForm(prev => ({
    ...prev,
    requestType: 'BACKFILL',
    backfillEmployeeId: JSON.stringify(backfillList),
    backfillEmployeeName: 'MULTIPLE'
  }));
}

if (activeBackfillIndex === -1) {
  setNewChild(prev => ({
    ...prev,
    requestType: 'BACKFILL',
    backfillEmployeeId: JSON.stringify(backfillList),
    backfillEmployeeName: 'MULTIPLE'
  }));
}

if (activeBackfillIndex !== null && activeBackfillIndex >= 0) {
  setChildPositions((prev) =>
    prev.map((position, index) =>
      index === activeBackfillIndex
        ? {
            ...position,
            requestType: 'BACKFILL',
            backfillEmployeeId: JSON.stringify(backfillList),
            backfillEmployeeName: 'MULTIPLE',
          }
        : position,
    ),
  );
}

  closeBackfillModal();

}}
disabled={!isBackfillListValid}
title={!isBackfillListValid ? 'Enter employee ID and employee name for every backfill entry' : undefined}
style={{
  padding: '8px 16px',
  borderRadius: 6,
  color: 'white',
  background: isBackfillListValid ? '#059669' : '#D1D5DB',
  cursor: isBackfillListValid ? 'pointer' : 'not-allowed',
  border: 'none',
}}
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


export default CreateJob;

const Section = ({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) => (
  <Box
    background="white"
    round="8px"
    pad="24px"
    gap="24px"
    style={styles.sectionShadow}
  >
    <Box border={{ side: 'bottom', color: '#E5E7EB' }} pad={{ bottom: '8px' }}>
      <Heading level={3} size="small" margin="none">
        {title}
      </Heading>
    </Box>
    {children}
  </Box>
);

const Grid = ({ children }: { children: ReactNode }) => (
  <Box style={styles.twoColumnGrid}>{children}</Box>
);

const Field = ({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) => (
  <FormField label={label} margin="none">
    {children}
  </FormField>
);

const SkillInput = ({
  skills,
  inputValue,
  onInputChange,
  onAddSkill,
  onRemoveSkill,
  suggestions,
  onKeyDown,
  placeholder,
}: {
  skills: string[];
  inputValue: string;
  onInputChange: (value: string) => void;
  onAddSkill: (skill: string) => void;
  onRemoveSkill: (skill: string) => void;
  suggestions: string[];
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  placeholder: string;
}) => (
  <Box style={styles.relative}>
    <Box style={styles.skillInputShell}>
      <Box direction="row" wrap gap="8px">
        {skills.map((skill) => (
          <Box
            key={skill}
            direction="row"
            align="center"
            gap="8px"
            round="999px"
            pad={{ horizontal: '12px', vertical: '6px' }}
            background="#ECFDF5"
          >
            <Text size="small" color="#047857">
              {skill}
            </Text>
            <Button
              plain
              label="x"
              onClick={() => onRemoveSkill(skill)}
            />
          </Box>
        ))}

        <TextInput
          value={inputValue}
          onChange={(event) => onInputChange(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder={skills.length ? '' : placeholder}
          plain
          style={styles.skillTextInput}
        />
      </Box>
    </Box>

    {!!suggestions.length && (
      <Box style={styles.suggestionMenu}>
        {suggestions.map((suggestion) => (
          <Button
            key={suggestion}
            plain
            onClick={() => {
              onAddSkill(suggestion);
              onInputChange('');
            }}
            hoverIndicator="#F9FAFB"
          >
            <Box pad={{ horizontal: '12px', vertical: '10px' }}>
              <Text size="small">{suggestion}</Text>
            </Box>
          </Button>
        ))}
      </Box>
    )}
  </Box>
);

const styles: Record<string, React.CSSProperties> = {
  pageShell: { width: '100%', padding: '0 32px', display: 'flex', flexDirection: 'column', gap: 32 },
  sectionShadow: { boxShadow: '0 1px 3px rgba(15, 23, 42, 0.12)' },
  twoColumnGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 24 },
  fourColumnGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12 },
  threeColumnGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 16, marginTop: 16 },
  input: { width: '100%', border: '1px solid #D1D5DB', borderRadius: 6, padding: '10px 12px', fontSize: 14, background: 'white' },
  readOnlyInput: { width: '100%', border: '1px solid #D1D5DB', borderRadius: 6, padding: '10px 12px', fontSize: 14, background: '#F3F4F6' },
  textarea: { width: '100%', border: '1px solid #D1D5DB', borderRadius: 6, padding: '10px 12px', fontSize: 14, background: 'white' },
  errorText: { color: '#EF4444', fontSize: 12, marginTop: 4 },
  fullWidth: { width: '100%' },
  additionalPositionsLauncher: {
    border: '2px dashed #D1D5DB',
    borderRadius: 12,
    padding: 32,
    textAlign: 'center',
    cursor: 'pointer',
    background: 'linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%)',
    transition: 'border-color 0.2s ease',
  },
  outlinedCard: { border: '1px solid #E5E7EB', borderRadius: 8, padding: 16 },
  childPositionCard: { border: '1px solid #D1D5DB', borderRadius: 8, padding: 12 },
  inlineRowBetween: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  inlineRowGap: { display: 'flex', gap: 8 },
  relative: { position: 'relative' },
  skillInputShell: { minHeight: 50, border: '1px solid #D1D5DB', borderRadius: 6, background: 'white', padding: '8px 12px' },
  skillTextInput: { minWidth: 180, flex: 1, fontSize: 14 },
  suggestionMenu: { position: 'absolute', zIndex: 10, marginTop: 4, width: '100%', border: '1px solid #E5E7EB', borderRadius: 6, background: 'white', boxShadow: '0 10px 15px rgba(15, 23, 42, 0.1)' },
  skillPill: { display: 'inline-flex', alignItems: 'center', gap: 8, borderRadius: 999, padding: '4px 12px', background: '#ECFDF5' },
  footerActions: { display: 'flex', justifyContent: 'flex-end', gap: 16, paddingBottom: 40 },
  footerRow: { display: 'flex', justifyContent: 'flex-end' },
  warningBanner: { border: '1px solid #FCD34D', background: '#FFFBEB', borderRadius: 6, padding: '12px 16px', fontSize: 14, color: '#92400E' },
  modalContent: { width: 500, maxHeight: '80vh', overflowY: 'auto' },
};




