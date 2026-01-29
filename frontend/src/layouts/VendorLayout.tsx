// src/layouts/VendorLayout.tsx
import { Outlet } from 'react-router-dom';
import { useState } from 'react';

import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';

const VendorLayout = () => {
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* SIDEBAR */}
      <Sidebar
        role="VENDOR"
        expanded={sidebarExpanded}
        onHover={setSidebarExpanded}
      />

      {/* MAIN CONTENT */}
      <div
        className={`
          flex flex-col flex-1 transition-all duration-300
          ${sidebarExpanded ? 'ml-64' : 'ml-16'}
        `}
      >
        <Topbar />

        <main className="flex-1 overflow-auto p-6 bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default VendorLayout;
