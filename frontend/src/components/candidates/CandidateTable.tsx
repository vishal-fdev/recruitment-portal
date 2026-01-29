type Props = {
  data: any[];
  loading?: boolean;
};

export default function CandidateTable({
  data,
  loading = false,
}: Props) {
  if (loading) {
    return <div className="p-4">Loading candidates...</div>;
  }

  if (!data.length) {
    return <div className="p-4 text-gray-500">No candidates found</div>;
  }

  return (
    <div className="bg-white rounded-lg border overflow-hidden">
      <table className="min-w-full text-sm">
        <thead className="bg-green-100">
          <tr>
            <th className="px-4 py-3">ID</th>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Experience</th>
            <th className="px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {data.map((c) => (
            <tr key={c.id} className="border-t">
              <td className="px-4 py-3 text-green-600">
                CA{c.id}
              </td>
              <td className="px-4 py-3">{c.name}</td>
              <td className="px-4 py-3">{c.email}</td>
              <td className="px-4 py-3">{c.experience}</td>
              <td className="px-4 py-3">{c.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
