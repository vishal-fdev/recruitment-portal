// src/layouts/VendorLayout.tsx

import { Outlet } from "react-router-dom";
import { useState } from "react";
import Topbar from "../components/Topbar";
import Sidebar from "../components/Sidebar";
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
      <Sidebar
        role={role}
        expanded={sidebarExpanded}
        onHover={setSidebarExpanded}
      />

      {/* MAIN CONTENT */}

      <div
        className={`
          flex flex-1 flex-col transition-all duration-300
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
