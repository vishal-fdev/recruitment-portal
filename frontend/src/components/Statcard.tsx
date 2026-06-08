import { Box, Card, CardBody, Text } from 'grommet';

type Props = {
  title: string;
  value: number;
  subtitle?: string;
  highlight?: boolean;
};

export default function StatCard({
  title,
  value,
  subtitle,
  highlight,
}: Props) {
  return (
    <Card
      background="white"
      round="16px"
      pad="24px"
      border={{ color: 'border' }}
      elevation="small"
    >
      <CardBody gap="small">
        <Text size="small" color="#6B7280">
          {title}
        </Text>
        <Text size="36px" weight={600} color="#111827">
          {value}
        </Text>
      {subtitle && (
        <Box margin={{ top: '8px' }}>
          <Text
            size="xsmall"
            color={highlight ? '#16A34A' : '#9CA3AF'}
          >
          {subtitle}
          </Text>
        </Box>
      )}
      </CardBody>
    </Card>
  );
}
