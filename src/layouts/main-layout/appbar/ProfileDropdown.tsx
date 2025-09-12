import {
  Avatar,
  Box,
  Button,
  Divider,
  IconButton,
  Link,
  Menu,
  Stack,
  Typography,
} from '@mui/material';
import ProfileImage from 'assets/avatar.jpg';
import IconifyIcon from 'components/base/IconifyIcon';
import { MouseEvent, useState } from 'react';
import { Fragment } from 'react/jsx-runtime';
import { useAuth } from '../../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

/* ------------------------Profile dropdown Data --------------------------- */
const profileData = [
  {
    href: '/profile',
    title: 'My Profile',
    subtitle: 'Account Settings',
    icon: 'fa:user-circle-o',
    color: 'primary.light',
  },
];
/* -------------------------------------------------------------------------- */
const ProfileDropdown = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { currentUser, userProfile, logout } = useAuth();
  const navigate = useNavigate();

  const handleOpenDropdown = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/authentication/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
    handleClose();
  };
  return (
    <Fragment>
      <IconButton sx={{ p: 0, position: 'relative' }} onClick={handleOpenDropdown}>
        <Avatar
          alt="Avatar"
          src={currentUser?.photoURL || ProfileImage}
          sx={{ width: { xs: 40, md: 45, xl: 60 }, height: { xs: 40, md: 45, xl: 60 } }}
        />
      </IconButton>
      {/* Profile Menu Dropdown*/}
      <Menu
        id="profile-menu"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        sx={{
          '& .MuiMenu-paper': {
            width: 280,
            bgcolor: 'common.white',
          },
        }}
      >
        <Box p={3}>
          <Typography variant="subtitle1" color="text.primary">
            User Profile
          </Typography>
          <Stack direction="row" py={2.5} spacing={1.5} alignItems="center">
            <Avatar
              src={currentUser?.photoURL || ProfileImage}
              alt="Profile Image"
              sx={{ width: 65, height: 65 }}
            />
            <Box>
              <Typography variant="subtitle2" color="text.primary" fontWeight={600}>
                {userProfile?.displayName || currentUser?.displayName || 'User'}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {userProfile?.username || 'Member'}
              </Typography>
              <Typography
                variant="subtitle2"
                color="textSecondary"
                display="flex"
                alignItems="center"
                gap={0.5}
              >
                <IconifyIcon icon="majesticons:mail-line" />
                {currentUser?.email || 'No email'}
              </Typography>
            </Box>
          </Stack>
          <Divider />
          {profileData.map((profileItem) => (
            <Box key={profileItem.title} sx={{ py: 1.5, px: 0 }}>
              <Link href={profileItem.href}>
                <Stack direction="row" spacing={1.5}>
                  <Stack
                    direction="row"
                    sx={{
                      width: 45,
                      height: 45,
                      bgcolor: 'neutral.light',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 1.5,
                    }}
                  >
                    <Avatar
                      variant="rounded"
                      sx={{
                        minwidth: 24,
                        height: 24,
                        bgcolor: 'transparent',
                      }}
                    >
                      <IconifyIcon icon={profileItem.icon} color={profileItem.color} />
                    </Avatar>
                  </Stack>
                  <div>
                    <Typography
                      variant="subtitle2"
                      fontWeight={600}
                      noWrap
                      sx={{
                        width: 150,
                      }}
                    >
                      {profileItem.title}
                    </Typography>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        width: 150,
                      }}
                      noWrap
                    >
                      {profileItem.subtitle}
                    </Typography>
                  </div>
                </Stack>
              </Link>
            </Box>
          ))}
          <Box mt={1.25}>
            <Button onClick={handleLogout} variant="outlined" color="error" fullWidth>
              Logout
            </Button>
          </Box>
        </Box>
      </Menu>
    </Fragment>
  );
};

export default ProfileDropdown;
