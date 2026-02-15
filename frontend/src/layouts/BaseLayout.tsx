import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import { authService } from '../auth/authService';

const BaseLayout = () => {
  const role = authService.getRole();
  const [expanded, setExpanded] = useState(false);

  if (!role) return null;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar
        role={role}
        expanded={expanded}
        onHover={setExpanded}
      />

      <div
        className={`flex flex-col transition-all duration-300 w-full ${
          expanded ? 'ml-64' : 'ml-16'
        }`}
      >
        <Topbar />
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default BaseLayout;
