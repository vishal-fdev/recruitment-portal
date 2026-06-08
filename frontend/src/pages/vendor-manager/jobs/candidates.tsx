import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
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
  city: string;
  experience: number;
  status: string;
  createdAt: string;
  vendor: {
    email: string;
  };
}

const JobCandidates = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    api
      .get(`/jobs/${id}/candidates`)
      .then((res) => setCandidates(res.data))
      .catch(() => alert('Failed to load candidates'))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <Box gap="24px">
      <Box direction="row" justify="between" align="start">
        <Box gap="4px">
          <Heading level={2} size="small" margin="none">
            Candidates for Job #{id}
          </Heading>
          <Text size="small" color="#64748B">
            Candidates submitted by vendors
          </Text>
        </Box>

        <Button label="<- Back" onClick={() => navigate(-1)} />
      </Box>

      <Box background="white" round="12px" border={{ color: 'border-weak' }} overflow="hidden">
        <DataTable
          data={candidates}
          columns={[
            { property: 'name', header: 'Name' },
            { property: 'email', header: 'Email' },
            { property: 'phone', header: 'Contact' },
            { property: 'city', header: 'City' },
            { property: 'vendor', header: 'Vendor', render: (datum) => datum.vendor.email },
            { property: 'experience', header: 'Experience' },
            {
              property: 'status',
              header: 'Status',
              render: (datum) => (
                <Box
                  as="span"
                  pad={{ horizontal: '8px', vertical: '4px' }}
                  round="8px"
                  background="#DBEAFE"
                >
                  <Text size="xsmall" color="#1D4ED8">
                    {datum.status}
                  </Text>
                </Box>
              ),
            },
            {
              property: 'createdAt',
              header: 'Created On',
              render: (datum) => new Date(datum.createdAt).toLocaleDateString(),
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
