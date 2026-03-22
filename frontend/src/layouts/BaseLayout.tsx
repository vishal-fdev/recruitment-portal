// src/layouts/BaseLayout.tsx

import { Outlet } from "react-router-dom";
import { useState } from "react";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { authService } from "../auth/authService";

type Role =
  | "VENDOR"
  | "VENDOR_MANAGER"
  | "VENDOR_MANAGER_HEAD"
  | "HIRING_MANAGER";

const BaseLayout = () => {

  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  // ensure role is never null
  const role = (authService.getRole() || "VENDOR") as Role;

  const handleLogout = () => {
    authService.logout();
    window.location.href = "/login";
  };

  return (

    <div className="flex min-h-screen bg-gray-100">

      {/* SIDEBAR */}

      <Sidebar
        role={role}
        expanded={sidebarExpanded}
        onHover={setSidebarExpanded}
      />

      {/* CONTENT AREA */}

      <div
        className={`
          flex flex-col flex-1 transition-all duration-300
          ${sidebarExpanded ? "ml-64" : "ml-20"}
        `}
      >

        {/* TOPBAR */}

        <Topbar
          role={role}
          onLogout={handleLogout}
        />

        {/* PAGE CONTENT */}

        <main className="flex-1 overflow-auto p-8 bg-gray-100">
          <Outlet />
        </main>

      </div>

    </div>

  );
};

export default BaseLayout;