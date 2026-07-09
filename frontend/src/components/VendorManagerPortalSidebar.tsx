import { useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { Box, Button, Nav, Text } from 'grommet';
import { BriefcaseBusiness, BriefcaseIcon, ClipboardList, FileSpreadsheet, LayoutDashboard, Layers, UserPlus, Users } from 'lucide-react';
import { authService } from '../auth/authService';

type NavItem = {
  label: string;
  path: string;
  icon: typeof LayoutDashboard;
  end?: boolean;
  child?: boolean;
};

const navItemsByRole: Record<'VENDOR_MANAGER' | 'VENDOR_MANAGER_HEAD' | 'BADGED_RECRUITER', NavItem[]> = {
  VENDOR_MANAGER: [
    { label: 'Dashboard', path: '/vendor-manager', icon: LayoutDashboard, end: true },
    { label: 'Candidate Management', path: '/vendor-manager/candidates', icon: Users },
    { label: 'Interview Management', path: '/vendor-manager/partner-slots', icon: Layers },
    { label: 'Jobs', path: '/vendor-manager/jobs', icon: BriefcaseIcon },
    { label: 'Vendors', path: '/vendor-manager/vendors', icon: BriefcaseBusiness },
    { label: 'HPE Badged Hiring', path: '/vendor-manager/badged-hiring', icon: FileSpreadsheet, end: true },
    { label: 'Badged Jobs', path: '/vendor-manager/badged-hiring/jobs', icon: BriefcaseIcon, child: true },
    { label: 'Create Job', path: '/vendor-manager/badged-hiring/jobs/create', icon: BriefcaseBusiness, child: true },
    { label: 'Recruiters', path: '/vendor-manager/badged-hiring/recruiters', icon: UserPlus, child: true },
    { label: 'Submissions', path: '/vendor-manager/badged-hiring/submissions', icon: ClipboardList, child: true },
    { label: 'Excel Upload', path: '/vendor-manager/badged-hiring/hpe-badged-hiring', icon: FileSpreadsheet, child: true },
  ],
  VENDOR_MANAGER_HEAD: [
    { label: 'Dashboard', path: '/vendor-manager-head', icon: LayoutDashboard, end: true },
    { label: 'Job approvals', path: '/vendor-manager-head/jobs', icon: BriefcaseIcon },
    { label: 'Interview Management', path: '/vendor-manager-head/partner-slots', icon: Layers },
    { label: 'Vendors', path: '/vendor-manager-head/vendors', icon: BriefcaseBusiness },
  ],
  BADGED_RECRUITER: [
    { label: 'Dashboard', path: '/vendor-manager/badged-hiring', icon: LayoutDashboard, end: true },
    { label: 'Badged Jobs', path: '/vendor-manager/badged-hiring/jobs', icon: BriefcaseIcon },
    { label: 'Submissions', path: '/vendor-manager/badged-hiring/submissions', icon: ClipboardList },
    { label: 'Submit Candidate', path: '/vendor-manager/badged-hiring/submissions/create', icon: Users },
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
  role: 'VENDOR_MANAGER' | 'VENDOR_MANAGER_HEAD' | 'BADGED_HIRING_MANAGER' | 'BADGED_RECRUITER';
}) => {
  const user = useMemo(() => getUserDetails(), []);
  const navItems = role === 'BADGED_HIRING_MANAGER' ? navItemsByRole.VENDOR_MANAGER : navItemsByRole[role];

  return (
    <Box
      as="aside"
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      width={expanded ? '220px' : '88px'}
      height="100vh"
      background="#13192A"
      border={{ side: 'right', color: 'rgba(255,255,255,0.08)' }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        zIndex: 60,
        transition: 'width 0.2s ease',
        overflow: 'hidden',
      }}
    >
      <Box direction="row" align="center" gap="10px" pad={{ horizontal: '16px', vertical: '16px' }} border={{ side: 'bottom', color: 'rgba(255,255,255,0.08)' }}>
        <Box align="center" justify="center" width="32px" height="32px" round="7px" background="#01A982">
          <BriefcaseBusiness size={16} />
        </Box>
        <Box style={{ maxWidth: expanded ? 150 : 0, opacity: expanded ? 1 : 0, overflow: 'hidden', transition: 'all 0.2s ease' }}>
          <Text size="14px" weight={600} color="white">
            Dribble
          </Text>
          <Text size="10px" color="rgba(255,255,255,0.3)" margin={{ top: '2px' }}>
            HPE Vendor Portal
          </Text>
        </Box>
      </Box>

      <Box pad={{ horizontal: '18px', top: '18px', bottom: '5px' }} style={{ opacity: expanded ? 1 : 0, transition: 'opacity 0.2s ease' }}>
        <Text size="10px" weight={500} color="rgba(255,255,255,0.22)" style={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Menu
        </Text>
      </Box>

      <Nav margin={{ top: '4px' }} gap="2px" pad={{ horizontal: '8px' }}>
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
                  pad={{ horizontal: expanded && item.child ? '20px' : '12px', vertical: item.child ? '7px' : '8px' }}
                  round="6px"
                  background={isActive ? 'rgba(1,169,130,0.12)' : undefined}
                >
                  <Box color={isActive ? '#01A982' : 'rgba(255,255,255,0.6)'}>
                    <Icon size={item.child ? 15 : 18} />
                  </Box>
                  <Text
                    size={item.child ? "12px" : "13px"}
                    color={isActive ? '#01A982' : 'rgba(255,255,255,0.6)'}
                    style={{
                      maxWidth: expanded ? 150 : 0,
                      opacity: expanded ? 1 : 0,
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.2s ease',
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

      <Box margin={{ top: 'auto' }} border={{ side: 'top', color: 'rgba(255,255,255,0.08)' }} pad="8px">
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
              <Box style={{ minWidth: 0, maxWidth: expanded ? 150 : 0, opacity: expanded ? 1 : 0, overflow: 'hidden', transition: 'all 0.2s ease' }}>
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

export default VendorManagerPortalSidebar;


