import { NavLink } from 'react-router-dom';
import {
  Briefcase,
  BriefcaseBusiness,
  LayoutDashboard,
  Layers,
  Users,
} from 'lucide-react';
import type { JSX } from 'react/jsx-runtime';

type Role =
  | 'VENDOR'
  | 'VENDOR_MANAGER'
  | 'VENDOR_MANAGER_HEAD'
  | 'HIRING_MANAGER'
  | 'PANEL';

interface SidebarProps {
  role: Role;
  expanded: boolean;
  onHover: (open: boolean) => void;
}

const navConfig: Record<
  Role,
  { label: string; path: string; icon: JSX.Element }[]
> = {
  VENDOR: [
    { label: 'Dashboard', path: '/vendor', icon: <LayoutDashboard size={18} /> },
    { label: 'Candidate Management', path: '/vendor/candidates', icon: <Users size={18} /> },
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
    const parts = rawName
      ? rawName.split(/\s+/).filter(Boolean)
      : userPart.split(/[._-]/).filter(Boolean);
    const name =
      rawName ||
      parts
        .map((part: string) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ') ||
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
    <aside
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      className={`sticky top-0 z-40 flex h-screen shrink-0 flex-col border-r border-white/10 bg-[#13192A] text-white transition-all duration-300 ${
        expanded ? 'w-[280px]' : 'w-[88px]'
      }`}
    >
      <div className="flex items-center gap-3 border-b border-white/10 px-4 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-[7px] bg-[#01A982] text-white">
          <BriefcaseBusiness size={16} />
        </div>
        <div
          className={`overflow-hidden transition-all duration-300 ${
            expanded ? 'max-w-[180px] opacity-100' : 'max-w-0 opacity-0'
          }`}
        >
          <p className="text-sm font-semibold tracking-[-0.2px] text-white">Epicenter</p>
          <p className="mt-0.5 text-[10px] text-white/30">HPE Recruitment</p>
        </div>
      </div>

      <div
        className={`px-4 pt-[18px] text-[10px] font-medium uppercase tracking-[0.1em] text-white/20 transition-opacity duration-300 ${
          expanded ? 'opacity-100' : 'opacity-0'
        }`}
      >
        Main Menu
      </div>

      <nav className="mt-2 space-y-1 px-2">
        {navConfig[role].map((item, index) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={index === 0}
            className={({ isActive }) =>
              `flex items-center rounded-md px-3 py-2.5 text-[13px] transition ${
                isActive
                  ? 'bg-[rgba(1,169,130,0.12)] text-[#01A982]'
                  : 'text-white/50 hover:bg-white/5 hover:text-white/80'
              } ${expanded ? 'gap-[9px] justify-start' : 'justify-center'}`
            }
          >
            {item.icon}
            <span
              className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${
                expanded ? 'max-w-[180px] opacity-100' : 'max-w-0 opacity-0'
              }`}
            >
              {item.label}
            </span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto border-t border-white/10 p-2">
        <div
          className={`flex items-center rounded-md px-3 py-2 ${
            expanded ? 'gap-3' : 'justify-center'
          }`}
        >
          <div className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-[#01A982] text-[11px] font-semibold text-white">
            {user.initials}
          </div>
          <div
            className={`min-w-0 overflow-hidden transition-all duration-300 ${
              expanded ? 'max-w-[180px] opacity-100' : 'max-w-0 opacity-0'
            }`}
          >
            <p className="truncate text-xs font-medium text-white/80">{user.name}</p>
            <p className="truncate text-[10px] text-white/30">{user.email}</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
