import { NavLink } from 'react-router-dom';
import { Box, Nav, Text } from 'grommet';
import { BadgeCheck, Briefcase, BriefcaseBusiness, FileSpreadsheet, LayoutDashboard, Layers, UserPlus, Users } from 'lucide-react';
import type { JSX } from 'react/jsx-runtime';

type Role = 'VENDOR' | 'VENDOR_MANAGER' | 'VENDOR_MANAGER_HEAD' | 'HIRING_MANAGER' | 'BADGED_HIRING_MANAGER' | 'BADGED_RECRUITER' | 'PANEL';

interface SidebarProps {
  role: Role;
  expanded: boolean;
  onHover: (open: boolean) => void;
}

const navConfig: Record<Role, { label: string; path: string; icon: JSX.Element }[]> = {
  VENDOR: [
    { label: 'Dashboard', path: '/vendor', icon: <LayoutDashboard size={18} /> },
    { label: 'Candidate Management', path: '/vendor/candidates', icon: <Users size={18} /> },
    { label: 'Job Requisitions', path: '/vendor/jobs', icon: <Briefcase size={18} /> },
    { label: 'Interview Management', path: '/vendor/partner-slots', icon: <Layers size={18} /> },
  ],
  VENDOR_MANAGER: [
    { label: 'Dashboard', path: '/vendor-manager', icon: <LayoutDashboard size={18} /> },
    { label: 'Candidate Management', path: '/vendor-manager/candidates', icon: <Users size={18} /> },
    { label: 'Interview Management', path: '/vendor-manager/partner-slots', icon: <Layers size={18} /> },
    { label: 'Jobs', path: '/vendor-manager/jobs', icon: <Briefcase size={18} /> },
    { label: 'Vendors', path: '/vendor-manager/vendors', icon: <Layers size={18} /> },
  ],
  VENDOR_MANAGER_HEAD: [
    { label: 'Dashboard', path: '/vendor-manager-head', icon: <LayoutDashboard size={18} /> },
    { label: 'Jobs', path: '/vendor-manager-head/jobs', icon: <Briefcase size={18} /> },
    { label: 'Interview Management', path: '/vendor-manager-head/partner-slots', icon: <Layers size={18} /> },
    { label: 'Vendors', path: '/vendor-manager-head/vendors', icon: <Layers size={18} /> },
  ],
  HIRING_MANAGER: [
    { label: 'Dashboard', path: '/hiring-manager', icon: <LayoutDashboard size={18} /> },
    { label: 'Candidate Management', path: '/hiring-manager/candidates', icon: <Users size={18} /> },
    { label: 'Partner Slot Management', path: '/hiring-manager/partner-slots', icon: <Layers size={18} /> },
    { label: 'Job Requisitions', path: '/hiring-manager/jobs', icon: <Briefcase size={18} /> },
  ],
  BADGED_HIRING_MANAGER: [
    { label: 'Dashboard', path: '/badged-hiring', icon: <LayoutDashboard size={18} /> },
    { label: 'Job Requisitions', path: '/badged-hiring/jobs', icon: <Briefcase size={18} /> },
    { label: 'Recruiters', path: '/badged-hiring/recruiters', icon: <UserPlus size={18} /> },
    { label: 'Candidate Submissions', path: '/badged-hiring/submissions', icon: <Users size={18} /> },
    { label: 'HPE Badged Hiring', path: '/badged-hiring/hpe-badged-hiring', icon: <FileSpreadsheet size={18} /> },
  ],
  BADGED_RECRUITER: [
    { label: 'Dashboard', path: '/badged-recruiter', icon: <LayoutDashboard size={18} /> },
    { label: 'Job Requisitions', path: '/badged-recruiter/jobs', icon: <Briefcase size={18} /> },
    { label: 'Submit Candidate', path: '/badged-recruiter/candidates/create', icon: <BadgeCheck size={18} /> },
    { label: 'My Submissions', path: '/badged-recruiter/submissions', icon: <Users size={18} /> },
  ],
  PANEL: [
    { label: 'Dashboard', path: '/panel', icon: <LayoutDashboard size={18} /> },
    { label: 'Assigned Jobs', path: '/panel/jobs', icon: <Briefcase size={18} /> },
    { label: 'Candidates', path: '/panel/candidates', icon: <Users size={18} /> },
  ],
};

const getUserDetails = () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      return { initials: 'U', name: 'Portal User', email: '' };
    }

    const payload = JSON.parse(atob(token.split('.')[1]));
    const email = payload?.email || '';
    const rawName = payload?.name || '';
    const userPart = email.split('@')[0] || 'user';
    const parts = rawName ? rawName.split(/\s+/).filter(Boolean) : userPart.split(/[._-]/).filter(Boolean);
    const name =
      rawName ||
      parts.map((part: string) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ') ||
      'Portal User';
    const initials =
      parts
        .slice(0, 2)
        .map((part: string) => part[0]?.toUpperCase())
        .join('') || 'U';

    return { initials, name, email };
  } catch {
    return { initials: 'U', name: 'Portal User', email: '' };
  }
};

const Sidebar = ({ role, expanded, onHover }: SidebarProps) => {
  const user = getUserDetails();

  return (
    <Box
      as="aside"
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      width={expanded ? '220px' : '88px'}
      height="100vh"
      flex={false}
      background="#13192A"
      border={{ side: 'right', color: 'rgba(255,255,255,0.1)' }}
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
            HPE Recruitment
          </Text>
        </Box>
      </Box>

      <Box pad={{ horizontal: '18px', top: '18px', bottom: '5px' }} style={{ opacity: expanded ? 1 : 0, transition: 'opacity 0.2s ease' }}>
        <Text size="10px" weight={500} color="rgba(255,255,255,0.2)" style={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Main Menu
        </Text>
      </Box>

      <Nav margin={{ top: '4px' }} gap="2px" pad={{ horizontal: '8px' }}>
        {navConfig[role].map((item, index) => (
          <NavLink key={item.path} to={item.path} end={index === 0}>
            {({ isActive }) => (
              <Box
                direction="row"
                align="center"
                justify={expanded ? 'start' : 'center'}
                gap={expanded ? '9px' : '0'}
                pad={{ horizontal: '12px', vertical: '8px' }}
                round="6px"
                background={isActive ? 'rgba(1,169,130,0.12)' : undefined}
              >
                <Box color={isActive ? '#01A982' : 'rgba(255,255,255,0.5)'}>{item.icon}</Box>
                <Text
                  size="13px"
                  color={isActive ? '#01A982' : 'rgba(255,255,255,0.5)'}
                  style={{
                    maxWidth: expanded ? 180 : 0,
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
        ))}
      </Nav>

      <Box margin={{ top: 'auto' }} border={{ side: 'top', color: 'rgba(255,255,255,0.1)' }} pad="8px">
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
      </Box>
    </Box>
  );
};

export default Sidebar;

