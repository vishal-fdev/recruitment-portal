import { Box, Text } from 'grommet';

interface Props {
  status: string;
}

type BadgeTone = {
  background: string;
  color: string;
};

const colors: Record<string, BadgeTone> = {
  NEW: { background: '#E5E7EB', color: '#374151' },
  SUBMITTED: { background: '#DBEAFE', color: '#1D4ED8' },
  SCREENING: { background: '#FEF3C7', color: '#B45309' },
  SCREEN_SELECTED: { background: '#D1FAE5', color: '#047857' },
  SCREEN_REJECTED: { background: '#FEE2E2', color: '#B91C1C' },
  TECH_SELECTED: { background: '#D1FAE5', color: '#047857' },
  TECH_REJECTED: { background: '#FEE2E2', color: '#B91C1C' },
  IDENTIFIED: { background: '#DCFCE7', color: '#15803D' },
  YET_TO_JOIN: { background: '#FEF3C7', color: '#B45309' },
  OPS_SELECTED: { background: '#DCFCE7', color: '#15803D' },
  OPS_REJECTED: { background: '#FEE2E2', color: '#B91C1C' },
  SELECTED: { background: '#DCFCE7', color: '#15803D' },
  REJECTED: { background: '#FEE2E2', color: '#B91C1C' },
  ONBOARDED: { background: '#D1FAE5', color: '#047857' },
  DROPPED: { background: '#FEE2E2', color: '#B91C1C' },
};

export default function StageBadge({ status }: Props) {
  const tone = colors[status] || { background: '#E5E7EB', color: '#374151' };

  return (
    <Box
      as="span"
      direction="row"
      align="center"
      round="full"
      pad={{ horizontal: '12px', vertical: '4px' }}
      background={tone.background}
      style={{ width: 'fit-content' }}
    >
      <Text
        size="xsmall"
        weight={500}
        color={tone.color}
        style={{ textTransform: 'uppercase', letterSpacing: '0.02em' }}
      >
        {status.replace(/_/g, ' ')}
      </Text>
    </Box>
  );
}
