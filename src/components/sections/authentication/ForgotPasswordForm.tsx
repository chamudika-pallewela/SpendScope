import {
  Button,
  Divider,
  Link,
  Stack,
  TextField,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useBreakpoints } from 'providers/useBreakpoints';
import { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';

const ForgetPasswordForm = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { up } = useBreakpoints();
  const { resetPassword } = useAuth();
  const upSM = up('sm');

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
    <form onSubmit={handleSubmit}>
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

      <Stack spacing={3}>
        <TextField
          fullWidth
          size={upSM ? 'medium' : 'small'}
          name="email"
          label="Email address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </Stack>

      <Button
        fullWidth
        size={upSM ? 'large' : 'medium'}
        type="submit"
        variant="contained"
        color="primary"
        sx={{ mt: 3 }}
        disabled={loading}
      >
        {loading ? <CircularProgress size={24} /> : 'Send Reset Password Link'}
      </Button>
      <Divider sx={{ my: 2 }}>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          OR
        </Typography>
      </Divider>
      <Typography textAlign="center" fontWeight={400} color="text.primary" variant="subtitle1">
        Remembered your Password?
      </Typography>
      <Button
        component={Link}
        href="/authentication/login"
        fullWidth
        size={upSM ? 'large' : 'medium'}
        type="submit"
        variant="contained"
        color="primary"
        sx={{ mt: 3, '&:hover': { color: 'common.white' } }}
      >
        Back to Sign-in
      </Button>
    </form>
  );
};

export default ForgetPasswordForm;
