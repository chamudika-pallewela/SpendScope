import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Divider,
  Grid,
  FormControlLabel,
  Switch,
} from '@mui/material';
import IconifyIcon from 'components/base/IconifyIcon';
import { useAuth } from '../../../contexts/AuthContext';

const ProfileManagement: React.FC = () => {
  const { currentUser, userProfile, updateUserProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    username: userProfile?.username || '',
    displayName: userProfile?.displayName || '',
    email: currentUser?.email || '',
  });

  const handleInputChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleUpdateProfile = async () => {
    try {
      setError('');
      setSuccess('');
      setLoading(true);

      await updateUserProfile({
        username: formData.username,
        displayName: formData.displayName,
      });

      setSuccess('Profile updated successfully!');
    } catch (error: unknown) {
      setError((error as Error).message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser || !userProfile) {
    return (
      <Card>
        <CardContent>
          <Typography>Loading profile...</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" sx={{ mb: 3 }}>
          Profile Management
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Profile Information Section */}
          <Grid item xs={12}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Profile Information
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Username"
                  value={formData.username}
                  onChange={handleInputChange('username')}
                  disabled={loading}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Display Name"
                  value={formData.displayName}
                  onChange={handleInputChange('displayName')}
                  disabled={loading}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email"
                  value={formData.email}
                  disabled
                  helperText="Email cannot be changed"
                />
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={<Switch checked={currentUser.emailVerified} disabled />}
                  label={`Email Verified: ${currentUser.emailVerified ? 'Yes' : 'No'}`}
                />
              </Grid>
            </Grid>

            <Box sx={{ mt: 3 }}>
              <Button
                variant="contained"
                onClick={handleUpdateProfile}
                disabled={loading}
                startIcon={
                  loading ? <CircularProgress size={20} /> : <IconifyIcon icon="eva:save-outline" />
                }
              >
                {loading ? 'Updating...' : 'Update Profile'}
              </Button>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        {/* Account Information */}
        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Account Information
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                Member Since
              </Typography>
              <Typography variant="body1">
                {new Date(userProfile.createdAt).toLocaleDateString()}
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                Last Login
              </Typography>
              <Typography variant="body1">
                {new Date(userProfile.lastLoginAt).toLocaleDateString()}
              </Typography>
            </Grid>
          </Grid>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ProfileManagement;
