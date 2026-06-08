import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  DataTable,
  Heading,
  Text,
} from 'grommet';
import { getJobs, type Job } from '../../services/jobService';

const PanelJobs = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadJobs = async () => {
      try {
        const data = await getJobs();
        setJobs(data);
      } catch (error) {
        console.error('Failed to load panel jobs', error);
      } finally {
        setLoading(false);
      }
    };

    void loadJobs();
  }, []);

  return (
    <Box gap="24px">
      <Box gap="4px">
        <Heading level={2} margin="none" size="small">
          Assigned Jobs
        </Heading>
        <Text size="small" color="#64748B">
          Jobs where you are assigned to the screening round.
        </Text>
      </Box>

      <Box background="white" round="16px" border={{ color: 'border-weak' }} overflow="hidden">
        <DataTable
          data={jobs}
          onClickRow={({ datum }) => navigate(`/panel/jobs/${datum.id}`)}
          columns={[
            { property: 'id', header: 'HRQ ID', render: (datum) => <Text color="#01A982" weight={600}>{`HRQ${datum.id}`}</Text> },
            { property: 'title', header: 'Role' },
            { property: 'location', header: 'Location', render: (datum) => datum.location || '-' },
            { property: 'hiringManager', header: 'Hiring Manager', render: (datum) => datum.hiringManager || '-' },
            { property: 'status', header: 'Status', render: (datum) => datum.status.replace(/_/g, ' ') },
          ]}
          background={{ header: '#96f7e4' }}
          pad={{ horizontal: 'medium', vertical: 'small' }}
        />
        {loading && (
          <Box pad="32px" align="center">
            <Text size="small" color="#64748B">
              Loading...
            </Text>
          </Box>
        )}
        {!loading && !jobs.length && (
          <Box pad="32px" align="center">
            <Text size="small" color="#94A3B8">
              No assigned jobs found.
            </Text>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default PanelJobs;
