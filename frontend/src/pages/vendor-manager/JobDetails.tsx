import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardBody,
  Grid,
  Heading,
  Tabs,
  Tab,
  Text,
  TextArea,
} from 'grommet';
import {
  getJobDetails,
  approveJob,
  rejectJob,
} from '../../services/jobService';
import type { Job } from '../../services/jobService';

type TabType = 'DETAILS' | 'INTERVIEWS' | 'CALIBRATION';

const JobDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('DETAILS');

  const role = localStorage.getItem('role');

  const canAddCalibration =
    role === 'HIRING_MANAGER' ||
    role === 'VENDOR_MANAGER' ||
    role === 'VENDOR_MANAGER_HEAD';

  const [calibrationNotes, setCalibrationNotes] = useState('');
  const [isEditingCalibration, setIsEditingCalibration] = useState(false);

  useEffect(() => {
    if (id) void loadJob(Number(id));
  }, [id]);

  const loadJob = async (jobId: number) => {
    try {
      const data = await getJobDetails(jobId);
      if (data.interviewRounds) {
        data.interviewRounds = [...data.interviewRounds].sort((a, b) => a.id - b.id);
      }
      setJob(data);
    } catch (err) {
      console.error('Failed to fetch job');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!job) return;
    setActionLoading(true);
    await approveJob(job.id);
    await loadJob(job.id);
    setActionLoading(false);
  };

  const handleReject = async () => {
    if (!job) return;
    setActionLoading(true);
    await rejectJob(job.id);
    await loadJob(job.id);
    setActionLoading(false);
  };

  const handleSaveCalibration = () => {
    console.log('Calibration saved:', calibrationNotes);
    setIsEditingCalibration(false);
  };

  if (loading) return <Text>Loading...</Text>;
  if (!job) return <Text>Job not found.</Text>;

  return (
    <Box gap="24px">
      <Button
        label="<- Back"
        onClick={() => navigate('/vendor-manager/jobs')}
        primary
        color="#16A34A"
        alignSelf="start"
      />

      <Box direction="row" justify="between" align="center">
        <Heading level={2} size="small" margin="none">
          HRQ{job.id}
        </Heading>
        <Box
          pad={{ horizontal: '16px', vertical: '8px' }}
          round="999px"
          background={getStatusStyle(job.status).background}
        >
          <Text size="small" weight={500} color={getStatusStyle(job.status).color}>
            {job.status}
          </Text>
        </Box>
      </Box>

      {job.status === 'PENDING_APPROVAL' && (
        <Box direction="row" gap="16px">
          <Button
            label="Approve"
            onClick={handleApprove}
            disabled={actionLoading}
            primary
            color="black"
          />

          <Button
            label="Reject"
            onClick={handleReject}
            disabled={actionLoading}
          />
        </Box>
      )}

      <Tabs
        activeIndex={tabIndexFromType(activeTab)}
        onActive={(index) => setActiveTab(tabTypeFromIndex(index))}
      >
        <Tab title="Details" />
        <Tab title="Interview Rounds" />
        <Tab title="Calibration" />
      </Tabs>

      {activeTab === 'DETAILS' && (
        <Box gap="24px">
          <Grid columns={['flex', 'flex']} gap="24px">
            <InfoCard title="Hiring Information">
              <InfoRow label="HRQ ID" value={`HRQ${job.id}`} />
              <InfoRow label="Role Hired For" value={job.title} />
              <InfoRow label="Business" value={job.department || '-'} />
              <InfoRow label="Request Assigned Date" value={job.startDate || '-'} />
            </InfoCard>

            <InfoCard title="Job Information">
              <InfoRow label="Location" value={job.location} />
              <InfoRow label="Experience" value={job.experience} />
              <InfoRow label="Employment Type" value={job.employmentType || '-'} />
              <InfoRow label="Budget" value={job.budget || '-'} />
              <InfoRow label="Start Date" value={job.startDate || '-'} />
              <InfoRow label="End Date" value={job.endDate || '-'} />
            </InfoCard>
          </Grid>

          <InfoCard title="Job Description">
            <Text size="small" color="#475569">
              {job.description || 'No description provided.'}
            </Text>
          </InfoCard>
        </Box>
      )}

      {activeTab === 'INTERVIEWS' && (
        <Box gap="16px">
          {job.interviewRounds && job.interviewRounds.length > 0 ? (
            job.interviewRounds.map((round, index) => (
              <Card key={round.id} round="16px" border={{ color: 'border-weak' }} background="white">
                <CardBody pad="24px" gap="16px">
                  <Box direction="row" gap="16px" align="center">
                    <Box
                      width="32px"
                      height="32px"
                      round="50%"
                      background="#D1D5DB"
                      align="center"
                      justify="center"
                    >
                      <Text size="small" weight={600}>
                        {index + 1}
                      </Text>
                    </Box>
                    <Box>
                      <Text weight={500}>{round.roundName}</Text>
                      <Text size="xsmall" color="#64748B">
                        {round.mode || 'N/A'}
                      </Text>
                    </Box>
                  </Box>

                  <Text size="small" color="#64748B">
                    Panel Members
                  </Text>

                  <Box direction="row" wrap gap="8px">
                    {round.panels.map((panel) => (
                      <Box
                        key={panel.id}
                        pad={{ horizontal: '12px', vertical: '6px' }}
                        background="#E5E7EB"
                        round="999px"
                      >
                        <Text size="xsmall">{panel.name}</Text>
                      </Box>
                    ))}
                  </Box>
                </CardBody>
              </Card>
            ))
          ) : (
            <Card round="16px" border={{ color: 'border-weak' }} background="white">
              <CardBody pad="40px" align="center">
                <Text color="#64748B">No interview rounds configured.</Text>
              </CardBody>
            </Card>
          )}
        </Box>
      )}

      {activeTab === 'CALIBRATION' && (
        <Card round="16px" border={{ color: 'border-weak' }} background="white">
          <CardBody pad="32px">
            {!calibrationNotes && !isEditingCalibration && (
              <Box align="center" gap="16px">
                <Text size="large" weight={500} color="#64748B">
                  No Calibration Information
                </Text>
                <Text size="small" color="#64748B" textAlign="center">
                  No calibration sessions have been scheduled or conducted yet for this hiring request.
                </Text>

                {canAddCalibration && (
                  <Button
                    primary
                    color="black"
                    label="Add Calibration Pointers"
                    onClick={() => setIsEditingCalibration(true)}
                  />
                )}
              </Box>
            )}

            {isEditingCalibration && (
              <Box gap="16px">
                <TextArea
                  value={calibrationNotes}
                  onChange={(e) => setCalibrationNotes(e.target.value)}
                  rows={5}
                  resize={false}
                />

                <Box direction="row" gap="12px">
                  <Button primary color="black" label="Save" onClick={handleSaveCalibration} />
                  <Button label="Cancel" onClick={() => setIsEditingCalibration(false)} />
                </Box>
              </Box>
            )}

            {calibrationNotes && !isEditingCalibration && (
              <Box gap="16px">
                <Text size="small" color="#475569">
                  {calibrationNotes}
                </Text>

                {canAddCalibration && (
                  <Button label="Edit Calibration" onClick={() => setIsEditingCalibration(true)} alignSelf="start" />
                )}
              </Box>
            )}
          </CardBody>
        </Card>
      )}
    </Box>
  );
};

