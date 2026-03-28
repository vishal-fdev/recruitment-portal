import { useEffect, useState } from 'react';
import api from '../../api/api';
import { useNavigate } from 'react-router-dom';

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
  jdFile?: File | null;
  psqFile?: File | null;

  requestType?: 'NEW' | 'BACKFILL';
  backfillEmployeeId?: string;
  backfillEmployeeName?: string;
}

const LEVEL_OPTIONS = ['ENT','INT','SPE','EXP','MAS','MAS 1'];

const CreateJob = () => {

const navigate = useNavigate();

const [loading,setLoading] = useState(false);
const [jdFile, setJdFile] = useState<File | null>(null);
const [psqFile, setPsqFile] = useState<File | null>(null);
const [isDraggingPSQ, setIsDraggingPSQ] = useState(false);
const [isDragging, setIsDragging] = useState(false);

const [showBackfillModal,setShowBackfillModal] = useState(false);

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
  jdFile:null,
  psqFile:null,
  requestType:'NEW',
  backfillEmployeeId:'',
  backfillEmployeeName:''
});

const [rounds,setRounds] = useState<InterviewRound[]>([]);

const [newRoundName,setNewRoundName] = useState('');
const [newRoundMode,setNewRoundMode] = useState('Virtual');

const [panelName,setPanelName] = useState('');
const [panelEmail,setPanelEmail] = useState('');
const [panels,setPanels] = useState<Panel[]>([]);


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



const handleChange=(e:any)=>{

const {name,value}=e.target;

setForm(prev=>({...prev,[name]:value}));

// ✅ HANDLE MAIN BACKFILL
if(name==='requestType'){

  if(value==='BACKFILL'){
    setBackfill({employeeId:'',employeeName:''});
    setActiveBackfillIndex(-2); // 🔥 special flag for MAIN form
  }else{
    setActiveBackfillIndex(null);
  }

}

};



