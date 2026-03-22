import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../api/api";

interface Vendor {
id: string;
name: string;
email: string;
alias?: string;
originCountry?: string;
originCity?: string;
domain?: string;
skills?: string;
registeredAddress?: string;
partnerCategory?: string;
tierCategory?: string;
pincode?: string;
isActive: boolean;
}

const ProfileTab = () => {

const { id } = useParams();

const [vendor,setVendor] = useState<Vendor | null>(null);
const [form,setForm] = useState<Vendor | null>(null);
const [editing,setEditing] = useState(false);

const fetchVendor = async () => {
const res = await api.get(`/vendors/${id}`);
setVendor(res.data);
setForm(res.data);
};

useEffect(()=>{
if(id){
fetchVendor();
}
},[id]);

if(!vendor || !form) return <div className="p-6">Loading...</div>;

const handleChange = (field:keyof Vendor,value:string) => {
setForm({...form,[field]:value});
};

const saveVendor = async () => {
await api.patch(`/vendors/${id}`,form);
setEditing(false);
fetchVendor();
};

const cancelEdit = () => {
setForm(vendor);
setEditing(false);
};

return(

  <div className="bg-white rounded-xl shadow border p-8">

  <div className="flex justify-between mb-6">
  <h2 className="text-lg font-semibold">Profile</h2>

{!editing ? (

<button
onClick={()=>setEditing(true)}
className="px-4 py-2 bg-black text-white rounded"

>

Edit </button>

) : (

  <div className="space-x-2">

<button
onClick={saveVendor}
className="px-4 py-2 bg-emerald-600 text-white rounded"

>

Save </button>

<button
onClick={cancelEdit}
className="px-4 py-2 bg-gray-300 rounded"

>

Cancel </button>

  </div>

)}

  </div>

  <div className="grid grid-cols-2 gap-6">

<Field label="Partner Name" value={form.name} editing={editing} onChange={(v)=>handleChange("name",v)}/>
<Field label="Alias" value={form.alias} editing={editing} onChange={(v)=>handleChange("alias",v)}/>
<Field label="Email" value={form.email} editing={editing} onChange={(v)=>handleChange("email",v)}/>
<Field label="Origin Country" value={form.originCountry} editing={editing} onChange={(v)=>handleChange("originCountry",v)}/>
<Field label="Origin City" value={form.originCity} editing={editing} onChange={(v)=>handleChange("originCity",v)}/>
<Field label="Registered Address" value={form.registeredAddress} editing={editing} onChange={(v)=>handleChange("registeredAddress",v)}/>
<Field label="Partner Category" value={form.partnerCategory} editing={editing} onChange={(v)=>handleChange("partnerCategory",v)}/>
<Field label="Tier Category" value={form.tierCategory} editing={editing} onChange={(v)=>handleChange("tierCategory",v)}/>
<Field label="Domain" value={form.domain} editing={editing} onChange={(v)=>handleChange("domain",v)}/>
<Field label="Skills" value={form.skills} editing={editing} onChange={(v)=>handleChange("skills",v)}/>
<Field label="Pincode" value={form.pincode} editing={editing} onChange={(v)=>handleChange("pincode",v)}/>

  </div>

  </div>

);

};

export default ProfileTab;

const Field = ({
label,
value,
editing,
onChange
}:{
label:string;
value?:string;
editing:boolean;
onChange:(v:string)=>void;
})=>(

<div>

<p className="text-sm text-gray-500 mb-1">{label}</p>

{editing ? (

<input
value={value || ""}
onChange={(e)=>onChange(e.target.value)}
className="w-full border rounded px-3 py-2"
/>

) : (

<div className="bg-gray-50 border rounded px-3 py-2">
{value || "-"}
</div>

)}

</div>

);
