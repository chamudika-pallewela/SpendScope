import {
  Box,
  Button,
  Card,
  Container,
  Divider,
  Link,
  Stack,
  Typography,
  Alert,
} from '@mui/material';
import IconifyIcon from 'components/base/IconifyIcon';
import SignupForm from 'components/sections/authentication/SignupForm';
import { useAuth } from '../../../contexts/AuthContext';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SignupPage = () => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleGoogleSignup = async () => {
    try {
      setError('');
      setLoading(true);
      // For Google signup, we'll assume they want to keep logged in (no 2FA)
      await loginWithGoogle(true);
      navigate('/');
    } catch (error: unknown) {
      setError((error as Error).message || 'Failed to sign up with Google');
    } finally {
      setLoading(false);
    }
  };

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
            }}
          >
            <Typography variant="h4">Sign Up</Typography>

            <Typography
              sx={{
                mt: 2,
                mb: { xs: 3, sm: 5 },
                fontSize: { xs: 'subtitle1.fontSize', sm: 'body2.fontSize' },
              }}
            >
              Already have an account?
              <Link
                href="/authentication/login"
                variant="subtitle2"
                sx={{ ml: 0.75, '&:hover': { color: 'primary.light' } }}
              >
                Sign In Now!
              </Link>
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Stack direction="row" spacing={{ xs: 1, sm: 2 }}>
              <Button
                fullWidth
                size="large"
                color="neutral"
                variant="outlined"
                sx={{ p: 1 }}
                onClick={handleGoogleSignup}
                disabled={loading}
              >
                <IconifyIcon icon="eva:google-fill" color="error.main" />
              </Button>
            </Stack>

            <Divider sx={{ my: 3 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                OR
              </Typography>
            </Divider>

            <SignupForm />
          </Card>
        </Container>
      </Stack>
    </Box>
  );
};

export default SignupPage;
