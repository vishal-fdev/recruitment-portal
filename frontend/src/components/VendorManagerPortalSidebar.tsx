import { useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { Box, Button, Nav, Text } from 'grommet';
import { BriefcaseBusiness, BriefcaseIcon, LayoutDashboard, Layers, Users } from 'lucide-react';
import { authService } from '../auth/authService';
import type { LucideIcon } from 'lucide-react';
type NavItem = {
  label: string;
  path: string;
  icon: LucideIcon;
  end?: boolean;
};

const navItemsByRole: Record<
  'VENDOR_MANAGER' | 'VENDOR_MANAGER_HEAD',
  NavItem[]
> = {
  VENDOR_MANAGER: [
    {
      label: 'Dashboard',
      path: '/vendor-manager',
      icon: LayoutDashboard,
      end: true,
    },
    {
      label: 'Candidate Management',
      path: '/vendor-manager/candidates',
      icon: Users,
    },
    {
      label: 'Interview Management',
      path: '/vendor-manager/partner-slots',
      icon: Layers,
    },
    {
      label: 'Jobs',
      path: '/vendor-manager/jobs',
      icon: BriefcaseIcon,
    },
    {
      label: 'Vendors',
      path: '/vendor-manager/vendors',
      icon: BriefcaseBusiness,
    },
  ],

  VENDOR_MANAGER_HEAD: [
    {
      label: 'Dashboard',
      path: '/vendor-manager-head',
      icon: LayoutDashboard,
      end: true,
    },
    {
      label: 'Job approvals',
      path: '/vendor-manager-head/jobs',
      icon: BriefcaseIcon,
    },
    {
      label: 'Interview Management',
      path: '/vendor-manager-head/partner-slots',
      icon: Layers,
    },
    {
      label: 'Vendors',
      path: '/vendor-manager-head/vendors',
      icon: BriefcaseBusiness,
    },
  ],
};

const getUserDetails = () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      return { initials: 'VM', name: 'Vendor Manager', email: '' };
    }

    const payload = JSON.parse(atob(token.split('.')[1]));
    const email = payload?.email || '';
    const userPart = email.split('@')[0] || 'vendor.manager';
    const parts = userPart.split(/[._-]/).filter(Boolean);
    const name = parts.map((part: string) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ') || 'Vendor Manager';
    const initials =
      parts
        .slice(0, 2)
        .map((part: string) => part[0]?.toUpperCase())
        .join('') || 'VM';

    return { initials, name, email };
  } catch {
    return { initials: 'VM', name: 'Vendor Manager', email: '' };
  }
};

const VendorManagerPortalSidebar = ({
  expanded,
  onHover,
  role,
}: {
  expanded: boolean;
  onHover: (open: boolean) => void;
  role: 'VENDOR_MANAGER' | 'VENDOR_MANAGER_HEAD';
}) => {
  const user = useMemo(() => getUserDetails(), []);
  const navItems = navItemsByRole[role];

  return (
    <Box
      as="aside"
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      width={expanded ? '280px' : '88px'}
      height="100vh"
      background="#151B2D"
      border={{ side: 'right', color: 'rgba(255,255,255,0.1)' }}
      style={{ position: 'sticky', top: 0, zIndex: 40, transition: 'width 0.3s ease', overflow: 'hidden' }}
    >
      <Box direction="row" align="center" gap="12px" pad={{ horizontal: '16px', vertical: '20px' }} border={{ side: 'bottom', color: 'rgba(255,255,255,0.1)' }}>
        <Box align="center" justify="center" width="40px" height="40px" round="12px" background="#01A982" style={{ boxShadow: '0 10px 20px rgba(1,169,130,0.2)' }}>
          <BriefcaseBusiness size={18} />
        </Box>
        <Box style={{ maxWidth: expanded ? 180 : 0, opacity: expanded ? 1 : 0, overflow: 'hidden', transition: 'all 0.3s ease' }}>
          <Text size="15px" weight={600} color="white">
            Dribble
          </Text>
          <Text size="12px" color="rgba(255,255,255,0.45)" margin={{ top: '2px' }}>
            HPE Vendor Portal
          </Text>
        </Box>
      </Box>

      <Box pad={{ horizontal: '16px', top: '28px' }} style={{ opacity: expanded ? 1 : 0, transition: 'opacity 0.3s ease' }}>
        <Text size="12px" weight={500} color="rgba(255,255,255,0.28)" style={{ textTransform: 'uppercase', letterSpacing: '0.18em' }}>
          Menu
        </Text>
      </Box>

      <Nav margin={{ top: '12px' }} gap="8px" pad={{ horizontal: '12px' }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink key={item.path} to={item.path} end={item.end}>
              {({ isActive }) => (
                <Box
                  direction="row"
                  align="center"
                  justify={expanded ? 'start' : 'center'}
                  gap={expanded ? '12px' : '0'}
                  pad={{ horizontal: '16px', vertical: '12px' }}
                  round="12px"
                  background={isActive ? 'rgba(1,169,130,0.16)' : undefined}
                >
                  <Box color={isActive ? '#01A982' : 'rgba(255,255,255,0.6)'}>
                    <Icon size={18} />
                  </Box>
                  <Text
                    size="13px"
                    color={isActive ? '#01A982' : 'rgba(255,255,255,0.6)'}
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

      <Box margin={{ top: 'auto' }} border={{ side: 'top', color: 'rgba(255,255,255,0.1)' }} pad="12px">
        <Button
          type="button"
          onClick={() => {
            authService.logout();
            window.location.href = '/login';
          }}
          plain
          label={
            <Box direction="row" align="center" justify={expanded ? 'start' : 'center'} gap={expanded ? '12px' : '0'} pad={{ horizontal: '12px', vertical: '12px' }}>
              <Box align="center" justify="center" width="44px" height="44px" round="999px" background="#01A982">
                <Text size="14px" weight={600} color="white">
                  {user.initials}
                </Text>
              </Box>
              <Box style={{ minWidth: 0, maxWidth: expanded ? 180 : 0, opacity: expanded ? 1 : 0, overflow: 'hidden', transition: 'all 0.3s ease' }}>
                <Text size="13px" weight={600} color="white" truncate>
                  {user.name}
                </Text>
                <Text size="11px" color="rgba(255,255,255,0.4)" truncate>
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

export default VendorManagerPortalSidebar;
