import { useEffect, useState } from 'react';
import { Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  DataTable,
  Heading,
  Text,
} from 'grommet';
import api from '../../api/api';
import StageBadge from '../../components/StageBadge';

type Candidate = {
  id: number;
  name: string;
  email: string;
  phone?: string;
  experience?: number;
  job?: {
    id: number;
    title: string;
  };
  vendor?: {
    name: string;
  };
  status: string;
};

const PanelCandidates = () => {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/candidates');
        setCandidates(res.data || []);
      } catch (error) {
        console.error('Failed to load panel candidates', error);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  return (
    <Box gap="24px">
      <Box gap="4px">
        <Heading level={2} margin="none" size="small">
          Assigned Candidates
        </Heading>
        <Text size="small" color="#64748B">
          Candidates submitted against the jobs where you are the screening
          panel.
        </Text>
      </Box>

      <Box
        background="white"
        round="16px"
        border={{ color: 'border-weak' }}
        overflow="hidden"
      >
        <DataTable
          data={candidates}
          columns={[
            { property: 'name', header: 'Candidate', render: (datum) => <Text color="#01A982" weight={600}>{datum.name}</Text> },
            { property: 'email', header: 'Email' },
            { property: 'phone', header: 'Contact', render: (datum) => datum.phone || '-' },
            {
              property: 'job',
              header: 'Job',
              render: (datum) => (datum.job ? `HRQ${datum.job.id} - ${datum.job.title}` : '-'),
            },
            { property: 'vendor', header: 'Vendor', render: (datum) => datum.vendor?.name || '-' },
            {
              property: 'status',
              header: 'Status',
              render: (datum) => <StageBadge status={datum.status} />,
            },
            {
              property: 'view',
              header: 'View',
              render: (datum) => (
                <Button
                  plain
                  icon={<Eye size={16} />}
                  onClick={() => navigate(`/panel/candidates/${datum.id}`)}
                />
              ),
            },
          ]}
          background={{
            header: '#96f7e4',
          }}
          pad={{ horizontal: 'medium', vertical: 'small' }}
        />
        {!loading && !candidates.length && (
          <Box pad="32px" align="center">
            <Text size="small" color="#94A3B8">
              No candidates found.
            </Text>
          </Box>
        )}
        {loading && (
          <Box pad="32px" align="center">
            <Text size="small" color="#64748B">
              Loading...
            </Text>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default PanelCandidates;
