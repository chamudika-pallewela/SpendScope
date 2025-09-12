import { Container, Typography, Box } from '@mui/material';
import ProfileManagement from 'components/sections/profile/ProfileManagement';

const ProfilePage = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1">
          Profile Settings
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your account settings and profile information
        </Typography>
      </Box>

      <ProfileManagement />
    </Container>
  );
};

export default ProfilePage;
