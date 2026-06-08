import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Grid,
  Heading,
  Paragraph,
  Spinner,
  Tab,
  Tabs,
  Text,
  TextArea,
} from 'grommet';
import { approveJob, getJobDetails, rejectJob } from '../services/jobService';
import type { Job } from '../services/jobService';

type TabType = 'DETAILS' | 'INTERVIEWS' | 'CALIBRATION';

type JobDetailsViewProps = {
  backRoute: string;
  showApprovalActions: boolean;
};

type BackfillEntry = {
  employeeId?: string;
  employeeName?: string;
};

const TAB_INDEX: Record<TabType, number> = {
  DETAILS: 0,
  INTERVIEWS: 1,
  CALIBRATION: 2,
};

const JobDetailsView = ({
  backRoute,
  showApprovalActions,
}: JobDetailsViewProps) => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('DETAILS');
  const [calibrationNotes, setCalibrationNotes] = useState('');
  const [isEditingCalibration, setIsEditingCalibration] = useState(false);
  const canResubmit =
    !showApprovalActions && ['PENDING_APPROVAL', 'REJECTED'].includes(job?.status || '');

  useEffect(() => {
    if (id) {
      void loadJob(Number(id));
    }
  }, [id]);

  const loadJob = async (jobId: number) => {
    try {
      const data = await getJobDetails(jobId);
      const order = ['SCREENING', 'TECH', 'OPS'];

      if (data.interviewRounds) {
        data.interviewRounds = [...data.interviewRounds].sort(
          (a, b) => order.indexOf(a.roundName) - order.indexOf(b.roundName),
        );
      }

      setJob(data);
    } catch {
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
    setIsEditingCalibration(false);
  };

  if (loading) {
    return (
      <Box align="center" justify="center" pad="xlarge">
        <Spinner size="medium" />
      </Box>
    );
  }

  if (!job) {
    return (
      <Box pad="large">
        <Text>Job not found.</Text>
      </Box>
    );
  }

  let hiringManagerName = job.hiringManager;
  if (!hiringManagerName) {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        hiringManagerName = payload.name || payload.email;
      }
    } catch {}
  }

  const formatSkills = (skills: unknown) => {
    if (!skills) return '-';
    if (Array.isArray(skills)) return skills.join(', ');
    return String(skills);
  };

  const parseBackfillEntries = (
    employeeIdValue: unknown,
    employeeNameValue: unknown,
  ): BackfillEntry[] => {
    const parseValue = (value: unknown) => {
      if (typeof value !== 'string') return null;

      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : null;
      } catch {
        return null;
      }
    };

    const parsedIds = parseValue(employeeIdValue);
    if (parsedIds?.length) {
      return parsedIds.map((entry: any) => ({
        employeeId: entry?.employeeId || '-',
        employeeName: entry?.employeeName || '-',
      }));
    }

    const parsedNames = parseValue(employeeNameValue);
    if (parsedNames?.length) {
      return parsedNames.map((entry: any) => ({
        employeeId: entry?.employeeId || '-',
        employeeName: entry?.employeeName || '-',
      }));
    }

    return [
      {
        employeeId:
          typeof employeeIdValue === 'string' && employeeIdValue.trim()
            ? employeeIdValue
            : '-',
        employeeName:
          typeof employeeNameValue === 'string' && employeeNameValue.trim()
            ? employeeNameValue
            : '-',
      },
    ];
  };

  const renderBackfillValue = (
    employeeIdValue: unknown,
    employeeNameValue: unknown,
    field: 'employeeId' | 'employeeName',
  ) => {
    const entries = parseBackfillEntries(employeeIdValue, employeeNameValue);

    return (
      <Box gap="xsmall" align="end">
        {entries.map((entry, index) => (
          <Text key={`${field}-${index}`} size="small" weight={500}>
            {field === 'employeeId' ? entry.employeeId || '-' : entry.employeeName || '-'}
          </Text>
        ))}
      </Box>
    );
  };

  return (
    <Box gap="large">
      <Button
        label="Back"
        onClick={() => navigate(backRoute)}
        color="white"
        primary
        style={{ alignSelf: 'flex-start' }}
      />

      <Box direction="row" justify="between" align="center" gap="medium" wrap>
        <Heading level={2} margin="none">
          HRQ{job.id}
        </Heading>
        {canResubmit && (
          <Button
            primary
            color="brand"
            label="Resubmit"
            onClick={() =>
              navigate(`/hiring-manager/edit-job/${job.id}`, {
                state: { job },
              })
            }
          />
        )}
      </Box>

      {showApprovalActions && job.status === 'PENDING_APPROVAL' && (
        <Box direction="row" gap="small">
          <Button
            label="Approve"
            primary
            color="dark-1"
            onClick={() => void handleApprove()}
            disabled={actionLoading}
          />
          <Button
            label="Reject"
            onClick={() => void handleReject()}
            disabled={actionLoading}
          />
        </Box>
      )}

      <Box
        background="white"
        round="medium"
        pad="small"
        border={{ color: 'border', size: 'xsmall' }}
      >
        <Tabs
          activeIndex={TAB_INDEX[activeTab]}
          onActive={(index) =>
            setActiveTab((Object.keys(TAB_INDEX) as TabType[]).find((key) => TAB_INDEX[key] === index) || 'DETAILS')
          }
        >
          <Tab title="Details" />
          <Tab title="Interview Rounds" />
          <Tab title="Calibration" />
        </Tabs>
      </Box>

      {activeTab === 'DETAILS' && (
        <Box gap="large">
          <Grid columns={{ count: 'fit', size: ['100%', '48%'] }} gap="large">
            <InfoCard title="Hiring Information">
              <DetailRow label="HRQ ID" value={`HRQ${job.id}`} />
              <DetailRow label="Role" value={job.title} />
              <DetailRow label="Hiring Manager" value={hiringManagerName} />
              <DetailRow label="Business" value={job.department} />
              <DetailRow label="Created Date" value={job.createdAt?.split('T')[0]} />
            </InfoCard>

            <InfoCard title="Job Information">
              <DetailRow label="Location" value={job.location} />
              <DetailRow label="Employment Type" value={job.employmentType} />
              <DetailRow label="Work Type" value={job.workType} />
              <DetailRow label="Category" value={job.jobCategory} />
              <DetailRow label="Region" value={job.region} />
              <DetailRow label="Deal" value={job.dealName} />
              <DetailRow label="Start Date" value={job.startDate} />
              <DetailRow label="End Date" value={job.endDate} />
              <DetailRow label="Primary Skills" value={formatSkills(job.primarySkills)} />
              <DetailRow label="Secondary Skills" value={formatSkills(job.secondarySkills)} />
            </InfoCard>
          </Grid>

          <InfoCard title="Position Details">
            <Box gap="medium">
              <Box gap="small">
                <Text weight={600}>Main Position</Text>
                <DetailRow label="Request Type" value={job.requestType} />
                <DetailRow label="No. Positions" value={job.numberOfPositions} />
                <DetailRow label="Level" value={job.level} />

                {job.requestType === 'BACKFILL' && (
                  <>
                    <DetailRow
                      label="Employee ID"
                      value={renderBackfillValue(
                        job.backfillEmployeeId,
                        job.backfillEmployeeName,
                        'employeeId',
                      )}
                    />
                    <DetailRow
                      label="Employee Name"
                      value={renderBackfillValue(
                        job.backfillEmployeeId,
                        job.backfillEmployeeName,
                        'employeeName',
                      )}
                    />
                  </>
                )}
              </Box>

              {job.positions?.map((position, index) => (
                <Box
                  key={position.id}
                  gap="small"
                  pad={{ top: 'medium' }}
                  border={{ side: 'top', color: 'border' }}
                >
                  <Text weight={500}>Additional Position {index + 1}</Text>
                  <DetailRow label="Level" value={position.level} />
                  <DetailRow label="Openings" value={position.openings} />
                  <DetailRow label="Request Type" value={position.requestType} />

                  {position.requestType === 'BACKFILL' && (
                    <>
                      <DetailRow
                        label="Employee ID"
                        value={renderBackfillValue(
                          position.backfillEmployeeId,
                          position.backfillEmployeeName,
                          'employeeId',
                        )}
                      />
                      <DetailRow
                        label="Employee Name"
                        value={renderBackfillValue(
                          position.backfillEmployeeId,
                          position.backfillEmployeeName,
                          'employeeName',
                        )}
                      />
                    </>
                  )}
                </Box>
              ))}
            </Box>
          </InfoCard>

          <InfoCard title="Justification">
            <Paragraph margin="none" size="small">
              {job.justification || '-'}
            </Paragraph>
          </InfoCard>
        </Box>
      )}

      {activeTab === 'INTERVIEWS' && (
        <Box gap="medium">
          {job.interviewRounds?.map((round, index) => (
            <Card
              key={round.id}
              background="white"
              round="large"
              border={{ color: 'border', size: 'xsmall' }}
              pad="medium"
              elevation="xsmall"
            >
              <Box direction="row" gap="medium" align="center" margin={{ bottom: 'medium' }}>
                <Box
                  width="32px"
                  height="32px"
                  round="full"
                  background="light-3"
                  align="center"
                  justify="center"
                >
                  <Text size="small" weight={600}>
                    {index + 1}
                  </Text>
                </Box>

                <Box>
                  <Text weight={600}>{round.roundName}</Text>
                  <Text size="xsmall" color="dark-4">
                    {round.mode}
                  </Text>
                </Box>
              </Box>

              <Text size="small" color="dark-4" margin={{ bottom: 'small' }}>
                Panel Members
              </Text>

              <Box direction="row" wrap gap="small">
                {round.panels.map((panel) => (
                  <Box
                    key={panel.id}
                    background="light-2"
                    round="full"
                    pad={{ horizontal: 'small', vertical: 'xsmall' }}
                  >
                    <Text size="xsmall">
                      {panel.name} ({panel.email})
                    </Text>
                  </Box>
                ))}
              </Box>
            </Card>
          ))}
        </Box>
      )}

      {activeTab === 'CALIBRATION' && (
        <Card
          background="white"
          round="large"
          border={{ color: 'border', size: 'xsmall' }}
          pad="large"
          align="center"
          elevation="xsmall"
        >
          {!isEditingCalibration ? (
            <Box align="center" gap="small">
              <Heading level={4} margin="none">
                No Calibration Information
              </Heading>
              <Paragraph size="small" color="dark-4" textAlign="center" margin="none">
                No calibration sessions have been scheduled yet.
              </Paragraph>
              <Button
                label="Add Calibration Pointers"
                primary
                color="dark-1"
                onClick={() => setIsEditingCalibration(true)}
              />
            </Box>
          ) : (
            <Box width="100%" gap="medium">
              <TextArea
                value={calibrationNotes}
                onChange={(event) => setCalibrationNotes(event.currentTarget.value)}
                resize={false}
                rows={6}
              />

              <Box direction="row" justify="center" gap="small">
                <Button
                  label="Save"
                  primary
                  color="dark-1"
                  onClick={handleSaveCalibration}
                />
                <Button label="Cancel" onClick={() => setIsEditingCalibration(false)} />
              </Box>
            </Box>
          )}
        </Card>
      )}
    </Box>
  );
};

export default JobDetailsView;

const InfoCard = ({ title, children }: { title: string; children: ReactNode }) => (
  <Card
    background="white"
    round="large"
    border={{ color: 'border', size: 'xsmall' }}
    elevation="xsmall"
  >
    <CardHeader pad={{ horizontal: 'medium', vertical: 'small' }}>
      <Text weight={600}>{title}</Text>
    </CardHeader>
    <CardBody pad="medium" gap="xsmall">
      {children}
    </CardBody>
  </Card>
);

const DetailRow = ({ label, value }: { label: string; value: ReactNode }) => (
  <Box
    direction="row"
    justify="between"
    align="start"
    gap="medium"
    pad={{ horizontal: 'medium', vertical: 'small' }}
    background="light-1"
    round="small"
  >
    <Text color="dark-4">{label}</Text>
    {typeof value === 'string' || typeof value === 'number' ? (
      <Text weight={500}>{value || '-'}</Text>
    ) : (
      value || <Text weight={500}>-</Text>
    )}
  </Box>
);
