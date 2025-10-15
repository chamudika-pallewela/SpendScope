import {
  Box,
  Button,
  Container,
  Link,
  Stack,
  Typography,
  Alert,
  TextField,
  CircularProgress,
  Divider,
} from '@mui/material';
import IconifyIcon from 'components/base/IconifyIcon';
import Image from 'components/base/Image';
import { useAuth } from '../../../contexts/AuthContext';
import { useState } from 'react';

const ForgetPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      setError('Please enter your email address');
      return;
    }

    try {
      setError('');
      setSuccess('');
      setLoading(true);

      await resetPassword(email);
      setSuccess('Password reset email sent! Please check your inbox.');
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}
    >
      {/* Left Side - Forgot Password Form */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'white',
          position: 'relative',
          overflow: 'hidden',
          height: '100vh',
        }}
      >
        {/* Main Content */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            px: { xs: 3, sm: 4, md: 6 },
            py: 4,
            height: '100vh',
            overflow: 'hidden',
          }}
        >
          <Container maxWidth="sm" sx={{ width: '100%' }}>
            <Box sx={{ maxWidth: 400, mx: 'auto' }}>
              {/* Logo */}
              <Box sx={{ mb: 4, textAlign: 'center' }}>
                <Link
                  href="/"
                  sx={{
                    display: 'inline-flex',
                    gap: 2,
                    textDecoration: 'none',
                    alignItems: 'center',
                  }}
                >
                  <Image src="/bankdash.svg" alt="Logo" sx={{ width: 40, height: 40 }} />
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 700,
                      color: 'primary.main',
                      letterSpacing: 0.5,
                    }}
                  >
                    Spently
                  </Typography>
                </Link>
                <Typography
                  variant="body2"
                  sx={{
                    color: 'text.secondary',
                    fontSize: 13,
                    mt: 1,
                  }}
                >
                  Smart insights from every pound spent
                </Typography>
              </Box>

              <Typography
                variant="h3"
                sx={{
                  fontWeight: 700,
                  color: 'text.primary',
                  mb: 1,
                }}
              >
                Forgot your password?
              </Typography>

              <Typography
                variant="body1"
                sx={{
                  color: 'text.secondary',
                  mb: 4,
                }}
              >
                Please enter the email address associated with your account
              </Typography>

              {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
              )}

              {success && (
                <Alert severity="success" sx={{ mb: 3 }}>
                  {success}
                </Alert>
              )}

              <form onSubmit={handleSubmit}>
                <Stack spacing={3} sx={{ mb: 3 }}>
                  <TextField
                    fullWidth
                    label="Email address"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      },
                    }}
                  />
                </Stack>

                <Button
                  fullWidth
                  size="large"
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  sx={{
                    mb: 2,
                    py: 1.5,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontSize: '1rem',
                    fontWeight: 600,
                  }}
                >
                  {loading ? <CircularProgress size={24} /> : 'Send Reset Password Link'}
                </Button>

                <Divider sx={{ my: 3 }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    OR
                  </Typography>
                </Divider>

                <Typography
                  textAlign="center"
                  fontWeight={400}
                  color="text.primary"
                  variant="subtitle1"
                  sx={{ mb: 2 }}
                >
                  Remembered your Password?
                </Typography>

                <Button
                  component={Link}
                  href="/authentication/login"
                  fullWidth
                  size="large"
                  variant="contained"
                  sx={{
                    py: 1.5,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontSize: '1rem',
                    fontWeight: 600,
                    '&:hover': { color: 'common.white' },
                  }}
                >
                  Back to Sign-in
                </Button>
              </form>
            </Box>
          </Container>
        </Box>
      </Box>

      {/* Right Side - Illustration */}
      <Box
        sx={{
          flex: 1,
          display: { xs: 'none', lg: 'flex' },
          backgroundColor: '#8B5CF6',
          position: 'relative',
          overflow: 'hidden',
          height: '100vh',
        }}
      >
        {/* Decorative Elements */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, #8B5CF6 0%, #A855F7 100%)',
          }}
        />

        {/* Floating Icons */}
        <Box
          sx={{
            position: 'absolute',
            top: '10%',
            left: '10%',
            color: 'rgba(255, 255, 255, 0.3)',
          }}
        >
          <IconifyIcon icon="mdi:chat-processing" width={40} />
        </Box>

        <Box
          sx={{
            position: 'absolute',
            top: '20%',
            right: '15%',
            color: 'rgba(255, 255, 255, 0.3)',
          }}
        >
          <IconifyIcon icon="mdi:headphones" width={35} />
        </Box>

        <Box
          sx={{
            position: 'absolute',
            top: '30%',
            left: '20%',
            color: 'rgba(255, 255, 255, 0.3)',
          }}
        >
          <IconifyIcon icon="mdi:chat" width={30} />
        </Box>

        <Box
          sx={{
            position: 'absolute',
            top: '40%',
            right: '20%',
            color: 'rgba(255, 255, 255, 0.3)',
          }}
        >
          <IconifyIcon icon="mdi:phone" width={35} />
        </Box>

        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '15%',
            color: 'rgba(255, 255, 255, 0.3)',
          }}
        >
          <IconifyIcon icon="mdi:laptop" width={40} />
        </Box>

        <Box
          sx={{
            position: 'absolute',
            top: '60%',
            right: '10%',
            color: 'rgba(255, 255, 255, 0.3)',
          }}
        >
          <IconifyIcon icon="mdi:globe" width={35} />
        </Box>

        <Box
          sx={{
            position: 'absolute',
            top: '70%',
            left: '25%',
            color: 'rgba(255, 255, 255, 0.3)',
          }}
        >
          <IconifyIcon icon="mdi:email" width={30} />
        </Box>

        <Box
          sx={{
            position: 'absolute',
            top: '80%',
            right: '25%',
            color: 'rgba(255, 255, 255, 0.3)',
          }}
        >
          <IconifyIcon icon="mdi:help-circle" width={35} />
        </Box>

        {/* Main Illustration */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '80%',
            height: '70%',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
          }}
        >
          <Box
            sx={{
              width: '100%',
              height: '100%',
              background:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Cdefs%3E%3ClinearGradient id='grad1' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23ffffff;stop-opacity:0.1' /%3E%3Cstop offset='100%25' style='stop-color:%23ffffff;stop-opacity:0.3' /%3E%3C/linearGradient%3E%3C/defs%3E%3Ccircle cx='200' cy='150' r='120' fill='url(%23grad1)'/%3E%3C/svg%3E\") no-repeat center center",
              backgroundSize: 'contain',
            }}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default ForgetPasswordPage;
