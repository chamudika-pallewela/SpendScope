import { AppBar, IconButton, Link, Stack, Toolbar, Typography } from '@mui/material';
import IconifyIcon from 'components/base/IconifyIcon';
import Image from 'components/base/Image';
// import NotificationDropdown from 'layouts/main-layout/appbar/NotificationDropdown';
import ProfileDropdown from 'layouts/main-layout/appbar/ProfileDropdown';
// import SearchInput from 'layouts/main-layout/appbar/SearchInput';
// import SettingsDropdown from 'layouts/main-layout/appbar/SettingsDropdown';
// import { MouseEvent, useState } from 'react';
import { useLocation } from 'react-router-dom';
interface NavbarProps {
  onDrawerToggle: () => void;
  onSidebarToggle?: () => void;
  sidebarCollapsed?: boolean;
}
const MainNavbar = ({ onDrawerToggle, onSidebarToggle }: NavbarProps) => {
  // const [open, setOpen] = useState<null | HTMLElement>(null);

  const location = useLocation();

  // Extract the route name from the pathname
  const pathSegments = location.pathname.split('/').filter((segment) => segment.trim() !== '');

  // Handle specific routes to show proper names instead of IDs
  let routeName = 'Overview';
  if (location.pathname.includes('/uploads/') && pathSegments.length > 2) {
    routeName = 'Upload Details';
  } else if (location.pathname.includes('/profile')) {
    routeName = 'Profile';
  } else if (location.pathname.includes('/dashboard')) {
    routeName = 'Dashboard';
  } else if (pathSegments.length > 0) {
    routeName = pathSegments.pop() || 'Overview';
  }

  // const handleOpen = (event: MouseEvent<HTMLElement>) => {
  //   setOpen(event.currentTarget);
  // };

  // const handleClose = () => {
  //   setOpen(null);
  // };

  return (
    <>
      <AppBar position="sticky" sx={{ bgcolor: 'common.white' }}>
        <Toolbar
          sx={{
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: { xs: 0, lg: 2 },
          }}
        >
          <Stack direction="row" alignItems="center" gap={2} sx={{ flex: 1 }}>
            <IconButton
              onClick={onSidebarToggle}
              sx={{
                display: { xs: 'none', md: 'flex' },
                color: 'primary.darker',
              }}
            >
              <IconifyIcon icon="mingcute:menu-line" color="primary.darker" width={25} />
            </IconButton>
            <Typography
              sx={{
                display: { xs: 'none', md: 'block' },
                fontSize: { sm: 'h2.fontSize', xl: 'h1.fontSize' },
                fontWeight: 600,
                color: 'primary.darker',
                textAlign: { xs: 'center', md: 'left' },
                textTransform: 'capitalize',
              }}
            >
              {routeName}
            </Typography>
          </Stack>
          <Stack direction="row" gap={1} sx={{ display: { xs: 'flex', md: 'none' } }}>
            <Link href="/" sx={{ display: 'flex', p: 0.5 }}>
              <Image src="/bankdash.svg" alt="Logo" sx={{ width: 25 }} />
            </Link>
            <IconButton onClick={onDrawerToggle} sx={{ display: { md: 'none' } }}>
              <IconifyIcon icon="mingcute:menu-line" color="primary.darker" width={25} />
            </IconButton>
          </Stack>

          <Stack direction="row" sx={{ alignItems: 'center', gap: { xs: 2.5, xl: 3.75 } }}>
            {/* Search bar removed */}
            {/* <Box sx={{ display: { xs: 'none', md: 'block', maxWidth: 260 } }}>
              <SearchInput fullWidth={false} size={'medium'} />
            </Box> */}

            <Stack direction="row" sx={{ gap: { xs: 2.5, xl: 3.75 } }}>
              {/* Settings dropdown removed */}
              {/* <SettingsDropdown /> */}

              {/* Notification icon commented out */}
              {/* <IconButton sx={{ bgcolor: 'background.paper' }} onClick={handleOpen}>
                <IconifyIcon
                  color="error.main"
                  icon="lucide:bell-dot"
                  sx={{ width: { xs: 18, md: 20, xl: 25 }, height: { xs: 18, md: 20, xl: 25 } }}
                />
              </IconButton> */}

              {/* <NotificationDropdown open={open} onClose={handleClose} /> */}
            </Stack>
            <ProfileDropdown />
          </Stack>
        </Toolbar>
        {/* Mobile search bar removed */}
        {/* <Box sx={{ display: { xs: 'block', md: 'none' }, px: 3.15, mt: 2.5 }}>
          <SearchInput fullWidth={true} size={'small'} />
        </Box> */}
      </AppBar>
    </>
  );
};

export default MainNavbar;
