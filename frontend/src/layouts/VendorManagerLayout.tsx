import { Outlet, useLocation } from 'react-router-dom';
import { useLayoutEffect, useRef, useState } from 'react';
import { Box } from 'grommet';
import Topbar from '../components/Topbar';
import VendorManagerPortalSidebar from '../components/VendorManagerPortalSidebar';
import { authService } from '../auth/authService';

const VendorManagerLayout = () => {
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const location = useLocation();
  const mainRef = useRef<HTMLDivElement | null>(null);
  const role = (authService.getRole() || 'VENDOR_MANAGER') as 'VENDOR_MANAGER' | 'VENDOR_MANAGER_HEAD';

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
    <Box direction="row" fill background="#F3F5F9" style={{ minHeight: '100vh' }}>
      <VendorManagerPortalSidebar expanded={sidebarExpanded} onHover={setSidebarExpanded} role={role} />
      <Box flex>
        <Topbar role={role} onLogout={handleLogout} />
        <Box
          key={location.pathname}
          as="main"
          ref={mainRef}
          flex
          overflow="auto"
          background="#F3F5F9"
          pad="32px"
          data-scroll-root="true"
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default VendorManagerLayout;