const tabIndexFromType = (type: TabType) => {
  switch (type) {
    case 'DETAILS':
      return 0;
    case 'INTERVIEWS':
      return 1;
    case 'CALIBRATION':
      return 2;
  }
};

const tabTypeFromIndex = (index: number): TabType => {
  switch (index) {
    case 1:
      return 'INTERVIEWS';
    case 2:
      return 'CALIBRATION';
    default:
      return 'DETAILS';
  }
};

const getStatusStyle = (status: string) => {
  switch (status) {
    case 'APPROVED':
      return { background: '#D1D5DB', color: '#111827' };
    case 'REJECTED':
      return { background: '#9CA3AF', color: '#111827' };
    case 'PENDING_APPROVAL':
      return { background: '#E5E7EB', color: '#111827' };
    default:
      return { background: '#E5E7EB', color: '#111827' };
  }
};

const InfoCard = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <Card round="16px" border={{ color: 'border-weak' }} background="white">
    <CardBody>
      <Box pad={{ horizontal: '24px', vertical: '16px' }} border={{ side: 'bottom', color: 'border-weak' }}>
        <Text weight={500} color="#475569">
          {title}
        </Text>
      </Box>
      <Box pad="24px" gap="16px">
        {children}
      </Box>
    </CardBody>
  </Card>
);

const InfoRow = ({
  label,
  value,
}: {
  label: string;
  value: string;
}) => (
  <Box direction="row" justify="between" gap="16px">
    <Text size="small" color="#64748B">
      {label}
    </Text>
    <Text size="small" weight={500} textAlign="end">
      {value}
    </Text>
  </Box>
);

export default JobDetails;
