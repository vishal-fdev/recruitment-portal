// src/pages/hiring-manager/HiringManagerDashboard.tsx
const HiringManagerDashboard = () => {
  return (
    <>
      <h1 className="text-2xl font-semibold mb-1">
        Hiring Manager Dashboard
      </h1>
      <p className="text-gray-500 mb-6">
        Overview of hiring pipeline and candidate progress
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-4 rounded shadow">
          <p className="text-sm text-gray-500">Open Jobs</p>
          <p className="text-2xl font-semibold">12</p>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <p className="text-sm text-gray-500">
            Candidates Received
          </p>
          <p className="text-2xl font-semibold">87</p>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <p className="text-sm text-gray-500">
            Interviews Scheduled
          </p>
          <p className="text-2xl font-semibold">14</p>
        </div>
      </div>
    </>
  );
};

export default HiringManagerDashboard;
