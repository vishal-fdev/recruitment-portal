import { Outlet, useLocation } from 'react-router-dom';
import { useLayoutEffect, useRef, useState } from 'react';
import { Box } from 'grommet';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import { authService } from '../auth/authService';

type Role = 'VENDOR' | 'VENDOR_MANAGER' | 'VENDOR_MANAGER_HEAD' | 'HIRING_MANAGER' | 'PANEL';

const BaseLayout = () => {
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const location = useLocation();
  const mainRef = useRef<HTMLDivElement | null>(null);
  const role = (authService.getRole() || 'VENDOR') as Role;

  const handleLogout = () => {
    authService.logout();
    window.location.href = '/login';
  };

  useLayoutEffect(() => {
    const resetScroll = () => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      if (mainRef.current) {
        mainRef.current.scrollTop = 0;
        mainRef.current.scrollLeft = 0;
        mainRef.current.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      }
    };

    resetScroll();
    const frame = window.requestAnimationFrame(resetScroll);
    const timer = window.setTimeout(resetScroll, 0);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [location.pathname]);

  return (
    <Box direction="row" fill background="#F3F4F6" style={{ minHeight: '100vh' }}>
      <Sidebar role={role} expanded={sidebarExpanded} onHover={setSidebarExpanded} />
      <Box flex>
        <Topbar role={role} onLogout={handleLogout} />
        <Box
          key={location.pathname}
          as="main"
          ref={mainRef}
          flex
          overflow="auto"
          pad="large"
          background="#F3F4F6"
          data-scroll-root="true"
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default BaseLayout;
