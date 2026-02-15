import { useEffect, useState } from 'react';

import type { DashboardStats } from '../../services/dashboardService';
import { getDashboardStats } from '../../services/dashboardService';

const DashboardHome = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await getDashboardStats();
        setStats(data);
      } catch (err) {
        console.error('Failed to load dashboard stats', err);
      }
    };

    loadStats();
  }, []);

  const kpis = stats?.kpis ?? {};

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">
        Hiring Manager Dashboard
      </h1>

      <p className="text-gray-500">
        Overview of hiring pipeline and candidate progress
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Open Jobs"
          value={kpis.openJobs ?? 0}
        />
        <StatCard
          title="Candidates Received"
          value={kpis.totalCandidates ?? 0}
        />
        <StatCard
          title="Interviews"
          value={kpis.interviews ?? 0}
        />
      </div>
    </div>
  );
};

export default DashboardHome;

const StatCard = ({
  title,
  value,
}: {
  title: string;
  value: number;
}) => (
  <div className="bg-white p-5 rounded-lg shadow">
    <p className="text-sm text-gray-500">{title}</p>
    <p className="text-2xl font-semibold mt-1">{value}</p>
  </div>
);
