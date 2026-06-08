import { Box, Button, Image, Text } from 'grommet';
import { LogOut } from 'lucide-react';
import hpeLogo from '../assets/hpe-logo.png';

interface TopbarProps {
  role: string;
  onLogout: () => void;
}

const Topbar = ({ role: _role, onLogout }: TopbarProps) => {
  const getUserName = () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return 'User';

      const payload = JSON.parse(atob(token.split('.')[1]));
      if (!payload?.email) return 'User';

      const email = payload.email.split('@')[0];
      const firstName = email.split('.')[0];
      return firstName.charAt(0).toUpperCase() + firstName.slice(1);
    } catch {
      return 'User';
    }
  };

  const userName = getUserName();

  return (
    <Box
      as="header"
      direction="row"
      align="center"
      justify="between"
      pad={{ horizontal: '32px' }}
      height="80px"
      background="white"
      border={{ side: 'bottom', color: 'rgba(17,24,39,0.08)' }}
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.06)',
      }}
    >
      <Box direction="row" align="center">
        <Image src={hpeLogo} alt="HPE" fit="contain" style={{ height: 56, width: 'auto' }} />
      </Box>

      <Box direction="row" align="center" gap="24px">
        <Box
          round="999px"
          background="rgba(1,169,130,0.14)"
          pad={{ horizontal: '16px', vertical: '6px' }}
        >
          <Text size="12px" weight={500} color="#047857">
            {userName}
          </Text>
        </Box>

        <Button
          plain
          onClick={onLogout}
          label={
            <Box direction="row" align="center" gap="8px">
              <LogOut size={18} color="#4B5563" />
              <Text size="14px" color="#4B5563">
                Logout
              </Text>
            </Box>
          }
        />
      </Box>
    </Box>
  );
};

export default Topbar;
