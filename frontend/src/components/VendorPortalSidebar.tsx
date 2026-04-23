import { NavLink } from 'react-router-dom';
import { BriefcaseBusiness, LayoutDashboard, Layers, Users } from 'lucide-react';
import { authService } from '../auth/authService';

const navItems = [
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
    const name = parts
      .map((part: string) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ') || 'Vendor User';
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
    <aside
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      className={`fixed left-0 top-0 z-50 flex h-screen flex-col border-r border-white/10 bg-[#13192A] text-white transition-all duration-300 ${
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
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center rounded-md px-3 py-2.5 text-[13px] transition ${
                  isActive
                    ? 'bg-[rgba(1,169,130,0.12)] text-[#01A982]'
                    : 'text-white/50 hover:bg-white/5 hover:text-white/80'
                } ${expanded ? 'gap-[9px] justify-start' : 'justify-center'}`
              }
            >
              <Icon size={14} />
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

      <div className="mt-auto border-t border-white/10 p-2">
        <button
          type="button"
          onClick={() => {
            authService.logout();
            window.location.href = '/login';
          }}
          className={`flex w-full items-center rounded-md px-3 py-2 text-left hover:bg-white/5 ${
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
        </button>
      </div>
    </aside>
  );
};

export default VendorPortalSidebar;
