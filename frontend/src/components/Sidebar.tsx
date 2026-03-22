import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Layers,
} from "lucide-react";
import type { JSX } from "react/jsx-runtime";

import sidebarLogo from "../assets/sidebar-logo.png";

type Role =
  | "VENDOR"
  | "VENDOR_MANAGER"
  | "VENDOR_MANAGER_HEAD"
  | "HIRING_MANAGER";

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
    { label: "Dashboard", path: "/vendor", icon: <LayoutDashboard size={18} /> },
    { label: "Candidate Management", path: "/vendor/candidates", icon: <Users size={18} /> },
    { label: "Jobs", path: "/vendor/jobs", icon: <Briefcase size={18} /> },
  ],

  VENDOR_MANAGER: [
    { label: "Dashboard", path: "/vendor-manager", icon: <LayoutDashboard size={18} /> },
    { label: "Candidate Management", path: "/vendor-manager/candidates", icon: <Users size={18} /> },
    { label: "Jobs", path: "/vendor-manager/jobs", icon: <Briefcase size={18} /> },
    { label: "Vendors", path: "/vendor-manager/vendors", icon: <Layers size={18} /> },
  ],

  VENDOR_MANAGER_HEAD: [
    { label: "Dashboard", path: "/vendor-manager-head", icon: <LayoutDashboard size={18} /> },
    { label: "Jobs", path: "/vendor-manager-head/jobs", icon: <Briefcase size={18} /> },
    { label: "Vendors", path: "/vendor-manager-head/vendors", icon: <Layers size={18} /> },
  ],

  HIRING_MANAGER: [
    { label: "Dashboard", path: "/hiring-manager", icon: <LayoutDashboard size={18} /> },
    { label: "Candidate Management", path: "/hiring-manager/candidates", icon: <Users size={18} /> },
    { label: "Partner Slot Management", path: "/hiring-manager/partner-slots", icon: <Layers size={18} /> },
    { label: "Job Requisitions", path: "/hiring-manager/jobs", icon: <Briefcase size={18} /> },
  ],
};

const Sidebar = ({ role, expanded, onHover }: SidebarProps) => {
  return (
    <aside
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      className={`
        fixed top-0 left-0 h-screen z-50
        bg-gradient-to-b from-[#0f172a] via-[#111827] to-[#0b1220]
        text-white
        transition-all duration-300 ease-in-out
        shadow-2xl
        ${expanded ? "w-64" : "w-20"}
      `}
    >

      {/* HEADER */}
      <div className="h-20 flex items-center px-4 border-b border-white/10">

        <div className="flex items-center gap-3">

          {/* LOGO */}
          <img
            src={sidebarLogo}
            alt="HPE"
            className={`
              transition-all duration-300 ease-in-out
              hover:scale-105
              ${expanded ? "h-12" : "h-12"}
              object-contain
            `}
          />

          {/* TEXT */}
          {expanded && (
            <div className="leading-tight transition-all duration-300">
              <p className="text-lg font-semibold tracking-wide">
                Epicenter
              </p>
              <p className="text-xs text-gray-400 tracking-wider">
                HPE Recruitment
              </p>
            </div>
          )}

        </div>

      </div>

      {/* MENU */}
      <div className="px-4 mt-8">

        {expanded && (
          <p className="text-[11px] text-gray-500 uppercase tracking-[0.2em] mb-4">
            Main Menu
          </p>
        )}

        <nav className="space-y-3">

          {navConfig[role].map((item, index) => {

            const isDashboard = index === 0;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={isDashboard}
                className={({ isActive }) =>
                  `
                  group flex items-center gap-3 px-4 py-3
                  rounded-xl
                  transition-all duration-200
                  ${
                    isActive
                      ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }
                `
                }
              >

                <div className="opacity-90 group-hover:opacity-100">
                  {item.icon}
                </div>

                {expanded && (
                  <span className="text-sm font-medium tracking-wide">
                    {item.label}
                  </span>
                )}

              </NavLink>
            );
          })}

        </nav>
      </div>

      {/* USER CARD */}
      <div className="absolute bottom-6 left-0 w-full px-4">

        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-3 flex items-center gap-3">

          <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center font-semibold text-white">
            V
          </div>

          {expanded && (
            <div className="text-xs">
              <p className="font-medium text-white">
                Vishal Raj K
              </p>
              <p className="text-gray-400 truncate max-w-[140px]">
                vishal.raj-k-ext@hpe.com
              </p>
            </div>
          )}

        </div>

      </div>

    </aside>
  );
};

export default Sidebar;