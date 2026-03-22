import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../api/api";
import { Pencil } from "lucide-react";

interface Escalation {
  id?: string;
  contactType: string;
  name: string;
  email: string;
  phone: string;
  country: string;
  designation: string;
  approvalStatus: string;
  status: string;
}

const EscalationMatrixTab = () => {

  const { id } = useParams();

  const [data, setData] = useState<Escalation[]>([]);
  const [editingRow, setEditingRow] = useState<number | null>(null);

  const fetchEscalations = async () => {
    const res = await api.get(`/vendors/${id}/escalations`);
    setData(res.data);
  };

  useEffect(() => {
    if (id) {
      fetchEscalations();
    }
  }, [id]);

  const updateField = (
    index: number,
    field: keyof Escalation,
    value: string
  ) => {
    const updated = [...data];
    updated[index][field] = value;
    setData(updated);
  };

  const saveRow = async (index: number) => {

    const row = data[index];

    if (row.id) {
      await api.patch(`/vendors/escalations/${row.id}`, row);
    } else {
      const res = await api.post(`/vendors/${id}/escalations`, row);
      const updated = [...data];
      updated[index] = res.data;
      setData(updated);
    }

    setEditingRow(null);
  };

  const addRow = () => {

    const newRow: Escalation = {
      contactType: "",
      name: "",
      email: "",
      phone: "",
      country: "",
      designation: "",
      approvalStatus: "Pending",
      status: "Active"
    };

    setData([...data, newRow]);
    setEditingRow(data.length);
  };

  return (
    <div className="bg-white rounded-xl shadow border p-6">

      <div className="flex justify-between items-center mb-6">

        <h2 className="text-lg font-semibold">
          Escalation Matrix
        </h2>

        <button
          onClick={addRow}
          className="bg-emerald-600 text-white px-4 py-2 rounded"
        >
          + Add
        </button>

      </div>

      <div className="overflow-x-auto">

        <table className="w-full text-sm">

          <thead className="bg-gray-100">

            <tr className="text-left">

              <th className="px-4 py-3">Contact Type</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Contact Number</th>
              <th className="px-4 py-3">Country</th>
              <th className="px-4 py-3">Designation</th>
              <th className="px-4 py-3">Approval</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-center">Actions</th>

            </tr>

          </thead>

          <tbody>

            {data.map((row, i) => (

              <tr key={i} className="border-t">

                {editingRow === i ? (

                  <>
                    <td className="px-4 py-3">
                      <input
                        value={row.contactType}
                        onChange={(e) =>
                          updateField(i, "contactType", e.target.value)
                        }
                        className="border rounded px-2 py-1 w-full"
                      />
                    </td>

                    <td className="px-4 py-3">
                      <input
                        value={row.name}
                        onChange={(e) =>
                          updateField(i, "name", e.target.value)
                        }
                        className="border rounded px-2 py-1 w-full"
                      />
                    </td>

                    <td className="px-4 py-3">
                      <input
                        value={row.email}
                        onChange={(e) =>
                          updateField(i, "email", e.target.value)
                        }
                        className="border rounded px-2 py-1 w-full"
                      />
                    </td>

                    <td className="px-4 py-3">
                      <input
                        value={row.phone}
                        onChange={(e) =>
                          updateField(i, "phone", e.target.value)
                        }
                        className="border rounded px-2 py-1 w-full"
                      />
                    </td>

                    <td className="px-4 py-3">
                      <input
                        value={row.country}
                        onChange={(e) =>
                          updateField(i, "country", e.target.value)
                        }
                        className="border rounded px-2 py-1 w-full"
                      />
                    </td>

                    <td className="px-4 py-3">
                      <input
                        value={row.designation}
                        onChange={(e) =>
                          updateField(i, "designation", e.target.value)
                        }
                        className="border rounded px-2 py-1 w-full"
                      />
                    </td>

                    <td className="px-4 py-3">{row.approvalStatus}</td>

                    <td className="px-4 py-3">{row.status}</td>

                    <td className="px-4 py-3 text-center">

                      <button
                        onClick={() => saveRow(i)}
                        className="text-emerald-600 font-medium"
                      >
                        Save
                      </button>

                    </td>
                  </>

                ) : (

                  <>
                    <td className="px-4 py-3">{row.contactType}</td>
                    <td className="px-4 py-3">{row.name}</td>
                    <td className="px-4 py-3">{row.email}</td>
                    <td className="px-4 py-3">{row.phone}</td>
                    <td className="px-4 py-3">{row.country}</td>
                    <td className="px-4 py-3">{row.designation}</td>

                    <td className="px-4 py-3 text-emerald-600 font-medium">
                      {row.approvalStatus}
                    </td>

                    <td className="px-4 py-3">
                      <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-xs">
                        {row.status}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-center">

                      <Pencil
                        size={16}
                        className="cursor-pointer text-gray-600"
                        onClick={() => setEditingRow(i)}
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

export default EscalationMatrixTab;