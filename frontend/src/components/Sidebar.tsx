// src/components/Sidebar.tsx
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Layers,
} from 'lucide-react';
import type { JSX } from 'react/jsx-runtime';

type Role = 'VENDOR' | 'VENDOR_MANAGER' | 'HIRING_MANAGER';

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
    {
      label: 'Dashboard',
      path: '/vendor',
      icon: <LayoutDashboard size={20} />,
    },
    {
      label: 'Candidates',
      path: '/vendor/candidates',
      icon: <Users size={20} />,
    },
    {
      // ✅ ADDED
      label: 'Jobs',
      path: '/vendor/jobs',
      icon: <Briefcase size={20} />,
    },
  ],

  VENDOR_MANAGER: [
    {
      label: 'Dashboard',
      path: '/vendor-manager',
      icon: <LayoutDashboard size={20} />,
    },
    {
      label: 'Candidates',
      path: '/vendor-manager/candidates',
      icon: <Users size={20} />,
    },
    {
      label: 'Jobs',
      path: '/vendor-manager/jobs',
      icon: <Briefcase size={20} />,
    },
    {
      label: 'Vendors',
      path: '/vendor-manager/vendors',
      icon: <Layers size={20} />,
    },
  ],

  HIRING_MANAGER: [
    {
      label: 'Dashboard',
      path: '/hiring-manager',
      icon: <LayoutDashboard size={20} />,
    },
    {
      label: 'Candidates',
      path: '/hiring-manager/candidates',
      icon: <Users size={20} />,
    },
    {
      label: 'Partner Slots',
      path: '/hiring-manager/partner-slots',
      icon: <Layers size={20} />,
    },
  ],
};

const Sidebar = ({ role, expanded, onHover }: SidebarProps) => {
  return (
    <aside
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      className={`fixed top-0 left-0 h-screen bg-slate-900 text-white
        transition-all duration-300 z-50
        ${expanded ? 'w-64' : 'w-16'}`}
    >
      {/* Brand */}
      <div className="h-16 flex items-center px-4 text-lg font-semibold border-b border-slate-700">
        {expanded ? 'Epicenter' : 'E'}
      </div>

      {/* Menu */}
      <nav className="mt-4 space-y-1">
        {navConfig[role].map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-4 px-4 py-3 hover:bg-slate-800 transition
               ${isActive ? 'bg-slate-800' : ''}`
            }
          >
            {item.icon}
            {expanded && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
