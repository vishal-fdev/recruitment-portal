import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../api/api";
import { Pencil } from "lucide-react";

interface Engagement {
  id?: string;
  engagementStatus: string;
  engagementType: string;
  businessUnit: string;
  evaluationStatus: string;
  evaluatedBy: string;
  extendedDate?: string;
}

const EngagementTab = () => {

  const { id } = useParams();

  const [data,setData] = useState<Engagement[]>([]);
  const [editingRow,setEditingRow] = useState<number | null>(null);

  /* ================= LOAD DATA ================= */

  const load = async () => {
    const res = await api.get(`/vendors/${id}/engagements`);
    setData(res.data);
  };

  useEffect(()=>{
    if(id){
      load();
    }
  },[id]);

  /* ================= UPDATE FIELD ================= */

  const updateField = (
    index:number,
    field:keyof Engagement,
    value:string
  )=>{
    const updated=[...data];
    updated[index][field]=value;
    setData(updated);
  };

  /* ================= SAVE ================= */

  const saveRow = async(index:number)=>{

    const row=data[index];

    if(row.id){
      await api.patch(`/vendors/engagements/${row.id}`,row);
    }else{
      const res=await api.post(`/vendors/${id}/engagements`,row);

      const updated=[...data];
      updated[index]=res.data;
      setData(updated);
    }

    setEditingRow(null);
  };

  /* ================= ADD ROW ================= */

  const addRow = ()=>{

    const newRow:Engagement={
      engagementStatus:"",
      engagementType:"",
      businessUnit:"",
      evaluationStatus:"",
      evaluatedBy:"",
      extendedDate:""
    };

    setData([...data,newRow]);
    setEditingRow(data.length);
  };

  return(

  <div className="bg-white rounded-xl shadow border p-6">

  {/* HEADER */}

  <div className="flex justify-between items-center mb-6">

  <h2 className="text-lg font-semibold">
  Engagement History
  </h2>

  <button
  onClick={addRow}
  className="bg-emerald-600 text-white px-4 py-2 rounded"
  >
  + Add
  </button>

  </div>

  {/* TABLE */}

  <div className="overflow-x-auto">

  <table className="w-full text-sm">

  <thead className="bg-gray-100">

  <tr>

  <th className="px-4 py-3 text-left">Status</th>
  <th className="px-4 py-3 text-left">Type</th>
  <th className="px-4 py-3 text-left">Business Unit</th>
  <th className="px-4 py-3 text-left">Evaluation</th>
  <th className="px-4 py-3 text-left">Evaluated By</th>
  <th className="px-4 py-3 text-left">Extended Date</th>
  <th className="px-4 py-3 text-center">Actions</th>

  </tr>

  </thead>

  <tbody>

  {data.map((row,i)=>(

  <tr key={i} className="border-t">

  {editingRow===i ? (

  <>
  <td className="px-4 py-3">

  <select
  value={row.engagementStatus}
  onChange={(e)=>updateField(i,"engagementStatus",e.target.value)}
  className="border rounded px-2 py-1 w-full"
  >
  <option value="">Select</option>
  <option value="Active">Active</option>
  <option value="Inactive">Inactive</option>
  </select>

  </td>

  <td className="px-4 py-3">

  <select
  value={row.engagementType}
  onChange={(e)=>updateField(i,"engagementType",e.target.value)}
  className="border rounded px-2 py-1 w-full"
  >
  <option value="">Select</option>
  <option value="Labour">Labour</option>
  <option value="Project">Project</option>
  <option value="Fixed Cost">Fixed Cost</option>
  </select>

  </td>

  <td className="px-4 py-3">

  <input
  value={row.businessUnit}
  onChange={(e)=>updateField(i,"businessUnit",e.target.value)}
  className="border rounded px-2 py-1 w-full"
  />

  </td>

  <td className="px-4 py-3">

  <select
  value={row.evaluationStatus}
  onChange={(e)=>updateField(i,"evaluationStatus",e.target.value)}
  className="border rounded px-2 py-1 w-full"
  >
  <option value="">Select</option>
  <option value="Contract">Contract</option>
  <option value="Empanelled">Empanelled</option>
  </select>

  </td>

  <td className="px-4 py-3">

  <input
  value={row.evaluatedBy}
  onChange={(e)=>updateField(i,"evaluatedBy",e.target.value)}
  className="border rounded px-2 py-1 w-full"
  />

  </td>

  <td className="px-4 py-3">

  <input
  type="date"
  value={row.extendedDate || ""}
  onChange={(e)=>updateField(i,"extendedDate",e.target.value)}
  className="border rounded px-2 py-1 w-full"
  />

  </td>

  <td className="px-4 py-3 text-center">

  <button
  onClick={()=>saveRow(i)}
  className="text-emerald-600 font-medium"
  >
  Save
  </button>

  </td>

  </>

  ):(

  <>
  <td className="px-4 py-3">{row.engagementStatus || "-"}</td>
  <td className="px-4 py-3">{row.engagementType || "-"}</td>
  <td className="px-4 py-3">{row.businessUnit || "-"}</td>
  <td className="px-4 py-3">{row.evaluationStatus || "-"}</td>
  <td className="px-4 py-3">{row.evaluatedBy || "-"}</td>
  <td className="px-4 py-3">{row.extendedDate || "-"}</td>

  <td className="px-4 py-3 text-center">

  <Pencil
  size={16}
  className="cursor-pointer text-gray-600"
  onClick={()=>setEditingRow(i)}
  />

  </td>

  </>
  )}

  </tr>

  ))}

  </tbody>

  </table>

  </div>

  </div>

  );
};

export default EngagementTab;