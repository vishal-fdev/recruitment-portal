import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import Topbar from '../components/Topbar';
import VendorManagerPortalSidebar from '../components/VendorManagerPortalSidebar';
import { authService } from '../auth/authService';

const VendorManagerLayout = () => {
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const role = (authService.getRole() || 'VENDOR_MANAGER') as 'VENDOR_MANAGER' | 'VENDOR_MANAGER_HEAD';

  const handleLogout = () => {
    authService.logout();
    window.location.href = '/login';
  };

  return (
    <div className="flex min-h-screen bg-[#F3F5F9]">
      <VendorManagerPortalSidebar
        expanded={sidebarExpanded}
        onHover={setSidebarExpanded}
        role={role}
      />

      <div className="flex flex-1 flex-col transition-all duration-300">
        <Topbar role={role} onLogout={handleLogout} />
        <main className="flex-1 overflow-auto bg-[#F3F5F9] p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default VendorManagerLayout;
