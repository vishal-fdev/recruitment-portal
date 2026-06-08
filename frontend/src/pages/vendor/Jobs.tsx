import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  DataTable,
  Heading,
  Layer,
  Paragraph,
  Text,
} from 'grommet';
import api from '../../api/api';
import StageBadge from '../../components/StageBadge';

interface Job {
  id: number;
  title: string;
  location: string;
  experience: string;
  status: string;
  numberOfPositions?: number;
  currentNumberOfPositions?: number;
  positions?: {
    id: number;
    openings?: number;
    currentOpenings?: number;
  }[];
  jdFileName?: string;
}

type JobRow = Job & {
  hrqId: string;
  totalPositions: number;
  currentPositions: number;
};

const Jobs = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadError, setDownloadError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    void loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      const res = await api.get('/jobs');
      const sorted = (res.data || []).sort((a: Job, b: Job) => b.id - a.id);
      setJobs(sorted);
    } catch (err) {
      console.error('Failed to load jobs', err);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (e: React.MouseEvent, jobId: number, fileName?: string) => {
    e.stopPropagation();
    try {
      const response = await api.get(`/jobs/${jobId}/jd/download`, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName || `JOB-${jobId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download JD', error);
      setDownloadError('Unable to download JD right now.');
    }
  };

  const submitCandidate = (e: React.MouseEvent, jobId: number) => {
    e.stopPropagation();
    navigate(`/vendor/candidates/create?jobId=${jobId}`);
  };

  const openJobDetails = (jobId: number) => {
    navigate(`/vendor/jobs/${jobId}`);
  };

  const rows: JobRow[] = jobs.map((job) => {
    const additionalTotal =
      job.positions?.reduce((sum, position) => sum + Number(position.openings || 0), 0) || 0;
    const additionalCurrent =
      job.positions?.reduce(
        (sum, position) => sum + Number(position.currentOpenings ?? position.openings ?? 0),
        0,
      ) || 0;

    return {
      ...job,
      hrqId: `HRQ${job.id}`,
      totalPositions: Number(job.numberOfPositions || 0) + additionalTotal,
      currentPositions:
        Number(job.currentNumberOfPositions ?? job.numberOfPositions ?? 0) + additionalCurrent,
    };
  });

  return (
    <Box gap="large">
      <Box gap="xsmall">
        <Heading level={2} margin="none" color="text-strong">
          Available Job Requisitions
        </Heading>
        <Paragraph margin="none" color="text-paragraph">
          View jobs assigned to you and submit candidates
        </Paragraph>
      </Box>

      <Box
        background="white"
        round="20px"
        border={{ color: 'border-weak' }}
        overflow="auto"
        pad="none"
        elevation="xsmall"
      >
        <DataTable
          data={rows}
          step={20}
          sortable
          columns={[
            {
              property: 'hrqId',
              header: <Text weight="bold">HRQID</Text>,
              render: (datum) => <Text weight="bold">{datum.hrqId}</Text>,
              align: 'center',
            },
            {
              property: 'title',
              header: <Text weight="bold">Role Hired For</Text>,
              align: 'center',
            },
            {
              property: 'location',
              header: <Text weight="bold">Location</Text>,
              align: 'center',
            },
            {
              property: 'experience',
              header: <Text weight="bold">Experience</Text>,
              align: 'center',
            },
            {
              property: 'totalPositions',
              header: <Text weight="bold">Total Positions</Text>,
              align: 'center',
            },
            {
              property: 'currentPositions',
              header: <Text weight="bold">Current Positions</Text>,
              align: 'center',
            },
            {
              property: 'status',
              header: <Text weight="bold">Status</Text>,
              render: (datum) => <StageBadge status={datum.status} />,
              align: 'center',
            },
            {
              property: 'jd',
              header: <Text weight="bold">JD</Text>,
              render: (datum) =>
                datum.jdFileName ? (
                  <Button
                    label="Download JD"
                    plain
                    color="brand"
                    onClick={(event) => void handleDownload(event, datum.id, datum.jdFileName)}
                  />
                ) : (
                  <Text color="text-weak">-</Text>
                ),
              align: 'center',
            },
            {
              property: 'action',
              header: <Text weight="bold">Action</Text>,
              render: (datum) => (
                <Button
                  label="Submit Candidates"
                  primary
                  color="brand"
                  onClick={(event) => submitCandidate(event, datum.id)}
                />
              ),
              align: 'center',
            },
          ]}
          onClickRow={({ datum }) => openJobDetails(datum.id)}
          fill
          pin
        />
      </Box>

      {downloadError ? (
        <Layer
          onEsc={() => setDownloadError('')}
          onClickOutside={() => setDownloadError('')}
          modal
          responsive={false}
        >
          <Box pad="medium" gap="medium" width="medium">
            <Heading level={4} margin="none">
              Download Error
            </Heading>
            <Text>{downloadError}</Text>
            <Box direction="row" justify="end">
              <Button primary label="OK" onClick={() => setDownloadError('')} />
            </Box>
          </Box>
        </Layer>
      ) : null}
    </Box>
  );
};

export default Jobs;
