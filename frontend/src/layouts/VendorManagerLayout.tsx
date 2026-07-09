import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useLayoutEffect, useState } from 'react';
import { Box } from 'grommet';
import Topbar from '../components/Topbar';
import VendorManagerPortalSidebar from '../components/VendorManagerPortalSidebar';
import { authService } from '../auth/authService';

const VendorManagerLayout = () => {
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const location = useLocation();
  const token = authService.getToken();
  const storedRole = authService.getRole();
  const allowedRoles = ['VENDOR_MANAGER', 'VENDOR_MANAGER_HEAD', 'BADGED_HIRING_MANAGER', 'BADGED_RECRUITER'];
  const role = storedRole as 'VENDOR_MANAGER' | 'VENDOR_MANAGER_HEAD' | 'BADGED_HIRING_MANAGER' | 'BADGED_RECRUITER' | null;

  const handleLogout = () => {
    authService.logout();
    window.location.href = '/login';
  };

  useLayoutEffect(() => {
    const resetScroll = () => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };

    resetScroll();
    const frame = window.requestAnimationFrame(resetScroll);
    const timer = window.setTimeout(resetScroll, 60);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [location.pathname]);

  if (!token || !role || !allowedRoles.includes(role)) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(`${location.pathname}${location.search}`)}`} replace />;
  }

  return (
    <Box direction="row" fill background="#F4F5F7" style={{ minHeight: '100vh' }}>
      <VendorManagerPortalSidebar expanded={sidebarExpanded} onHover={setSidebarExpanded} role={role} />
      <Box
        flex
        style={{
          marginLeft: sidebarExpanded ? 220 : 88,
          minWidth: 0,
          transition: 'margin-left 0.2s ease',
        }}
      >
        <Topbar role={role} onLogout={handleLogout} />
        <Box
          as="main"
          flex
          background="#F4F5F7"
          pad={{ horizontal: '32px', vertical: '34px' }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default VendorManagerLayout;