const handleFileChange=(e:any)=>{

if(e.target.files && e.target.files[0]){
setJdFile(e.target.files[0]);
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

const handleDrop = (e: React.DragEvent) => {
  e.preventDefault();
  setIsDragging(false);

  const file = e.dataTransfer.files?.[0];
  if (file && validateFile(file)) {
    setJdFile(file);
  }
};

// ✅ PSQ HANDLERS (ADD HERE)

const handlePSQDrop = (e: React.DragEvent) => {
  e.preventDefault();
  setIsDraggingPSQ(false);

  const file = e.dataTransfer.files?.[0];
  if (file && validateFile(file)) {
    setPsqFile(file);
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
  setPsqFile(null);
};

const handleDragOver = (e: React.DragEvent) => {
  e.preventDefault();
  setIsDragging(true);
};

const handleDragLeave = () => {
  setIsDragging(false);
};

const removeFile = () => {
  setJdFile(null);
};



/* CHILD POSITIONS */

const addChildPosition=()=>{

if(!newChild.level) return;

setChildPositions([...childPositions,newChild]);

setNewChild({
level:'',
openings:1,
jdFile:null
});

};


const removeChildPosition=(index:number)=>{
setChildPositions(childPositions.filter((_,i)=>i!==index));
};


const handleChildJDChange=(index:number,file:File)=>{

const updated=[...childPositions];

updated[index].jdFile=file;

setChildPositions(updated);

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

const addPanel=()=>{

if(!panelName || !panelEmail) return;

setPanels([...panels,{name:panelName,email:panelEmail}]);

setPanelName('');
setPanelEmail('');

};



const addRound=()=>{

if(!newRoundName) return;

const round:InterviewRound = {
roundName:newRoundName,
mode:newRoundMode,
panels
};

setRounds([...rounds,round]);

setPanels([]);
setNewRoundName('');
setNewRoundMode('Virtual');

};



/* SUBMIT */

const submit = async()=>{

try{

setLoading(true);

const jobRes = await api.post('/jobs',{

title:form.jobTitle,
location:form.workLocation,
experience:form.experience,

department:'MS',
employmentType:'Contingent',

startDate:form.startDate,
endDate:form.endDate,

description:form.description,

// ✅ ADD THESE (CRITICAL FIX)
jobCategory: form.jobCategory,
workType: form.workType,
region: form.region,
dealName: form.dealName,
justification: form.justification,

level: form.level,
numberOfPositions: form.numberOfPositions,
requestType: form.requestType,

backfillEmployeeId: (form as any).backfillEmployeeId,
backfillEmployeeName: (form as any).backfillEmployeeName,

interviewRounds:rounds,
positions:childPositions

});

const jobId = jobRes.data.id;

/* JD upload same as before */

if(jdFile){
const fd=new FormData();
fd.append('jd',jdFile);
await api.post(`/jobs/${jobId}/jd`,fd,{headers:{'Content-Type':'multipart/form-data'}});
}

// ✅ PSQ UPLOAD (ADD THIS BLOCK)
if(psqFile){
  const fd = new FormData();
  fd.append('psq', psqFile);

  await api.post(`/jobs/${jobId}/psq`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
}

const fullJob = await api.get(`/jobs/${jobId}`);
const positionsFromDB = fullJob.data.positions;

for (let i = 0; i < childPositions.length; i++) {

  const pos = childPositions[i];
  const dbPos = positionsFromDB[i];

  // ✅ JD upload per position
  if (pos.jdFile) {
    const fd = new FormData();
    fd.append('jd', pos.jdFile);

    await api.post(`/jobs/positions/${dbPos.id}/jd`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }

  // ✅ PSQ upload per position
  if (pos.psqFile) {
    const fd = new FormData();
    fd.append('psq', pos.psqFile);

    await api.post(`/jobs/positions/${dbPos.id}/psq`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  
  }

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


<div className="bg-white shadow rounded p-6">

<h1 className="text-2xl font-semibold">
Job Posting
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

<Field label="Job Request Type">
<select
name="requestType"
value={form.requestType}
onChange={handleChange}
className="input"
>
<option value="NEW">New Request</option>
<option value="BACKFILL">Backfill</option>
</select>

</Field>


<Field label="No. of Positions">
<input
type="number"
name="numberOfPositions"
value={form.numberOfPositions}
onChange={handleChange}
className="input"
/>
</Field>

<Field label="Job Level">
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
</Field>


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


<Field label="Work Location">
<input
name="workLocation"
value={form.workLocation}
onChange={handleChange}
className="input"
/>
</Field>


<Field label="Region">
<input
name="region"
value={form.region}
onChange={handleChange}
className="input"
/>
</Field>


<Field label="Deal Name">
<input
name="dealName"
value={form.dealName}
onChange={handleChange}
className="input"
/>
</Field>

<Field label="Upload Job Description (JD)">

<div
  onDrop={handleDrop}
  onDragOver={handleDragOver}
  onDragLeave={handleDragLeave}
  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition 
  ${isDragging ? 'border-emerald-500 bg-emerald-50' : 'border-gray-300 bg-gray-50'}`}
>

  {!jdFile ? (
    <>
      <p className="text-gray-600">
        Drag & drop JD here or click to upload
      </p>

      <input
        type="file"
        accept=".pdf,.doc,.docx"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && validateFile(file)) {
            setJdFile(file);
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
    <div className="flex items-center justify-between bg-white p-3 rounded shadow">

      <div className="text-sm text-emerald-700 truncate">
        📄 {jdFile.name}
      </div>

      <button
        type="button"
        onClick={removeFile}
        className="text-red-500 hover:text-red-700 text-sm"
      >
        Remove
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

  {!psqFile ? (
    <>
      <p className="text-gray-600">
        Drag & drop PSQ here or click to upload
      </p>

      <input
        type="file"
        accept=".pdf,.doc,.docx"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && validateFile(file)) {
            setPsqFile(file);
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
    <div className="flex items-center justify-between bg-white p-3 rounded shadow">

      <div className="text-sm text-blue-700 truncate">
        📄 {psqFile.name}
      </div>

      <button
        type="button"
        onClick={removePSQ}
        className="text-red-500 hover:text-red-700 text-sm"
      >
        Remove
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

{/* JD */}


{/* CHILD POSITIONS */}

<div className="mt-6">

<h3 className="font-medium mb-3">
Additional Positions (If more than one position is required)
</h3>

{/* ADD NEW CHILD */}
<div className="grid grid-cols-6 gap-3">

<select
value={newChild.level}
onChange={(e)=>setNewChild({...newChild,level:e.target.value})}
className="input"
>
<option value="">Level</option>
{LEVEL_OPTIONS.map(l=><option key={l}>{l}</option>)}
</select>

<input
type="number"
placeholder="Openings"
value={newChild.openings}
onChange={(e)=>setNewChild({...newChild,openings:Number(e.target.value)})}
className="input"
/>

{/* REQUEST TYPE */}
<select
value={newChild.requestType || 'NEW'}
onChange={(e)=>{
  const value = e.target.value as 'NEW' | 'BACKFILL';
  setNewChild({...newChild,requestType:value});

  if(value === 'BACKFILL'){
    setBackfill({employeeId:'',employeeName:''});
    setActiveBackfillIndex(-1); // special flag for newChild
  }
}}
className="input"
>
<option value="NEW">New</option>
<option value="BACKFILL">Backfill</option>
</select>

{/* JD Upload */}
<div 
  onDragOver={(e)=>e.preventDefault()}
  onDrop={(e)=>{
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if(file && validateFile(file)){
      setNewChild({...newChild,jdFile:file});
    }
  }}
  className="border-2 border-dashed rounded-lg p-3 text-center cursor-pointer bg-gray-50 hover:border-emerald-400"
>
  {!newChild.jdFile ? (
    <>
      <p className="text-xs text-gray-500">📄 Upload JD</p>

      <input
        type="file"
        accept=".pdf,.doc,.docx"
        onChange={(e)=>{
          const file = e.target.files?.[0];
          if(file && validateFile(file)){
            setNewChild({...newChild,jdFile:file});
          }
        }}
        className="hidden"
        id="childJDUpload"
      />

      <label
        htmlFor="childJDUpload"
        className="text-xs text-emerald-600 cursor-pointer"
      >
        Choose File
      </label>
    </>
  ) : (
    <div className="text-xs text-emerald-700 truncate">
      📄 {newChild.jdFile.name}
    </div>
  )}
</div>


{/* PSQ Upload */}
<div
  onDragOver={(e)=>e.preventDefault()}
  onDrop={(e)=>{
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if(file && validateFile(file)){
      setNewChild({...newChild,psqFile:file});
    }
  }}
  className="border-2 border-dashed rounded-lg p-3 text-center cursor-pointer bg-gray-50 hover:border-blue-400"
>
  {!newChild.psqFile ? (
    <>
      <p className="text-xs text-gray-500">📝 Upload PSQ</p>

      <input
        type="file"
        accept=".pdf,.doc,.docx"
        onChange={(e)=>{
          const file = e.target.files?.[0];
          if(file && validateFile(file)){
            setNewChild({...newChild,psqFile:file});
          }
        }}
        className="hidden"
        id="childPSQUpload"
      />

      <label
        htmlFor="childPSQUpload"
        className="text-xs text-blue-600 cursor-pointer"
      >
        Choose File
      </label>
    </>
  ) : (
    <div className="text-xs text-blue-700 truncate">
      📝 {newChild.psqFile.name}
    </div>
  )}
</div>

<button
onClick={()=>{
  let updatedChild = {...newChild};

  // attach backfill data if exists
  if(newChild.requestType === 'BACKFILL'){
    updatedChild.backfillEmployeeId = backfill.employeeId;
    updatedChild.backfillEmployeeName = backfill.employeeName;
  }

  setChildPositions([...childPositions,updatedChild]);

  // reset
  setNewChild({
  level:'',
  openings:1,
  jdFile:null,
  psqFile:null,
  requestType:'NEW'
});

  setBackfill({employeeId:'',employeeName:''});
}}
className="bg-gray-700 text-white px-4 py-2 rounded"
>
Add
</button>

</div>

{/* CHILD LIST (READ ONLY) */}
{childPositions.map((pos,index)=>(

<div
key={index}
className="mt-3 border p-3 rounded"
>

<div className="flex justify-between items-center">

<div className="text-sm">

<strong>{pos.level}</strong> — {pos.openings} openings

<br/>

Request Type: <strong>{pos.requestType || 'NEW'}</strong>

{pos.requestType === 'BACKFILL' && pos.backfillEmployeeId && (
<>
<br/>
<span className="text-emerald-600">
Employee ID: {pos.backfillEmployeeId}
</span>
<br/>
<span className="text-emerald-600">
Name: {pos.backfillEmployeeName}
</span>
</>
)}

<br/>

{pos.jdFile && (
<>
  <br/>
  <span className="text-emerald-600">
    📄 JD: {pos.jdFile.name}
  </span>
</>
)}

{pos.psqFile && (
<>
  <br/>
  <span className="text-blue-600">
    📄 PSQ: {pos.psqFile.name}
  </span>
</>
)}

{pos.psqFile && (
  <>
    <br/>
    <span className="text-blue-600">
      {pos.psqFile.name}
    </span>
  </>
)}

</div>

<button
onClick={()=>removeChildPosition(index)}
className="text-red-500"
>
Remove
</button>

</div>

</div>

))}

</div>
{/* JD */}



{/* SKILLS */}

<Section title="Enter or Update the Skills/Qualifications if Desired">

<Grid>

<Field label="Primary Skills">
<input
name="primarySkills"
value={form.primarySkills}
onChange={handleChange}
className="input"
/>
</Field>


<Field label="Secondary Skills">
<input
name="secondarySkills"
value={form.secondarySkills}
onChange={handleChange}
className="input"
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


<button
onClick={addRound}
className="mt-4 bg-gray-700 text-white px-4 py-2 rounded"
>
Add Round
</button>

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
<li key={i}>
• {panel.name} — {panel.email}
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
{loading ? 'Submitting...' : 'Submit Request'}
</button>

</div>

{/* BACKFILL POPUP */}

{activeBackfillIndex !== null && (

<div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

<div className="bg-white p-6 rounded shadow w-[420px]">

<h3 className="text-lg font-semibold mb-4">
Enter Backfill Details
</h3>

<input
placeholder="Employee ID"
value={backfill.employeeId}
onChange={(e)=>setBackfill({...backfill,employeeId:e.target.value})}
className="input mb-3 w-full"
/>

<input
placeholder="Employee Name"
value={backfill.employeeName}
onChange={(e)=>setBackfill({...backfill,employeeName:e.target.value})}
className="input w-full"
/>

<div className="flex justify-end space-x-3 mt-4">

<button
onClick={()=>setActiveBackfillIndex(null)}
className="px-4 py-2 border rounded"
>
Cancel
</button>

<button
onClick={saveBackfill}
className="bg-emerald-600 text-white px-4 py-2 rounded"
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