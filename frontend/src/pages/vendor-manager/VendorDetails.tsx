import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Button, Heading, Tabs, Tab, Text } from 'grommet';
import ProfileTab from './ProfileTab';
import ContactMatrixTab from './ContactMatrixTab';
import EscalationMatrixTab from './EscalationMatrixTab';
import EngagementTab from './EngagementTab';
import SowManagementTab from './SOWManagementTab';

const VendorDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState('profile');

  const tabs = ['profile', 'contact matrix', 'escalation matrix', 'engagement', 'sow/po management'];

  return (
    <Box gap="large">
      <Box direction="row" justify="between" align="center" wrap gap="medium">
        <Box direction="row" align="center" gap="medium">
          <Button label="Back" primary color="brand" onClick={() => navigate(-1)} />
          <Heading level={2} margin="none">
            Vendor Details
          </Heading>
        </Box>
        <Text color="text-paragraph">Partner ID: {id}</Text>
      </Box>

      <Tabs
        activeIndex={tabs.indexOf(tab)}
        onActive={(index) => setTab(tabs[index])}
      >
        <Tab title="Profile">
          <Box pad={{ top: 'medium' }}>
            <ProfileTab />
          </Box>
        </Tab>
        <Tab title="Contact Matrix">
          <Box pad={{ top: 'medium' }}>
            <ContactMatrixTab />
          </Box>
        </Tab>
        <Tab title="Escalation Matrix">
          <Box pad={{ top: 'medium' }}>
            <EscalationMatrixTab />
          </Box>
        </Tab>
        <Tab title="Engagement">
          <Box pad={{ top: 'medium' }}>
            <EngagementTab />
          </Box>
        </Tab>
        <Tab title="SOW/PO Management">
          <Box pad={{ top: 'medium' }}>
            <SowManagementTab />
          </Box>
        </Tab>
      </Tabs>
    </Box>
  );
};

export default VendorDetails;
