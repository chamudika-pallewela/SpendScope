import { Box, Stack } from '@mui/material';
import MainNavbar from 'layouts/main-layout/appbar/Appbar';
import Footer from 'layouts/main-layout/footer/Footer';
import MobileSidebar from 'layouts/main-layout/sidebar/MobileSidebar';
import Sidebar from 'layouts/main-layout/sidebar/Sidebar';
import { PropsWithChildren, useState } from 'react';

const drawerWidth = { lg: 250, md: 240, sm: 230 };

const MainLayout = ({ children }: PropsWithChildren) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleDrawerClose = () => {
    setIsClosing(true);
    setMobileOpen(false);
  };

  const handleDrawerTransitionEnd = () => {
    setIsClosing(false);
  };

  const handleDrawerToggle = () => {
    if (!isClosing) {
      setMobileOpen(!mobileOpen);
    }
  };

  const handleSidebarToggle = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };
  return (
    <>
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar
          drawerWidth={drawerWidth}
          collapsed={sidebarCollapsed}
          onToggle={handleSidebarToggle}
        />
        <MobileSidebar
          onDrawerClose={handleDrawerClose}
          onDrawerTransitionEnd={handleDrawerTransitionEnd}
          mobileOpen={mobileOpen}
          drawerWidth={drawerWidth.lg}
          collapsed={sidebarCollapsed}
        />

        <Stack
          sx={{
            display: 'flex',
            flexGrow: 1,
            width: 1,
            maxWidth: {
              xs: 1,
              md: sidebarCollapsed ? `calc(100% - 80px)` : `calc(100% - ${drawerWidth.md}px)`,
              lg: sidebarCollapsed ? `calc(100% - 80px)` : `calc(100% - ${drawerWidth.lg}px)`,
            },
            minHeight: '100vh',
            transition: 'max-width 0.3s ease',
          }}
        >
          <MainNavbar
            onDrawerToggle={handleDrawerToggle}
            onSidebarToggle={handleSidebarToggle}
            sidebarCollapsed={sidebarCollapsed}
          />
          <Box
            sx={{
              backgroundColor: { xs: 'common.white', md: 'background.paper' },
              px: { xs: 3.15, md: 5, xl: 7 },
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Box sx={{ flex: 1 }}>{children}</Box>
            <Footer />
          </Box>
        </Stack>
      </Box>
    </>
  );
};

export default MainLayout;
