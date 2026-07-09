import { useEffect, useMemo, useState } from 'react';
import { Box, Button, Text } from 'grommet';
import { useNavigate } from 'react-router-dom';
import { Briefcase, UserPlus, Users, CheckCircle } from 'lucide-react';
import { authService } from '../../auth/authService';
import { hpeBadgedHiringService } from '../../services/hpeBadgedHiringService';

const cardStyle = {
  background: '#FFFFFF',
  border: '1px solid #D9E1EA',
  borderRadius: 18,
  boxShadow: '0 12px 28px rgba(15, 23, 42, 0.08)',
} as const;

const Dashboard = () => {
  const navigate = useNavigate();
  const isRecruiter = authService.getRole() === 'BADGED_RECRUITER';
  const [stats, setStats] = useState({
    jobsCreated: 0,
    assignedJobs: 0,
    candidatesSubmitted: 0,
    recruiters: 0,
    selected: 0,
    rejected: 0,
  });

  useEffect(() => {
    hpeBadgedHiringService.dashboard().then(setStats).catch(() => undefined);
  }, []);

  const kpis = useMemo(
    () => [
      { label: isRecruiter ? 'Assigned Jobs' : 'Jobs Created', value: isRecruiter ? stats.assignedJobs : stats.jobsCreated, accent: '#01A982', icon: Briefcase },
      { label: isRecruiter ? 'Open Submissions' : 'Assigned Jobs', value: isRecruiter ? stats.candidatesSubmitted : stats.assignedJobs, accent: '#2F7BFF', icon: CheckCircle },
      { label: 'Candidates Submitted', value: stats.candidatesSubmitted, accent: '#7C3AED', icon: Users },
      { label: isRecruiter ? 'Selected Candidates' : 'Recruiters', value: isRecruiter ? stats.selected : stats.recruiters, accent: '#F59E0B', icon: UserPlus },
    ],
    [isRecruiter, stats],
  );

  return (
    <Box gap="26px" pad={{ bottom: '48px' }}>
      <Box
        direction="row-responsive"
        align="center"
        justify="between"
        gap="20px"
        pad={{ horizontal: '32px', vertical: '32px' }}
        style={{ ...cardStyle, minHeight: 142 }}
      >
        <Box gap="6px">
          <Text size="38px" weight={700} color="#001A3D">
            Badged hiring dashboard
          </Text>
          <Text size="15px" color="#50648A">
            {isRecruiter
              ? 'View assigned requisitions and submit candidates'
              : 'Create requisitions, assign recruiters, and track submissions'}
          </Text>
        </Box>
        {!isRecruiter && (
          <Box direction="row" gap="12px" flex={false}>
            <Button
              primary
              color="#01A982"
              label="+ Create job"
              onClick={() => navigate('/vendor-manager/badged-hiring/jobs/create')}
              style={{ color: '#FFFFFF', borderRadius: 12, fontWeight: 700, padding: '12px 20px' }}
            />
            <Button
              label="Create recruiter"
              onClick={() => navigate('/vendor-manager/badged-hiring/recruiters')}
              style={{ borderRadius: 12, padding: '12px 18px', fontWeight: 600 }}
            />
          </Box>
        )}
      </Box>

      <Box style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(210px, 1fr))', gap: 16 }}>
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Box key={kpi.label} pad="24px" style={{ ...cardStyle, minHeight: 138, borderTop: `4px solid ${kpi.accent}` }}>
              <Box direction="row" justify="between" align="center">
                <Text size="12px" weight={700} color="#92A0BD" style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>{kpi.label}</Text>
                <Icon size={20} color={kpi.accent} />
              </Box>
              <Text size="42px" weight={700} color="#001A3D" margin={{ top: '16px' }}>{kpi.value}</Text>
            </Box>
          );
        })}
      </Box>

      <Box style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 24 }}>
        <Box pad="28px" style={{ ...cardStyle, minHeight: 170 }}>
          <Text size="18px" weight={700}>Selection summary</Text>
          <Text size="14px" color="#50648A" margin={{ top: '18px' }}>Selected candidates: {stats.selected}</Text>
          <Text size="14px" color="#50648A" margin={{ top: '10px' }}>Rejected candidates: {stats.rejected}</Text>
        </Box>
        <Box pad="28px" style={{ ...cardStyle, minHeight: 170 }}>
          <Text size="18px" weight={700}>Recent activity</Text>
          <Text size="14px" color="#8A98B5" margin={{ top: '54px' }} textAlign="center">
            Badged hiring activity will appear here as recruiters submit candidates.
          </Text>
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard;
