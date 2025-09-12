import { Box, Button, Card, Container, Stack, Typography, Alert } from '@mui/material';
import IconifyIcon from 'components/base/IconifyIcon';
import { useAuth } from '../../../contexts/AuthContext';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const VerifyEmailPage = () => {
  const [error, setError] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const { currentUser, sendVerificationEmail, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) {
      navigate('/authentication/login');
    }
  }, [currentUser, navigate]);

  const handleResendVerification = async () => {
    try {
      setError('');
      setResendLoading(true);
      await sendVerificationEmail();
      setError('Verification email sent! Please check your inbox.');
    } catch (error: unknown) {
      setError((error as Error).message || 'Failed to send verification email');
    } finally {
      setResendLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/authentication/login');
    } catch (error: unknown) {
      setError((error as Error).message || 'Failed to logout');
    }
  };

  if (!currentUser) {
    return null;
  }

  return (
    <Box
      sx={{
        width: 1,
        position: 'relative',
        zIndex: 100,
      }}
    >
      <Stack alignItems="center" justifyContent="center" sx={{ height: 1 }}>
        <Container maxWidth="sm">
          <Card
            sx={{
              p: { xs: 3, sm: 5 },
              width: 1,
              textAlign: 'center',
            }}
          >
            <IconifyIcon
              icon="eva:email-outline"
              sx={{
                fontSize: 80,
                color: 'primary.main',
                mb: 2,
              }}
            />

            <Typography variant="h4" sx={{ mb: 2 }}>
              Verify Your Email
            </Typography>

            <Typography
              variant="body1"
              sx={{
                mb: 3,
                color: 'text.secondary',
              }}
            >
              We've sent a verification email to <strong>{currentUser.email}</strong>
            </Typography>

            <Typography
              variant="body2"
              sx={{
                mb: 4,
                color: 'text.secondary',
              }}
            >
              Please check your email and click the verification link to activate your account.
            </Typography>

            {error && (
              <Alert severity={error.includes('sent') ? 'success' : 'error'} sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <Stack spacing={2}>
              <Button
                fullWidth
                size="large"
                variant="contained"
                color="primary"
                onClick={handleResendVerification}
                disabled={resendLoading}
                startIcon={
                  resendLoading ? (
                    <IconifyIcon icon="eos-icons:loading" />
                  ) : (
                    <IconifyIcon icon="eva:refresh-outline" />
                  )
                }
              >
                {resendLoading ? 'Sending...' : 'Resend Verification Email'}
              </Button>

              <Button
                fullWidth
                size="large"
                variant="outlined"
                color="primary"
                onClick={handleLogout}
                disabled={resendLoading}
              >
                Back to Login
              </Button>
            </Stack>
          </Card>
        </Container>
      </Stack>
    </Box>
  );
};

export default VerifyEmailPage;
