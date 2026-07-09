import { NavLink } from 'react-router-dom';
import { Box, Button, Nav, Text } from 'grommet';
import { BriefcaseBusiness, LayoutDashboard, Layers, Users } from 'lucide-react';
import { authService } from '../auth/authService';

type NavItem = {
  label: string;
  path: string;
  icon: typeof LayoutDashboard;
  end?: boolean;
};

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/vendor', icon: LayoutDashboard, end: true },
  { label: 'Candidate Management', path: '/vendor/candidates', icon: Users },
  { label: 'Interview Management', path: '/vendor/partner-slots', icon: Layers },
];

const getUserDetails = () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      return { initials: 'V', name: 'Vendor User', email: '' };
    }

    const payload = JSON.parse(atob(token.split('.')[1]));
    const email = payload?.email || '';
    const userPart = email.split('@')[0] || 'vendor';
    const parts = userPart.split(/[._-]/).filter(Boolean);
    const name = parts.map((part: string) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ') || 'Vendor User';
    const initials = parts.slice(0, 2).map((part: string) => part[0]?.toUpperCase()).join('') || 'V';

    return { initials, name, email };
  } catch {
    return { initials: 'V', name: 'Vendor User', email: '' };
  }
};

const VendorPortalSidebar = ({
  expanded,
  onHover,
}: {
  expanded: boolean;
  onHover: (open: boolean) => void;
}) => {
  const user = getUserDetails();

  return (
    <Box
      as="aside"
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      width={expanded ? '280px' : '88px'}
      height="100vh"
      background="#13192A"
      border={{ side: 'right', color: 'rgba(255,255,255,0.1)' }}
      style={{ position: 'sticky', top: 0, zIndex: 40, transition: 'width 0.3s ease', overflow: 'hidden' }}
    >
      <Box direction="row" align="center" gap="12px" pad={{ horizontal: '16px', vertical: '20px' }} border={{ side: 'bottom', color: 'rgba(255,255,255,0.1)' }}>
        <Box align="center" justify="center" width="32px" height="32px" round="7px" background="#01A982">
          <BriefcaseBusiness size={16} />
        </Box>
        <Box style={{ maxWidth: expanded ? 180 : 0, opacity: expanded ? 1 : 0, overflow: 'hidden', transition: 'all 0.3s ease' }}>
          <Text size="14px" weight={600} color="white">
            Dribble
          </Text>
          <Text size="10px" color="rgba(255,255,255,0.3)" margin={{ top: '2px' }}>
            HPE Recruitment
          </Text>
        </Box>
      </Box>

      <Box pad={{ horizontal: '16px', top: '18px' }} style={{ opacity: expanded ? 1 : 0, transition: 'opacity 0.3s ease' }}>
        <Text size="10px" weight={500} color="rgba(255,255,255,0.2)" style={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Main Menu
        </Text>
      </Box>

      <Nav margin={{ top: '8px' }} gap="4px" pad={{ horizontal: '8px' }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink key={item.path} to={item.path} end={item.end}>
              {({ isActive }) => (
                <Box
                  direction="row"
                  align="center"
                  justify={expanded ? 'start' : 'center'}
                  gap={expanded ? '9px' : '0'}
                  pad={{ horizontal: '12px', vertical: '10px' }}
                  round="8px"
                  background={isActive ? 'rgba(1,169,130,0.12)' : undefined}
                >
                  <Box color={isActive ? '#01A982' : 'rgba(255,255,255,0.5)'}>
                    <Icon size={14} />
                  </Box>
                  <Text
                    size="13px"
                    color={isActive ? '#01A982' : 'rgba(255,255,255,0.5)'}
                    style={{
                      maxWidth: expanded ? 180 : 0,
                      opacity: expanded ? 1 : 0,
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.3s ease',
                    }}
                  >
                    {item.label}
                  </Text>
                </Box>
              )}
            </NavLink>
          );
        })}
      </Nav>

      <Box margin={{ top: 'auto' }} border={{ side: 'top', color: 'rgba(255,255,255,0.1)' }} pad="8px">
        <Button
          type="button"
          onClick={() => {
            authService.logout();
            window.location.href = '/login';
          }}
          plain
          label={
            <Box direction="row" align="center" justify={expanded ? 'start' : 'center'} gap={expanded ? '12px' : '0'} pad={{ horizontal: '12px', vertical: '8px' }}>
              <Box align="center" justify="center" width="30px" height="30px" round="999px" background="#01A982">
                <Text size="11px" weight={600} color="white">
                  {user.initials}
                </Text>
              </Box>
              <Box style={{ minWidth: 0, maxWidth: expanded ? 180 : 0, opacity: expanded ? 1 : 0, overflow: 'hidden', transition: 'all 0.3s ease' }}>
                <Text size="12px" weight={500} color="rgba(255,255,255,0.8)" truncate>
                  {user.name}
                </Text>
                <Text size="10px" color="rgba(255,255,255,0.3)" truncate>
                  {user.email}
                </Text>
              </Box>
            </Box>
          }
        />
      </Box>
    </Box>
  );
};

export default VendorPortalSidebar;
