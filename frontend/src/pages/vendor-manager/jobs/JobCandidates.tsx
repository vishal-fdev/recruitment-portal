import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  DataTable,
  Heading,
  Text,
} from 'grommet';
import api from '../../../api/api';

interface Candidate {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: string;
  vendor: {
    email: string;
  };
}

const JobCandidates = () => {
  const { jobId } = useParams();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/jobs/${jobId}/candidates`)
      .then((res) => setCandidates(res.data))
      .finally(() => setLoading(false));
  }, [jobId]);

  return (
    <Box gap="24px">
      <Heading level={2} size="small" margin="none">
        Candidates for Job #{jobId}
      </Heading>

      <Box background="white" round="12px" border={{ color: 'border-weak' }} overflow="hidden">
        <DataTable
          data={candidates}
          columns={[
            { property: 'name', header: 'Name' },
            { property: 'vendor', header: 'Vendor', render: (datum) => datum.vendor.email },
            { property: 'email', header: 'Email' },
            { property: 'phone', header: 'Phone' },
            {
              property: 'status',
              header: 'Status',
              render: (datum) => (
                <Box as="span" pad={{ horizontal: '8px', vertical: '4px' }} round="8px" background="#DBEAFE">
                  <Text size="xsmall" color="#1D4ED8">
                    {datum.status}
                  </Text>
                </Box>
              ),
            },
          ]}
        />

        {loading && (
          <Box pad="24px" align="center">
            <Text size="small">Loading...</Text>
          </Box>
        )}

        {!loading && candidates.length === 0 && (
          <Box pad="24px" align="center">
            <Text size="small" color="#64748B">
              No candidates submitted yet
            </Text>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default JobCandidates;
