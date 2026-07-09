import { Outlet, useLocation } from 'react-router-dom';
import { useLayoutEffect, useState } from 'react';
import { Box } from 'grommet';
import Topbar from '../components/Topbar';
import Sidebar from '../components/Sidebar';
import { authService } from '../auth/authService';

const VendorLayout = () => {
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const location = useLocation();
  const role = 'VENDOR';

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

  return (
    <Box direction="row" fill background="#F4F5F7" style={{ minHeight: '100vh' }}>
      <Sidebar role={role} expanded={sidebarExpanded} onHover={setSidebarExpanded} />
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
          pad={{ horizontal: '26px', vertical: '22px' }}
          background="#F4F5F7"
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default VendorLayout;
