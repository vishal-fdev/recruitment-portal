// src/layouts/VendorLayout.tsx

import { Outlet } from "react-router-dom";
import { useState } from "react";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { authService } from "../auth/authService";

const VendorLayout = () => {

  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  const role = "VENDOR";

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

      {/* MAIN CONTENT */}

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

export default VendorLayout;