import { Box, Table, TableBody, TableCell, TableHeader, TableRow, Text } from 'grommet';

type Props = {
  data: any[];
  loading?: boolean;
};

export default function CandidateTable({
  data,
  loading = false,
}: Props) {
  if (loading) {
    return (
      <Box pad="16px">
        <Text>Loading candidates...</Text>
      </Box>
    );
  }

  if (!data.length) {
    return (
      <Box pad="16px">
        <Text color="#6B7280">No candidates found</Text>
      </Box>
    );
  }

  return (
    <Box background="white" round="12px" border={{ color: 'border' }} overflow="hidden">
      <Table>
        <TableHeader background="#DCFCE7">
          <TableRow>
            <TableCell pad={{ horizontal: '16px', vertical: '12px' }}><Text weight={600}>ID</Text></TableCell>
            <TableCell pad={{ horizontal: '16px', vertical: '12px' }}><Text weight={600}>Name</Text></TableCell>
            <TableCell pad={{ horizontal: '16px', vertical: '12px' }}><Text weight={600}>Email</Text></TableCell>
            <TableCell pad={{ horizontal: '16px', vertical: '12px' }}><Text weight={600}>Experience</Text></TableCell>
            <TableCell pad={{ horizontal: '16px', vertical: '12px' }}><Text weight={600}>Status</Text></TableCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((c) => (
            <TableRow key={c.id} border={{ side: 'top', color: 'border' }}>
              <TableCell pad={{ horizontal: '16px', vertical: '12px' }}>
                <Text color="#16A34A">CA{c.id}</Text>
              </TableCell>
              <TableCell pad={{ horizontal: '16px', vertical: '12px' }}><Text>{c.name}</Text></TableCell>
              <TableCell pad={{ horizontal: '16px', vertical: '12px' }}><Text>{c.email}</Text></TableCell>
              <TableCell pad={{ horizontal: '16px', vertical: '12px' }}><Text>{c.experience}</Text></TableCell>
              <TableCell pad={{ horizontal: '16px', vertical: '12px' }}><Text>{c.status}</Text></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}
