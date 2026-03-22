import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../api/api";
import { Pencil } from "lucide-react";

interface Sow {
  id?: number;
  sowNumber: string;
  startDate: string;
  endDate: string;
  tcValue: string;
  approvalStatus: string;
  status: string;
}

const SowManagementTab = () => {

  const { id } = useParams();

  const [data, setData] = useState<Sow[]>([]);
  const [editingRow, setEditingRow] = useState<number | null>(null);

  const load = async () => {
    const res = await api.get(`/vendors/${id}/sows`);
    setData(res.data);
  };

  useEffect(() => {
    if (id) {
      load();
    }
  }, [id]);

  const updateField = (
    index: number,
    field: keyof Sow,
    value: string
  ) => {
    const updated = [...data];

    // Type-safe assignment
    (updated[index] as any)[field] = value;

    setData(updated);
  };

  const saveRow = async (index: number) => {

    const row = data[index];

    if (row.id) {
      await api.patch(`/vendors/sows/${row.id}`, row);
    } else {
      const res = await api.post(`/vendors/${id}/sows`, row);

      const updated = [...data];
      updated[index] = res.data;
      setData(updated);
    }

    setEditingRow(null);
  };

  const addRow = () => {

    const newRow: Sow = {
      sowNumber: "",
      startDate: "",
      endDate: "",
      tcValue: "",
      approvalStatus: "",
      status: "Active"
    };

    setData([...data, newRow]);
    setEditingRow(data.length);
  };

  return (

    <div className="bg-white rounded-xl shadow border p-6">

      <div className="flex justify-between mb-4">

        <h2 className="text-lg font-semibold">
          SOW Management
        </h2>

        <button
          onClick={addRow}
          className="bg-emerald-600 text-white px-4 py-2 rounded"
        >
          + Add New SOW
        </button>

      </div>

      <table className="w-full text-sm">

        <thead className="bg-gray-100">

          <tr>
            <th className="px-4 py-2 text-left">SOW Number</th>
            <th className="px-4 py-2 text-left">Start Date</th>
            <th className="px-4 py-2 text-left">End Date</th>
            <th className="px-4 py-2 text-left">TC Value</th>
            <th className="px-4 py-2 text-left">Approval Status</th>
            <th className="px-4 py-2 text-left">Status</th>
            <th className="px-4 py-2 text-center">Actions</th>
          </tr>

        </thead>

        <tbody>

          {data.map((row, i) => (

            <tr key={i} className="border-t">

              {editingRow === i ? (

                <>
                  <td className="px-4 py-2">
                    <input
                      value={row.sowNumber}
                      onChange={(e) => updateField(i, "sowNumber", e.target.value)}
                      className="border rounded px-2 py-1 w-full"
                    />
                  </td>

                  <td className="px-4 py-2">
                    <input
                      type="date"
                      value={row.startDate}
                      onChange={(e) => updateField(i, "startDate", e.target.value)}
                      className="border rounded px-2 py-1 w-full"
                    />
                  </td>

                  <td className="px-4 py-2">
                    <input
                      type="date"
                      value={row.endDate}
                      onChange={(e) => updateField(i, "endDate", e.target.value)}
                      className="border rounded px-2 py-1 w-full"
                    />
                  </td>

                  <td className="px-4 py-2">
                    <input
                      value={row.tcValue}
                      onChange={(e) => updateField(i, "tcValue", e.target.value)}
                      className="border rounded px-2 py-1 w-full"
                    />
                  </td>

                  <td className="px-4 py-2">
                    <select
                      value={row.approvalStatus}
                      onChange={(e) => updateField(i, "approvalStatus", e.target.value)}
                      className="border rounded px-2 py-1 w-full"
                    >
                      <option value="">Select</option>
                      <option value="Pending">Pending</option>
                      <option value="Approved">Approved</option>
                    </select>
                  </td>

                  <td className="px-4 py-2">
                    <select
                      value={row.status}
                      onChange={(e) => updateField(i, "status", e.target.value)}
                      className="border rounded px-2 py-1 w-full"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </td>

                  <td className="px-4 py-2 text-center">
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
                  <td className="px-4 py-2">{row.sowNumber || "-"}</td>
                  <td className="px-4 py-2">{row.startDate || "-"}</td>
                  <td className="px-4 py-2">{row.endDate || "-"}</td>
                  <td className="px-4 py-2">{row.tcValue || "-"}</td>
                  <td className="px-4 py-2">{row.approvalStatus || "-"}</td>
                  <td className="px-4 py-2">{row.status || "-"}</td>

                  <td className="px-4 py-2 text-center">
                    <Pencil
                      size={16}
                      className="cursor-pointer"
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
  );
};

export default SowManagementTab;