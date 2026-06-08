import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardBody,
  Grid,
  Heading,
  Paragraph,
  Tabs,
  Tab,
  Text,
} from 'grommet';
import { getJobDetails, type Job } from '../../services/jobService';
import StageBadge from '../../components/StageBadge';

type TabType = 'DETAILS' | 'INTERVIEWS' | 'CALIBRATION';

const VendorJobDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('DETAILS');

  useEffect(() => {
    if (id) {
      void loadJob(Number(id));
    }
  }, [id]);

  const loadJob = async (jobId: number) => {
    try {
      const data = await getJobDetails(jobId);
      if (data.interviewRounds) {
        data.interviewRounds = [...data.interviewRounds].sort((a, b) => a.id - b.id);
      }
      setJob(data);
    } catch (err) {
      console.error('Failed to fetch job', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Text>Loading...</Text>;
  }

  if (!job) {
    return <Text>Job not found.</Text>;
  }

  return (
    <Box gap="large">
      <Button
        label="Back"
        onClick={() => navigate('/vendor/candidates?tab=hrq')}
        alignSelf="start"
        primary
        color="brand"
      />

      <Box direction="row" justify="between" align="center" wrap gap="medium">
        <Heading level={2} margin="none">
          HRQ{job.id}
        </Heading>
        <StageBadge status={job.status} />
      </Box>

      <Tabs
        activeIndex={activeTab === 'DETAILS' ? 0 : activeTab === 'INTERVIEWS' ? 1 : 2}
        onActive={(index) =>
          setActiveTab(index === 0 ? 'DETAILS' : index === 1 ? 'INTERVIEWS' : 'CALIBRATION')
        }
      >
        <Tab title="Details">
          <Box pad={{ top: 'medium' }} gap="large">
            <Grid columns={{ count: 'fit', size: ['medium', 'medium'] }} gap="medium">
              <DetailCard title="Hiring Information">
                <InfoRow label="HRQ ID" value={`HRQ${job.id}`} />
                <InfoRow label="Role Hired For" value={job.title} />
                <InfoRow label="Business" value={job.department || '-'} />
                <InfoRow label="Request Assigned Date" value={job.startDate || '-'} />
              </DetailCard>

              <DetailCard title="Job Information">
                <InfoRow label="Location" value={job.location || '-'} />
                <InfoRow label="Experience" value={job.experience || '-'} />
                <InfoRow label="Employment Type" value={job.employmentType || '-'} />
                <InfoRow label="Budget" value={job.budget || '-'} />
                <InfoRow label="Start Date" value={job.startDate || '-'} />
                <InfoRow label="End Date" value={job.endDate || '-'} />
              </DetailCard>
            </Grid>

            <DetailCard title="Job Description">
              <Paragraph margin="none" color="text-paragraph">
                {job.description || 'No description provided.'}
              </Paragraph>
            </DetailCard>
          </Box>
        </Tab>

        <Tab title="Interview Rounds">
          <Box pad={{ top: 'medium' }} gap="medium">
            {job.interviewRounds && job.interviewRounds.length > 0 ? (
              job.interviewRounds.map((round, index) => (
                <Card
                  key={round.id}
                  background="white"
                  round="20px"
                  border={{ color: 'border-weak' }}
                  elevation="xsmall"
                >
                  <CardBody pad="medium" gap="medium">
                    <Box direction="row" align="center" gap="medium">
                      <Box
                        width="32px"
                        height="32px"
                        round="full"
                        background="background-contrast"
                        align="center"
                        justify="center"
                      >
                        <Text size="small" weight="bold">
                          {index + 1}
                        </Text>
                      </Box>
                      <Box>
                        <Text weight="bold">{round.roundName}</Text>
                        <Text size="small" color="text-weak">
                          {round.mode || 'N/A'}
                        </Text>
                      </Box>
                    </Box>
                    <Box gap="small">
                      <Text size="small" color="text-weak">
                        Panel Members
                      </Text>
                      <Box direction="row" gap="small" wrap>
                        {round.panels.map((panel) => (
                          <Box
                            key={panel.id}
                            background="background-contrast"
                            pad={{ horizontal: 'small', vertical: 'xsmall' }}
                            round="large"
                          >
                            <Text size="xsmall">{panel.name}</Text>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  </CardBody>
                </Card>
              ))
            ) : (
              <Card
                background="white"
                round="20px"
                border={{ color: 'border-weak' }}
                elevation="xsmall"
              >
                <CardBody pad="large" align="center">
                  <Text color="text-weak">No interview rounds configured.</Text>
                </CardBody>
              </Card>
            )}
          </Box>
        </Tab>

        <Tab title="Calibration">
          <Box pad={{ top: 'medium' }}>
            <DetailCard title="Calibration">
              {job.calibrationNotes ? (
                <Paragraph margin="none" color="text-paragraph">
                  {job.calibrationNotes}
                </Paragraph>
              ) : (
                <Text color="text-weak">No calibration pointers available for this job.</Text>
              )}
            </DetailCard>
          </Box>
        </Tab>
      </Tabs>
    </Box>
  );
};

const DetailCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <Card background="white" round="20px" border={{ color: 'border-weak' }} elevation="xsmall">
    <CardBody pad="medium" gap="medium">
      <Heading level={4} margin="none" size="small">
        {title}
      </Heading>
      {children}
    </CardBody>
  </Card>
);

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <Box direction="row" justify="between" gap="medium" wrap>
    <Text color="text-weak">{label}</Text>
    <Text weight="bold">{value}</Text>
  </Box>
);

export default VendorJobDetails;
