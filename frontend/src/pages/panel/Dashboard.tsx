import { useEffect, useState } from 'react';
import { getDashboardStats } from '../../services/dashboardService';
import type { DashboardStats } from '../../services/dashboardService';

const PanelDashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const data = await getDashboardStats();
        if (mounted) {
          setStats(data);
        }
      } catch (error) {
        console.error('Failed to load panel dashboard', error);
      }
    };

    void load();
    const interval = window.setInterval(() => void load(), 30000);

    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-800">Panel Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          View your assigned screening jobs and candidates.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <StatCard title="Assigned Jobs" value={stats?.kpis.openJobs ?? 0} />
        <StatCard title="Assigned Candidates" value={stats?.kpis.totalCandidates ?? 0} />
        <StatCard title="In Review" value={stats?.kpis.interviews ?? 0} />
      </div>
    </div>
  );
};

const StatCard = ({
  title,
  value,
}: {
  title: string;
  value: number | string;
}) => (
  <div className="rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm">
    <p className="text-sm text-gray-500">{title}</p>
    <p className="mt-2 text-3xl font-semibold text-gray-800">{value}</p>
  </div>
);

export default PanelDashboard;
