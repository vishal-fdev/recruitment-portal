import { Box, FormField, Select, Text, TextInput } from 'grommet';

type Props = {
  search: string;
  status: string;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
};

export function CandidateFilters({
  search,
  status,
  onSearchChange,
  onStatusChange,
}: Props) {
  return (
    <Box
      background="white"
      border={{ color: 'border' }}
      round="12px"
      pad="16px"
      margin={{ bottom: '16px' }}
    >
      <Box direction="row" wrap gap="16px">
        <Box width={{ min: '220px', max: '320px' }}>
          <FormField label={<Text size="small" color="#374151">Search</Text>}>
            <TextInput
              placeholder="Search by name or email"
              value={search}
              onChange={(event) => onSearchChange(event.currentTarget.value)}
              style={{ borderRadius: 8, fontSize: 14 }}
            />
          </FormField>
        </Box>

        <Box width={{ min: '220px', max: '320px' }}>
          <FormField label={<Text size="small" color="#374151">Status</Text>}>
            <Select
              options={[
                { label: 'All', value: '' },
                { label: 'New', value: 'NEW' },
                { label: 'Screening', value: 'SCREENING' },
                { label: 'Interviewing', value: 'INTERVIEWING' },
                { label: 'Selected', value: 'SELECTED' },
                { label: 'Rejected', value: 'REJECTED' },
              ]}
              valueKey={{ key: 'value', reduce: true }}
              labelKey="label"
              value={status}
              onChange={({ value }) => onStatusChange(value)}
            />
          </FormField>
        </Box>

        <Box justify="end" pad={{ bottom: '8px' }}>
          <Text size="small" color="#9CA3AF">
            Reserved for future filters
          </Text>
        </Box>
      </Box>
    </Box>
  );
}
