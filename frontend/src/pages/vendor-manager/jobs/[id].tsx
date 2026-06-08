import { useParams } from 'react-router-dom';
import { useState } from 'react';
import {
  Box,
  Button,
  CheckBox,
  Heading,
  Text,
} from 'grommet';

const vendors = [
  { id: 'V-01', name: 'TeamLease' },
  { id: 'V-02', name: 'ABC Staffing' },
  { id: 'V-03', name: 'XYZ Partners' },
];

const JobDetails = () => {
  const { id } = useParams();
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (vendorId: string) => {
    setSelected((prev) =>
      prev.includes(vendorId)
        ? prev.filter((v) => v !== vendorId)
        : [...prev, vendorId],
    );
  };

  const openJob = () => {
    console.log(
      'Opening job',
      id,
      'to vendors',
      selected,
    );
  };

  return (
    <Box width="xlarge" gap="24px">
      <Heading level={2} size="small" margin="none">
        Manage Job - {id}
      </Heading>

      <Box background="white" round="12px" border={{ color: 'border-weak' }} pad="24px" gap="16px">
        <Text size="small" weight={500}>
          Open job to vendors
        </Text>

        <Box gap="12px">
          {vendors.map((v) => (
            <CheckBox
              key={v.id}
              label={v.name}
              checked={selected.includes(v.id)}
              onChange={() => toggle(v.id)}
            />
          ))}
        </Box>

        <Box direction="row">
          <Button
            primary
            color="#01A982"
            label="Open Job to Selected Vendors"
            onClick={openJob}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default JobDetails;
