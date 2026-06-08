import { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Heading,
  Text,
} from 'grommet';
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
    <Box gap="32px">
      <Box gap="4px">
        <Heading level={2} margin="none" size="small">
          Panel Dashboard
        </Heading>
        <Text size="small" color="#64748B">
          View your assigned screening jobs and candidates.
        </Text>
      </Box>

      <Grid columns={['flex', 'flex', 'flex']} gap="24px">
        <StatCard title="Assigned Jobs" value={stats?.kpis.openJobs ?? 0} />
        <StatCard title="Assigned Candidates" value={stats?.kpis.totalCandidates ?? 0} />
        <StatCard title="In Review" value={stats?.kpis.interviews ?? 0} />
      </Grid>
    </Box>
  );
};

const StatCard = ({
  title,
  value,
}: {
  title: string;
  value: number | string;
}) => (
  <Box
    round="16px"
    border={{ color: 'border-weak' }}
    background="white"
    pad="24px"
    align="center"
    gap="8px"
  >
    <Text size="small" color="#64748B">
      {title}
    </Text>
    <Text size="xxlarge" weight={600} color="#1F2937">
      {value}
    </Text>
  </Box>
);

export default PanelDashboard;
