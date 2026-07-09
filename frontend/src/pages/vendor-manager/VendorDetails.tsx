import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Button, Text } from 'grommet';
import ProfileTab from './ProfileTab';
import ContactMatrixTab from './ContactMatrixTab';
import EscalationMatrixTab from './EscalationMatrixTab';
import EngagementTab from './EngagementTab';
import SowManagementTab from './SOWManagementTab';

const VendorDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState('escalation matrix');

  const tabs = ['profile', 'contact matrix', 'escalation matrix', 'engagement', 'sow/po management'];
  const renderTabContent = () => {
    if (tab === 'contact matrix') return <ContactMatrixTab />;
    if (tab === 'escalation matrix') return <EscalationMatrixTab />;
    if (tab === 'engagement') return <EngagementTab />;
    if (tab === 'sow/po management') return <SowManagementTab />;
    return <ProfileTab />;
  };

  return (
    <Box gap="24px">
      <Box direction="row" justify="between" align="center" wrap gap="medium">
        <Box direction="row" align="center" gap="medium">
          <Button label="← Back" primary color="brand" onClick={() => navigate(-1)} style={backButtonStyle} />
          <Text size="25px" weight={600} color="#0B1220">
            Vendor Details
          </Text>
        </Box>
        <Text size="14px" color="#526179">Partner ID: {id}</Text>
      </Box>

      <div style={tabStripStyle}>
        {tabs.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTab(item)}
            style={item === tab ? activeTabStyle : tabButtonStyle}
          >
            {tabLabels[item]}
          </button>
        ))}
      </div>

      {renderTabContent()}
    </Box>
  );
};

const tabLabels: Record<string, string> = {
  profile: 'Profile',
  'contact matrix': 'Contact matrix',
  'escalation matrix': 'Escalation matrix',
  engagement: 'Engagement',
  'sow/po management': 'Sow/po management',
};

const backButtonStyle = {
  color: '#FFFFFF',
  background: '#01A982',
  border: 'none',
  borderRadius: '4px',
  fontWeight: 600,
  padding: '11px 17px',
} as const;

const tabStripStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
  alignItems: 'center',
  gap: 0,
  background: '#E1E5EB',
  borderRadius: 10,
  padding: 7,
  minHeight: 52,
} as const;

const tabButtonStyle = {
  border: 'none',
  background: 'transparent',
  color: '#26364D',
  fontSize: 14,
  fontWeight: 500,
  height: 36,
  borderRadius: 8,
  cursor: 'pointer',
} as const;

const activeTabStyle = {
  ...tabButtonStyle,
  background: '#FFFFFF',
  color: '#0B1220',
  fontWeight: 600,
  boxShadow: '0 1px 4px rgba(15, 23, 42, 0.16)',
} as const;

export default VendorDetails;
