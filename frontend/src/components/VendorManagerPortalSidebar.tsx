import { useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { BriefcaseBusiness, BriefcaseIcon, LayoutDashboard, Layers, Users } from 'lucide-react';
import { authService } from '../auth/authService';

const navItemsByRole = {
  VENDOR_MANAGER: [
    { label: 'Dashboard', path: '/vendor-manager', icon: LayoutDashboard, end: true },
    { label: 'Candidate Management', path: '/vendor-manager/candidates', icon: Users },
    { label: 'Interview Management', path: '/vendor-manager/partner-slots', icon: Layers },
    { label: 'Jobs', path: '/vendor-manager/jobs', icon: BriefcaseIcon },
    { label: 'Vendors', path: '/vendor-manager/vendors', icon: BriefcaseBusiness },
  ],
  VENDOR_MANAGER_HEAD: [
    { label: 'Dashboard', path: '/vendor-manager-head', icon: LayoutDashboard, end: true },
    { label: 'Job approvals', path: '/vendor-manager-head/jobs', icon: BriefcaseIcon },
    { label: 'Interview Management', path: '/vendor-manager-head/partner-slots', icon: Layers },
    { label: 'Vendors', path: '/vendor-manager-head/vendors', icon: BriefcaseBusiness },
  ],
} as const;

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
    const name =
      parts.map((part: string) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ') ||
      'Vendor Manager';
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
    <aside
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      className={`fixed left-0 top-0 z-50 flex h-screen flex-col border-r border-white/10 bg-[#151B2D] text-white transition-all duration-300 ${
        expanded ? 'w-[280px]' : 'w-[88px]'
      }`}
    >
      <div className="flex items-center gap-3 border-b border-white/10 px-4 py-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#01A982] text-white shadow-[0_10px_20px_rgba(1,169,130,0.2)]">
          <BriefcaseBusiness size={18} />
        </div>
        <div
          className={`overflow-hidden transition-all duration-300 ${
            expanded ? 'max-w-[180px] opacity-100' : 'max-w-0 opacity-0'
          }`}
        >
          <p className="whitespace-nowrap text-[15px] font-semibold tracking-[-0.02em] text-white">
            Dribble
          </p>
          <p className="mt-0.5 whitespace-nowrap text-xs text-white/45">HPE Vendor Portal</p>
        </div>
      </div>

      <div
        className={`px-4 pt-7 text-[12px] font-medium uppercase tracking-[0.18em] text-white/28 transition-opacity duration-300 ${
          expanded ? 'opacity-100' : 'opacity-0'
        }`}
      >
        Menu
      </div>

      <nav className="mt-3 space-y-2 px-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center rounded-[12px] px-4 py-3 text-[13px] transition ${
                  isActive
                    ? 'bg-[rgba(1,169,130,0.16)] text-[#01A982]'
                    : 'text-white/60 hover:bg-white/5 hover:text-white'
                } ${expanded ? 'gap-3 justify-start' : 'justify-center'}`
              }
            >
              <Icon size={18} className="shrink-0" />
              <span
                className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${
                  expanded ? 'max-w-[180px] opacity-100' : 'max-w-0 opacity-0'
                }`}
              >
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-white/10 p-3">
        <button
          type="button"
          onClick={() => {
            authService.logout();
            window.location.href = '/login';
          }}
          className={`flex w-full items-center rounded-[14px] px-3 py-3 text-left transition hover:bg-white/5 ${
            expanded ? 'gap-3' : 'justify-center'
          }`}
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#01A982] text-sm font-semibold text-white">
            {user.initials}
          </div>
          <div
            className={`min-w-0 overflow-hidden transition-all duration-300 ${
              expanded ? 'max-w-[180px] opacity-100' : 'max-w-0 opacity-0'
            }`}
          >
            <p className="truncate text-[13px] font-semibold text-white">{user.name}</p>
            <p className="truncate text-[11px] text-white/40">{user.email}</p>
          </div>
        </button>
      </div>
    </aside>
  );
};

export default VendorManagerPortalSidebar;
