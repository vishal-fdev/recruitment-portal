import { useEffect, useState } from 'react';
import type { Dispatch, KeyboardEvent, SetStateAction } from 'react';
import api from '../../api/api';
import { useNavigate } from 'react-router-dom';
import { useParams } from 'react-router-dom';

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
  'Tailwind CSS',
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



const { id } = useParams(); // jobId for edit
const isEditMode = !!id;

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
  if (!isEditMode) return;

  const fetchJob = async () => {
    try {
      const res = await api.get(`/jobs/${id}`);
      const job = res.data;

      setForm({
        jobTitle: job.title || '',
        jobCategory: job.jobCategory || '',
        businessUnit: 'MS',
        hiringManager: job.hiringManager || '',

        workLocation: job.location || '',
        workType: job.workType || 'Onsite',

        requestType: job.requestType || 'NEW',

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

    } catch {
      alert('Failed to load job');
    }
  };

  fetchJob();
}, [id]);



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
    const count = form.numberOfPositions || 1;

    setBackfillList(
      Array.from({ length: count }, () => ({
        employeeId: '',
        employeeName: ''
      }))
    );

    setActiveBackfillIndex(-2);
  } else {
    setActiveBackfillIndex(null);
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
      backfillEmployeeId: backfill.employeeId,
      backfillEmployeeName: backfill.employeeName
    }));

    setActiveBackfillIndex(null);
    return;
  }

  // ✅ CASE 2: NEW CHILD
  if(activeBackfillIndex === -1){
    setNewChild(prev => ({
      ...prev,
      backfillEmployeeId: backfill.employeeId,
      backfillEmployeeName: backfill.employeeName
    }));

    setActiveBackfillIndex(null);
    return;
  }

  // ✅ CASE 3: EXISTING CHILD
  if(activeBackfillIndex !== null){
    const updated = [...childPositions];

    if(!updated[activeBackfillIndex]) return;

    updated[activeBackfillIndex].backfillEmployeeId = backfill.employeeId;
    updated[activeBackfillIndex].backfillEmployeeName = backfill.employeeName;

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

<div className="w-full px-8 space-y-8">

<div>
  <button
    type="button"
    onClick={() => navigate('/hiring-manager/jobs')}
    className="rounded-md bg-[#01a982] px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:shadow-md"
  >
    ← Back
  </button>
</div>


<div className="bg-white shadow rounded p-6">

<h1 className="text-2xl font-semibold">
{isEditMode ? 'Edit Job' : 'Job Posting'}
</h1>

<p className="text-sm text-gray-500 mt-1">
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
className="input"
/>
</Field>


<Field label="Job Category *">
<select
name="jobCategory"
value={form.jobCategory}
onChange={handleChange}
className="input"
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
className="input bg-gray-100"
/>
</Field>


<Field label="Hiring Manager *">
<input
value={form.hiringManager}
disabled
className="input bg-gray-100"
/>
</Field>


<Field label="Work Type *">
<select
name="workType"
value={form.workType}
onChange={handleChange}
className="input"
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
className="input"
>
<option value="">Select Level</option>
{LEVEL_OPTIONS.map(l => (
<option key={l} value={l}>{l}</option>
))}
</select>
{errors.level && <p className="text-red-500 text-xs">{errors.level}</p>}
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
className="input"
/>
{errors.numberOfPositions && <p className="text-red-500 text-xs">{errors.numberOfPositions}</p>}
</Field>

<Field label="Job Request Type *">
<select
name="requestType"
value={form.requestType}
onChange={handleChange}
className="input"
>
<option value="NEW">New Request</option>
<option value="BACKFILL">Backfill</option>
</select>
{errors.requestType && <p className="text-red-500 text-xs">{errors.requestType}</p>}
</Field>

<Field label="Deal Name *">
<input
name="dealName"
value={form.dealName}
onChange={handleChange}
className="input"
/>
{errors.dealName && <p className="text-red-500 text-xs">{errors.dealName}</p>}
</Field>

{/* FULL WIDTH ADD POSITION BLOCK */}

<div className="col-span-2 space-y-3">

  <div
    onClick={() => {
      setShowAdditionalPositions(true);
      setIsSectionSaved(false);
    }}
    className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer bg-gradient-to-br from-gray-50 to-gray-100 hover:border-emerald-500 transition"
  >
    <p className="text-gray-600 text-sm">
      + Add more positions (Click here to add more positions)
    </p>

    <button
      type="button"
      className="mt-3 px-5 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700"
    >
      Add Positions
    </button>
  </div>

</div>

{showAdditionalPositions && (
  <div className="col-span-2 space-y-4 rounded-lg border border-gray-200 p-4">

    <div>
      <h3 className="font-medium">
        Additional Positions (If more than one position is required)
      </h3>
      <p className="mt-1 text-sm text-gray-500">
        Fill every field, then click Add before continuing.
      </p>
      {errors.additionalPositions && (
        <p className="mt-2 text-xs text-red-500">{errors.additionalPositions}</p>
      )}
    </div>

    <div className="grid grid-cols-4 gap-3">

      <div>
        <select
          value={newChild.level}
          onChange={(e)=>{
            setNewChild({...newChild,level:e.target.value});
            setIsSectionSaved(false);
          }}
          className="input"
        >
          <option value="">Level</option>
          {LEVEL_OPTIONS.map(l=><option key={l}>{l}</option>)}
        </select>
        {errors.newChildLevel && (
          <p className="mt-1 text-xs text-red-500">{errors.newChildLevel}</p>
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
              setBackfillList(
                Array.from({ length: value || 1 }, () => ({
                  employeeId:'',
                  employeeName:''
                }))
              );
              setActiveBackfillIndex(-1);
            }
          }}
          className="input"
        />
        {errors.newChildOpenings && (
          <p className="mt-1 text-xs text-red-500">{errors.newChildOpenings}</p>
        )}
      </div>

      <div>
        <select
          value={newChild.requestType || 'NEW'}
          onChange={(e)=>{
            const value = e.target.value as 'NEW' | 'BACKFILL';
            setNewChild({...newChild,requestType:value});
            setIsSectionSaved(false);

            if(value === 'BACKFILL'){
              const count = newChild.openings || 1;

              setBackfillList(
                Array.from({ length: count }, () => ({
                  employeeId: '',
                  employeeName: ''
                }))
              );

              setActiveBackfillIndex(-1);
            }
          }}
          className="input"
        >
          <option value="NEW">New</option>
          <option value="BACKFILL">Backfill</option>
        </select>
        {errors.newChildRequestType && (
          <p className="mt-1 text-xs text-red-500">{errors.newChildRequestType}</p>
        )}
      </div>

      <button
        type="button"
        onClick={addChildPosition}
        className="bg-gray-700 text-white px-4 py-2 rounded"
      >
        Add
      </button>

    </div>

    {childPositions.map((pos,index)=>(
      <div
        key={index}
        className="border rounded p-3"
      >
        <div className="flex justify-between items-center">
          <div className="text-sm">
            <strong>{pos.level}</strong> - {pos.openings} openings
            <br />
            Request Type: <strong>{pos.requestType || 'NEW'}</strong>
          </div>

          <button
            type="button"
            onClick={()=>removeChildPosition(index)}
            className="text-red-500"
          >
            Remove
          </button>
        </div>
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
className="input"
/>
</Field>


<Field label="End Date">
<input
type="date"
name="endDate"
value={form.endDate}
onChange={handleChange}
className="input"
/>
</Field>


<Field label="Work Location *">
<input
name="workLocation"
value={form.workLocation}
onChange={handleChange}
className="input"
/>
{errors.workLocation && <p className="text-red-500 text-xs">{errors.workLocation}</p>}
</Field>


<Field label="Region *">
<input
name="region"
value={form.region}
onChange={handleChange}
className="input"
/>
{errors.region && <p className="text-red-500 text-xs">{errors.region}</p>}
</Field>



<Field label="Upload Job Description (JD)">

<div
  onDrop={handleDrop}
  onDragOver={handleDragOver}
  onDragLeave={handleDragLeave}
  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition 
  ${isDragging ? 'border-emerald-500 bg-emerald-50' : 'border-gray-300 bg-gray-50'}`}
>

  {!jdFiles.length ? (
    <>
      <p className="text-gray-600">
        Drag & drop JD here or click to upload
      </p>

      <input
        type="file"
        multiple
        accept=".pdf,.doc,.docx"
        onChange={(e) => {
          const files = e.target.files ? getValidFiles(e.target.files) : [];
          if (files.length) {
            setJdFiles((prev) => mergeFiles(prev, files));
          }
        }}
        className="hidden"
        id="jdUpload"
      />

      <label
        htmlFor="jdUpload"
        className="mt-3 inline-block px-4 py-2 bg-emerald-600 text-white rounded cursor-pointer hover:bg-emerald-700"
      >
        Choose File
      </label>
    </>
  ) : (
    <div className="space-y-2">
      {jdFiles.map((file, index) => (
        <div
          key={`${file.name}-${file.size}-${file.lastModified}`}
          className="flex items-center justify-between bg-white p-3 rounded shadow"
        >
          <div className="text-sm text-emerald-700 truncate">
            📄 {file.name}
          </div>

          <button
            type="button"
            onClick={() =>
              setJdFiles((prev) => prev.filter((_, fileIndex) => fileIndex !== index))
            }
            className="text-red-500 hover:text-red-700 text-sm"
          >
            Remove
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={removeFile}
        className="text-sm font-medium text-red-500 hover:text-red-700"
      >
        Remove All
      </button>
    </div>
  )}

</div>

<p className="text-xs text-gray-400 mt-1">
Only PDF, DOC, DOCX allowed
</p>

</Field>

<Field label="Upload PSQ (Screening Questions)">

<div
  onDrop={handlePSQDrop}
  onDragOver={handlePSQDragOver}
  onDragLeave={handlePSQDragLeave}
  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition 
  ${isDraggingPSQ ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'}`}
>

  {!psqFiles.length ? (
    <>
      <p className="text-gray-600">
        Drag & drop PSQ here or click to upload
      </p>

      <input
        type="file"
        multiple
        accept=".pdf,.doc,.docx"
        onChange={(e) => {
          const files = e.target.files ? getValidFiles(e.target.files) : [];
          if (files.length) {
            setPsqFiles((prev) => mergeFiles(prev, files));
          }
        }}
        className="hidden"
        id="psqUpload"
      />

      <label
        htmlFor="psqUpload"
        className="mt-3 inline-block px-4 py-2 bg-blue-600 text-white rounded cursor-pointer hover:bg-blue-700"
      >
        Choose File
      </label>
    </>
  ) : (
    <div className="space-y-2">
      {psqFiles.map((file, index) => (
        <div
          key={`${file.name}-${file.size}-${file.lastModified}`}
          className="flex items-center justify-between bg-white p-3 rounded shadow"
        >
          <div className="text-sm text-blue-700 truncate">
            📄 {file.name}
          </div>

          <button
            type="button"
            onClick={() =>
              setPsqFiles((prev) => prev.filter((_, fileIndex) => fileIndex !== index))
            }
            className="text-red-500 hover:text-red-700 text-sm"
          >
            Remove
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={removePSQ}
        className="text-sm font-medium text-red-500 hover:text-red-700"
      >
        Remove All
      </button>
    </div>
  )}

</div>

<p className="text-xs text-gray-400 mt-1">
Only PDF, DOC, DOCX allowed
</p>

</Field>

</Grid>
</Section>
{/* JD */}

<div className="mt-4">

<label className="block text-sm font-medium mb-1">
Justification
</label>

<textarea
name="justification"
value={form.justification}
onChange={handleChange}
rows={4}
className="w-full border rounded px-3 py-2"
/>

</div>

<div className="flex justify-end">
  <button
    type="button"
    onClick={handleSavePositionSection}
    className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
  >
    Save & Continue
  </button>
</div>

{/* JD */}





{/* SKILLS */}

{!isSectionSaved && (
  <div className="rounded border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
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
className="input"
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
className="input"
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
className="input"
>
<option>Virtual</option>
<option>In Person</option>
</select>
</Field>

</Grid>


<div className="grid grid-cols-3 gap-4 mt-4">

<input
placeholder="Panel Name"
value={panelName}
onChange={(e)=>setPanelName(e.target.value)}
className="input"
/>


<input
placeholder="Panel Email"
value={panelEmail}
onChange={(e)=>setPanelEmail(e.target.value)}
className="input"
/>


<button
onClick={addPanel}
className="bg-gray-700 text-white px-4 py-2 rounded"
>
Add Panel
</button>

</div>


{panels.map((p,i)=>(
<div key={i} className="mt-2 text-sm">
{p.name} — {p.email}
</div>
))}



{/* ✅ ADDED ROUNDS DISPLAY */}

{rounds.length > 0 && (
<div className="mt-6 space-y-4">

{rounds.map((round, index) => (

<div key={index} className="border rounded p-4 bg-gray-50">

<div className="font-semibold text-gray-700 mb-2">
{round.roundName} ({round.mode})
</div>

{round.panels.length > 0 ? (
<ul className="text-sm space-y-1">
{round.panels.map((panel, i) => (
  <li key={i} className="flex justify-between items-center">

    <span>
      • {panel.name} — {panel.email}
    </span>

    <div className="space-x-2">

      <button
        onClick={() => editPanel(index, i)}
        className="text-blue-600 text-xs"
      >
        Edit
      </button>

      <button
        onClick={() => removePanel(index, i)}
        className="text-red-500 text-xs"
      >
        Remove
      </button>

    </div>

  </li>
))}

</ul>
) : (
<p className="text-sm text-gray-400">No panels added</p>
)}

</div>

))}

</div>
)}


</Section>
 </>
)}



<div className="flex justify-end space-x-4 pb-10">

<button
onClick={()=>navigate(-1)}
className="px-6 py-2 border rounded"
>
Cancel
</button>


<button
onClick={submit}
disabled={loading}
className="bg-emerald-600 text-white px-6 py-2 rounded"
>
{loading ? 'Saving...' : isEditMode ? 'Update & Resubmit' : 'Submit Request'}
</button>

</div>

{/* BACKFILL POPUP */}

{activeBackfillIndex !== null && (

<div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

<div className="bg-white p-6 rounded shadow w-[500px] max-h-[80vh] overflow-y-auto relative">

<div className="flex justify-between items-center mb-4">

  <h3 className="text-lg font-semibold">
    Enter Backfill Details
  </h3>

</div>

{/* 🔥 MULTIPLE EMPLOYEES */}
{backfillList.map((emp, index) => (

<div key={index} className="mb-4 border-b pb-3">

<p className="text-sm font-medium mb-2">
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
className="input mb-2 w-full"
/>

<input
placeholder="Employee Name"
value={emp.employeeName}
onChange={(e) => {
  const updated = [...backfillList];
  updated[index].employeeName = e.target.value;
  setBackfillList(updated);
}}
className="input w-full"
/>

</div>

))}

<div className="flex justify-end space-x-3 mt-4">

<button
onClick={() => {

  if (activeBackfillIndex === -2) {
  setForm(prev => ({
    ...prev,
    backfillEmployeeId: JSON.stringify(backfillList),
    backfillEmployeeName: 'MULTIPLE'
  }));
}

if (activeBackfillIndex === -1) {
  setNewChild(prev => ({
    ...prev,
    backfillEmployeeId: JSON.stringify(backfillList)
  }));
}

  setActiveBackfillIndex(null);

}}
disabled={!isBackfillListValid}
title={!isBackfillListValid ? 'Enter employee ID and employee name for every backfill entry' : undefined}
className={`px-4 py-2 rounded text-white ${
  isBackfillListValid
    ? 'bg-emerald-600'
    : 'cursor-not-allowed bg-gray-300'
}`}
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



const Section=({title,children}:any)=>(

<div className="bg-white shadow rounded p-6 space-y-6">

<h2 className="text-lg font-semibold border-b pb-2">
{title}
</h2>

{children}

</div>

);


const Grid=({children}:any)=>(

<div className="grid grid-cols-2 gap-6">
{children}
</div>

);


const Field=({label,children}:any)=>(

<div>
<label className="block text-sm font-medium mb-1">
{label}
</label>
{children}
</div>

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
  <div className="relative">
    <div className="min-h-[50px] rounded-md border border-gray-300 bg-white px-3 py-2">
      <div className="flex flex-wrap gap-2">
        {skills.map((skill) => (
          <span
            key={skill}
            className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-sm text-emerald-700"
          >
            {skill}
            <button
              type="button"
              onClick={() => onRemoveSkill(skill)}
              className="text-emerald-700 hover:text-red-500"
            >
              x
            </button>
          </span>
        ))}

        <input
          value={inputValue}
          onChange={(event) => onInputChange(event.target.value)}
          onKeyDown={onKeyDown}
          className="min-w-[180px] flex-1 border-0 p-0 text-sm outline-none focus:ring-0"
          placeholder={skills.length ? '' : placeholder}
        />
      </div>
    </div>

    {!!suggestions.length && (
      <div className="absolute z-10 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => {
              onAddSkill(suggestion);
              onInputChange('');
            }}
            className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
          >
            {suggestion}
          </button>
        ))}
      </div>
    )}
  </div>
);
