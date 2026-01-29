// src/pages/hiring-manager/DashboardHome.tsx
const DashboardHome = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">
        Hiring Manager Dashboard
      </h1>

      <p className="text-gray-500">
        Overview of hiring pipeline and candidate progress
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Open Jobs" value="12" />
        <StatCard title="Candidates Received" value="87" />
        <StatCard title="Interviews Scheduled" value="14" />
      </div>
    </div>
  );
};

const StatCard = ({
  title,
  value,
}: {
  title: string;
  value: string;
}) => (
  <div className="bg-white p-5 rounded-lg shadow">
    <p className="text-sm text-gray-500">{title}</p>
    <p className="text-2xl font-semibold mt-1">{value}</p>
  </div>
);

export default DashboardHome;
