import { Box, Card, CardBody, Text } from 'grommet';

const getStatusColors = (status: string) => {
  const normalized = status?.toLowerCase?.() ?? '';
  if (normalized.includes('approved')) {
    return { background: '#ECFDF5', color: '#047857' };
  }
  if (normalized.includes('rejected')) {
    return { background: '#FEF2F2', color: '#B91C1C' };
  }
  return { background: '#FFFBEB', color: '#B45309' };
};

export default function JobCard({ job }: any) {
  const statusStyle = getStatusColors(job.status);

  return (
    <Card background="white" round="16px" border={{ color: 'border' }} elevation="small">
      <CardBody pad="20px" gap="small">
        <Text size="large" weight={600} color="#111827">
          {job.title}
        </Text>
        <Text size="small" color="#6B7280">
          {job.location}
        </Text>
        <Box alignSelf="start" round="999px" background={statusStyle.background} pad={{ horizontal: '12px', vertical: '6px' }}>
          <Text size="xsmall" weight={600} color={statusStyle.color}>
            {job.status}
          </Text>
        </Box>
      </CardBody>
    </Card>
  );
}
